-- =============================================================================
-- Migration: Add Work Sessions Feature
-- =============================================================================
-- This migration adds the work_sessions table and updates the todos table
-- to support work sessions and tags.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Create work_sessions table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  date DATE,
  description TEXT,

  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_work_sessions_user_id ON work_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_completed ON work_sessions(completed);
CREATE INDEX IF NOT EXISTS idx_work_sessions_date ON work_sessions(date DESC);

-- -----------------------------------------------------------------------------
-- 2. Update todos table
-- -----------------------------------------------------------------------------
-- Add work_session_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'work_session_id'
  ) THEN
    ALTER TABLE todos ADD COLUMN work_session_id UUID REFERENCES work_sessions(id) ON DELETE SET NULL;
    CREATE INDEX idx_todos_work_session_id ON todos(work_session_id);
  END IF;
END $$;

-- Add tags column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'tags'
  ) THEN
    ALTER TABLE todos ADD COLUMN tags TEXT;
  END IF;
END $$;

-- Make patient_id nullable if it's not already
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos'
      AND column_name = 'patient_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE todos ALTER COLUMN patient_id DROP NOT NULL;
  END IF;
END $$;

-- Add tags column to consultations if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consultations' AND column_name = 'tags'
  ) THEN
    ALTER TABLE consultations ADD COLUMN tags TEXT;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Add updated_at trigger for work_sessions
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS update_work_sessions_updated_at ON work_sessions;
CREATE TRIGGER update_work_sessions_updated_at
  BEFORE UPDATE ON work_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 4. Enable RLS on work_sessions
-- -----------------------------------------------------------------------------
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own work sessions" ON work_sessions;
DROP POLICY IF EXISTS "Users can insert their own work sessions" ON work_sessions;
DROP POLICY IF EXISTS "Users can update their own work sessions" ON work_sessions;
DROP POLICY IF EXISTS "Users can delete their own work sessions" ON work_sessions;

-- Create RLS policies for work_sessions
CREATE POLICY "Users can view their own work sessions"
  ON work_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own work sessions"
  ON work_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own work sessions"
  ON work_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own work sessions"
  ON work_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 5. Enable Realtime for work_sessions
-- -----------------------------------------------------------------------------
-- Note: This might fail if the table is already in the publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE work_sessions;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Table already in publication
END $$;

-- =============================================================================
-- Migration Complete
-- =============================================================================
