// Enums
export enum TypeObservation {
  CONSULTATION = "consultation",
  SUIVI = "suivi",
  URGENCE = "urgence",
  TELEPHONE = "telephone",
  RESULTATS = "resultats",
  COURRIER = "courrier",
  REUNION = "reunion",
  NOTE = "note",
}

export enum TypeTodo {
  RAPPEL = "rappel",
  PRESCRIPTION = "prescription",
  EXAMEN = "examen",
  COURRIER = "courrier",
  RDV = "rdv",
  AVIS = "avis",
  ADMINISTRATIF = "administratif",
  AUTRE = "autre",
}

export enum UrgenceTodo {
  BASSE = "basse",
  NORMALE = "normale",
  HAUTE = "haute",
  CRITIQUE = "critique",
}

export enum ModuleType {
  DOSSIERS = "dossiers",
  OBSERVATIONS = "observations",
  TODOS = "todos",
}

// Main types
export interface Patient {
  id: string;
  user_id?: string;
  nom: string;
  prenom: string;
  sexe?: "M" | "F" | "autre";
  date_naissance?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  secteur?: string;
  notes?: string;
  resume_ia?: string;
  resume_updated_at?: string;
  favoris?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PatientWithObservations extends Patient {
  observations?: Observation[];
  todos?: Todo[];
}

export interface Consultation {
  id: string;
  user_id?: string;
  date: string;
  type?: string;
  titre?: string;
  tags?: string;
  created_at?: string;
}

export interface Observation {
  id: string;
  user_id?: string;
  patient_id: string;
  consultation_id?: string;
  date: string;
  type_observation: TypeObservation;
  contenu?: string;
  age_patient_jours?: number;
  created_at?: string;
  updated_at?: string;
  // Relations (populated on fetch)
  patient?: Patient;
}

export interface Todo {
  id: string;
  user_id?: string;
  observation_id?: string;
  patient_id?: string;
  work_session_id?: string;
  contenu: string;
  type_todo: TypeTodo;
  urgence: UrgenceTodo;
  date_echeance?: string;
  annotations?: string;
  tags?: string;
  completed: boolean;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
  // Relations (populated on fetch)
  patient?: Patient;
  observation?: Observation;
  work_session?: WorkSession;
}

export interface WorkSession {
  id: string;
  user_id?: string;
  name: string;
  date?: string;
  description?: string;
  tags?: string;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
}

// Tab system
export interface Tab {
  id: string;
  type: "patient" | "consultation" | "todo" | "list" | "new" | "work-session";
  module: ModuleType;
  title: string;
  data?: {
    patientId?: string;
    consultationId?: string;
    workSessionId?: string;
    todoId?: string;
    filters?: Record<string, unknown>;
  };
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}
