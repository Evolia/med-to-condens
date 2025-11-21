"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createBrowserClient } from "@/lib/supabase/client";
import { Todo } from "@/types";
import { useAuth } from "./use-auth";

const TODOS_KEY = "todos";
const TAGS_KEY = "tags";

export function useTodos(filters?: { completed?: boolean; patientId?: string }) {
  const { user } = useAuth();
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: [TODOS_KEY, filters],
    queryFn: async () => {
      let query = supabase
        .from("todos")
        .select(`
          *,
          patient:patients(id, nom, prenom),
          observation:observations(id, date, type_observation)
        `)
        .order("urgence", { ascending: false })
        .order("date_echeance", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (filters?.completed !== undefined) {
        query = query.eq("completed", filters.completed);
      }

      if (filters?.patientId) {
        query = query.eq("patient_id", filters.patientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Todo[];
    },
    enabled: !!user,
  });
}

export function useActiveTodos() {
  return useTodos({ completed: false });
}

export function useCompletedTodos() {
  return useTodos({ completed: true });
}

export function useTodo(todoId: string | undefined) {
  const { user } = useAuth();
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: [TODOS_KEY, todoId],
    queryFn: async () => {
      if (!todoId) return null;

      const { data, error } = await supabase
        .from("todos")
        .select(`
          *,
          patient:patients(id, nom, prenom),
          observation:observations(id, date, type_observation)
        `)
        .eq("id", todoId)
        .single();

      if (error) throw error;
      return data as Todo;
    },
    enabled: !!user && !!todoId,
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      todo: Omit<Todo, "id" | "created_at" | "updated_at" | "user_id" | "completed" | "completed_at">
    ) => {
      const { data, error } = await supabase
        .from("todos")
        .insert({
          ...todo,
          user_id: user?.id,
          completed: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Todo;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [TODOS_KEY] });
      // Invalidate tags cache if todo has tags
      if (data.tags) {
        queryClient.invalidateQueries({ queryKey: [TAGS_KEY, "todo-tags"] });
      }
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Todo> & { id: string }) => {
      const { data, error } = await supabase
        .from("todos")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Todo;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [TODOS_KEY] });
      queryClient.invalidateQueries({ queryKey: [TODOS_KEY, data.id] });
      // Invalidate tags cache if todo has tags
      if (data.tags) {
        queryClient.invalidateQueries({ queryKey: [TAGS_KEY, "todo-tags"] });
      }
    },
  });
}

export function useCompleteTodo() {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();

  return useMutation({
    mutationFn: async (todoId: string) => {
      const { data, error } = await supabase
        .from("todos")
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq("id", todoId)
        .select()
        .single();

      if (error) throw error;
      return data as Todo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TODOS_KEY] });
    },
  });
}

export function useUncompleteTodo() {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();

  return useMutation({
    mutationFn: async (todoId: string) => {
      const { data, error } = await supabase
        .from("todos")
        .update({
          completed: false,
          completed_at: null,
        })
        .eq("id", todoId)
        .select()
        .single();

      if (error) throw error;
      return data as Todo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TODOS_KEY] });
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();

  return useMutation({
    mutationFn: async (todoId: string) => {
      const { error } = await supabase.from("todos").delete().eq("id", todoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TODOS_KEY] });
    },
  });
}
