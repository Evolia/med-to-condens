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
  useSectors,
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

// Work Sessions
export {
  useWorkSessions,
  useActiveWorkSessions,
  useWorkSession,
  useCreateWorkSession,
  useUpdateWorkSession,
  useCompleteWorkSession,
  useDeleteWorkSession,
} from "./use-work-sessions";

// Tags
export {
  useTags,
  useSectorTags,
  useConsultationTags,
  useTodoTags,
} from "./use-tags";
export type { TagSource } from "./use-tags";
