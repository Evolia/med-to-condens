// Enums
export enum TypeObservation {
  CONSULTATION = "consultation",
  SUIVI = "suivi",
  URGENCE = "urgence",
  TELEPHONE = "telephone",
  RESULTATS = "resultats",
  COURRIER = "courrier",
  NOTE = "note",
}

export enum TypeTodo {
  RAPPEL = "rappel",
  PRESCRIPTION = "prescription",
  EXAMEN = "examen",
  COURRIER = "courrier",
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
  PATIENTS = "patients",
  CONSULTATIONS = "consultations",
  TODOS = "todos",
  AGENDA = "agenda",
  STATISTIQUES = "statistiques",
}

// Main types
export interface Patient {
  id: string;
  nom: string;
  prenom: string;
  sexe: "M" | "F" | "autre";
  date_naissance: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  secteur?: number;
  notes?: string;
  resume_ia?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Consultation {
  id: string;
  date: string;
  type: string;
  titre?: string;
  patient_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Observation {
  id: string;
  patient_id: string;
  consultation_id?: string;
  date: string;
  type_observation: TypeObservation;
  contenu: string;
  age_patient_jours?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Todo {
  id: string;
  observation_id?: string;
  patient_id: string;
  contenu: string;
  type_todo: TypeTodo;
  urgence: UrgenceTodo;
  date_echeance?: string;
  annotations?: string;
  completed: boolean;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Tab system
export interface Tab {
  id: string;
  type: "patient" | "consultation" | "todo" | "list" | "new";
  module: ModuleType;
  title: string;
  data?: {
    patientId?: string;
    consultationId?: string;
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
