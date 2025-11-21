-- Migration: Add favoris field and merge patients support
-- Run this script to add favorites functionality and patient merge capability

-- =============================================================================
-- 1. ADD FAVORIS FIELD TO PATIENTS
-- =============================================================================

-- Add favoris column to patients table
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS favoris BOOLEAN DEFAULT FALSE;

-- Create index for faster favoris queries
CREATE INDEX IF NOT EXISTS idx_patients_favoris ON patients(favoris) WHERE favoris = true;

-- =============================================================================
-- 2. CREATE PATIENT MERGE HISTORY TABLE
-- =============================================================================

-- Table to track merged patients (for audit and potential rollback)
CREATE TABLE IF NOT EXISTS patient_merges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- The patient that was kept (target)
  target_patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

  -- The patient that was merged and deleted (source)
  source_patient_id UUID NOT NULL,
  source_patient_data JSONB NOT NULL, -- Backup of merged patient data

  -- Merge details
  observations_moved INTEGER DEFAULT 0,
  todos_moved INTEGER DEFAULT 0,

  -- Metadata
  merged_at TIMESTAMPTZ DEFAULT NOW(),
  merged_by UUID REFERENCES auth.users(id)
);

-- Index for finding merge history
CREATE INDEX IF NOT EXISTS idx_patient_merges_user ON patient_merges(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_merges_target ON patient_merges(target_patient_id);

-- RLS for patient_merges
ALTER TABLE patient_merges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own merge history" ON patient_merges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own merge records" ON patient_merges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 3. CREATE MERGE PATIENTS FUNCTION
-- =============================================================================

-- Function to merge two patients
-- Keeps target patient identity, moves all observations/todos from source to target
CREATE OR REPLACE FUNCTION merge_patients(
  p_target_id UUID,
  p_source_id UUID,
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_source_data JSONB;
  v_obs_count INTEGER;
  v_todos_count INTEGER;
  v_result JSONB;
BEGIN
  -- Verify both patients belong to user
  IF NOT EXISTS (SELECT 1 FROM patients WHERE id = p_target_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'Target patient not found or access denied';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM patients WHERE id = p_source_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'Source patient not found or access denied';
  END IF;

  -- Backup source patient data
  SELECT to_jsonb(p.*) INTO v_source_data FROM patients p WHERE id = p_source_id;

  -- Move observations from source to target
  UPDATE observations
  SET patient_id = p_target_id
  WHERE patient_id = p_source_id AND user_id = p_user_id;
  GET DIAGNOSTICS v_obs_count = ROW_COUNT;

  -- Move todos from source to target
  UPDATE todos
  SET patient_id = p_target_id
  WHERE patient_id = p_source_id AND user_id = p_user_id;
  GET DIAGNOSTICS v_todos_count = ROW_COUNT;

  -- Update mail_imports references
  UPDATE mail_imports
  SET patient_id = p_target_id
  WHERE patient_id = p_source_id AND user_id = p_user_id;

  -- Create merge history record
  INSERT INTO patient_merges (
    user_id,
    target_patient_id,
    source_patient_id,
    source_patient_data,
    observations_moved,
    todos_moved,
    merged_by
  ) VALUES (
    p_user_id,
    p_target_id,
    p_source_id,
    v_source_data,
    v_obs_count,
    v_todos_count,
    p_user_id
  );

  -- Delete source patient
  DELETE FROM patients WHERE id = p_source_id AND user_id = p_user_id;

  -- Return result
  v_result := jsonb_build_object(
    'success', true,
    'target_id', p_target_id,
    'source_id', p_source_id,
    'observations_moved', v_obs_count,
    'todos_moved', v_todos_count
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. GRANT PERMISSIONS
-- =============================================================================

-- Grant execute permission on merge function
GRANT EXECUTE ON FUNCTION merge_patients(UUID, UUID, UUID) TO authenticated;

-- Verify changes
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'patients' AND column_name = 'favoris';
