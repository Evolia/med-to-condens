"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createBrowserClient } from "@/lib/supabase/client";
import { WorkSession, Todo } from "@/types";
import { useAuth } from "./use-auth";

const WORK_SESSIONS_KEY = "work_sessions";
const TAGS_KEY = "tags";

export interface SessionStats {
  total: number;
  completed: number;
}

// Hook to get todo stats for all sessions at once
export function useWorkSessionsStats() {
  const { user } = useAuth();
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: [WORK_SESSIONS_KEY, "stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("todos")
        .select("work_session_id, completed")
        .not("work_session_id", "is", null);

      if (error) throw error;

      // Group by session and calculate stats
      const stats: Record<string, SessionStats> = {};
      (data as Pick<Todo, "work_session_id" | "completed">[]).forEach((todo) => {
        if (!todo.work_session_id) return;

        if (!stats[todo.work_session_id]) {
          stats[todo.work_session_id] = { total: 0, completed: 0 };
        }
        stats[todo.work_session_id].total += 1;
        if (todo.completed) {
          stats[todo.work_session_id].completed += 1;
        }
      });

      return stats;
    },
    enabled: !!user,
  });
}

export function useWorkSessions(filters?: { completed?: boolean }) {
  const { user } = useAuth();
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: [WORK_SESSIONS_KEY, filters],
    queryFn: async () => {
      let query = supabase
        .from("work_sessions")
        .select("*")
        .order("date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (filters?.completed !== undefined) {
        query = query.eq("completed", filters.completed);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as WorkSession[];
    },
    enabled: !!user,
  });
}

export function useActiveWorkSessions() {
  return useWorkSessions({ completed: false });
}

export function useWorkSession(sessionId: string | undefined) {
  const { user } = useAuth();
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: [WORK_SESSIONS_KEY, sessionId],
    queryFn: async () => {
      if (!sessionId) return null;

      const { data, error } = await supabase
        .from("work_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (error) throw error;
      return data as WorkSession;
    },
    enabled: !!user && !!sessionId,
  });
}

export function useCreateWorkSession() {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      session: Omit<WorkSession, "id" | "created_at" | "updated_at" | "user_id" | "completed">
    ) => {
      const { data, error } = await supabase
        .from("work_sessions")
        .insert({
          ...session,
          user_id: user?.id,
          completed: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as WorkSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [WORK_SESSIONS_KEY] });
      // Invalidate tags cache if session has tags
      if (data.tags) {
        queryClient.invalidateQueries({ queryKey: [TAGS_KEY, "work-session-tags"] });
      }
    },
  });
}

export function useUpdateWorkSession() {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WorkSession> & { id: string }) => {
      const { data, error } = await supabase
        .from("work_sessions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as WorkSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [WORK_SESSIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [WORK_SESSIONS_KEY, data.id] });
      // Invalidate tags cache if session has tags
      if (data.tags) {
        queryClient.invalidateQueries({ queryKey: [TAGS_KEY, "work-session-tags"] });
      }
    },
  });
}

export function useCompleteWorkSession() {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase
        .from("work_sessions")
        .update({ completed: true })
        .eq("id", sessionId)
        .select()
        .single();

      if (error) throw error;
      return data as WorkSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WORK_SESSIONS_KEY] });
    },
  });
}

export function useDeleteWorkSession() {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("work_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WORK_SESSIONS_KEY] });
    },
  });
}
