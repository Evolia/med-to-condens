"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createBrowserClient } from "@/lib/supabase/client";
import { Observation } from "@/types";
import { useAuth } from "./use-auth";

const OBSERVATIONS_KEY = "observations";

export function useObservations(filters?: {
  patientId?: string;
  consultationId?: string;
  date?: string;
}) {
  const { user } = useAuth();
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: [OBSERVATIONS_KEY, filters],
    queryFn: async () => {
      let query = supabase
        .from("observations")
        .select(`
          *,
          patient:patients(id, nom, prenom, date_naissance, secteur)
        `)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (filters?.patientId) {
        query = query.eq("patient_id", filters.patientId);
      }

      if (filters?.consultationId) {
        query = query.eq("consultation_id", filters.consultationId);
      }

      if (filters?.date) {
        query = query.eq("date", filters.date);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Observation[];
    },
    enabled: !!user,
  });
}

export function useTodayObservations() {
  const today = new Date().toISOString().split("T")[0];
  return useObservations({ date: today });
}

export function useObservation(observationId: string | undefined) {
  const { user } = useAuth();
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: [OBSERVATIONS_KEY, observationId],
    queryFn: async () => {
      if (!observationId) return null;

      const { data, error } = await supabase
        .from("observations")
        .select(`
          *,
          patient:patients(id, nom, prenom, date_naissance, secteur)
        `)
        .eq("id", observationId)
        .single();

      if (error) throw error;
      return data as Observation;
    },
    enabled: !!user && !!observationId,
  });
}

export function useCreateObservation() {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      observation: Omit<Observation, "id" | "created_at" | "updated_at" | "user_id">
    ) => {
      const { data, error } = await supabase
        .from("observations")
        .insert({
          ...observation,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Observation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OBSERVATIONS_KEY] });
    },
  });
}

export function useUpdateObservation() {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Observation> & { id: string }) => {
      const { data, error } = await supabase
        .from("observations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Observation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [OBSERVATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [OBSERVATIONS_KEY, data.id] });
    },
  });
}

export function useDeleteObservation() {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();

  return useMutation({
    mutationFn: async (observationId: string) => {
      const { error } = await supabase
        .from("observations")
        .delete()
        .eq("id", observationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OBSERVATIONS_KEY] });
    },
  });
}

export function useCreateBulkObservations() {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      observations: Omit<Observation, "id" | "created_at" | "updated_at" | "user_id">[]
    ) => {
      const { data, error } = await supabase
        .from("observations")
        .insert(
          observations.map((obs) => ({
            ...obs,
            user_id: user?.id,
          }))
        )
        .select();

      if (error) throw error;
      return data as Observation[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OBSERVATIONS_KEY] });
    },
  });
}
