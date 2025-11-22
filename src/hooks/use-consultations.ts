"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createBrowserClient } from "@/lib/supabase/client";
import { Consultation } from "@/types";
import { useAuth } from "./use-auth";

const CONSULTATIONS_KEY = "consultations";
const TAGS_KEY = "tags";

export function useConsultations(filters?: { date?: string }) {
  const { user } = useAuth();
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: [CONSULTATIONS_KEY, filters],
    queryFn: async () => {
      let query = supabase
        .from("consultations")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (filters?.date) {
        query = query.eq("date", filters.date);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Consultation[];
    },
    enabled: !!user,
  });
}

export function useConsultation(consultationId: string | undefined) {
  const { user } = useAuth();
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: [CONSULTATIONS_KEY, consultationId],
    queryFn: async () => {
      if (!consultationId) return null;

      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .eq("id", consultationId)
        .single();

      if (error) throw error;
      return data as Consultation;
    },
    enabled: !!user && !!consultationId,
  });
}

export function useCreateConsultation() {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      consultation: Omit<Consultation, "id" | "created_at" | "user_id">
    ) => {
      const { data, error } = await supabase
        .from("consultations")
        .insert({
          ...consultation,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Consultation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [CONSULTATIONS_KEY] });
      // Invalidate tags cache if consultation has tags
      if (data.tags) {
        queryClient.invalidateQueries({ queryKey: [TAGS_KEY, "consultation-tags"] });
      }
    },
  });
}

export function useUpdateConsultation() {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Consultation> & { id: string }) => {
      console.log("Updating consultation:", id, "with updates:", updates);

      const { data, error } = await supabase
        .from("consultations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Supabase error details:", error);
        throw new Error(`${error.message}${error.hint ? ` (Hint: ${error.hint})` : ''}${error.details ? ` - ${error.details}` : ''}`);
      }
      return data as Consultation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [CONSULTATIONS_KEY] });
      queryClient.invalidateQueries({
        queryKey: [CONSULTATIONS_KEY, data.id],
      });
      // Invalidate tags cache if consultation has tags
      if (data.tags) {
        queryClient.invalidateQueries({ queryKey: [TAGS_KEY, "consultation-tags"] });
      }
    },
  });
}

export function useDeleteConsultation() {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();

  return useMutation({
    mutationFn: async ({
      consultationId,
      deleteObservations = false
    }: {
      consultationId: string;
      deleteObservations?: boolean;
    }) => {
      if (deleteObservations) {
        // Delete all observations linked to this consultation
        const { error: obsError } = await supabase
          .from("observations")
          .delete()
          .eq("consultation_id", consultationId);

        if (obsError) throw obsError;
      } else {
        // Just unlink observations from the consultation
        const { error: unlinkError } = await supabase
          .from("observations")
          .update({ consultation_id: null })
          .eq("consultation_id", consultationId);

        if (unlinkError) throw unlinkError;
      }

      // Delete the consultation
      const { error } = await supabase
        .from("consultations")
        .delete()
        .eq("id", consultationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONSULTATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: ["observations"] });
    },
  });
}
