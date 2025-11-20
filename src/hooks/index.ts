export { useSupabase } from "./use-supabase";
export { useAuth } from "./use-auth";

// Patients
export {
  usePatients,
  usePatient,
  useSearchPatients,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
} from "./use-patients";

// Observations
export {
  useObservations,
  useTodayObservations,
  useObservation,
  useCreateObservation,
  useUpdateObservation,
  useDeleteObservation,
  useCreateBulkObservations,
} from "./use-observations";

// Todos
export {
  useTodos,
  useActiveTodos,
  useCompletedTodos,
  useTodo,
  useCreateTodo,
  useUpdateTodo,
  useCompleteTodo,
  useUncompleteTodo,
  useDeleteTodo,
} from "./use-todos";

// Consultations
export {
  useConsultations,
  useConsultation,
  useCreateConsultation,
  useUpdateConsultation,
  useDeleteConsultation,
} from "./use-consultations";

// AI
export { useGenerateSummary, useAnalyzeMail } from "./use-ai";

// Realtime
export { useRealtimeSync, RealtimeProvider } from "./use-realtime";
