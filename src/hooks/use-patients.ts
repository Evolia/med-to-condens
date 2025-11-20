"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createBrowserClient } from "@/lib/supabase/client";
import { Patient } from "@/types";
import { useAuth } from "./use-auth";

const PATIENTS_KEY = "patients";

export function usePatients() {
  const { user } = useAuth();
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: [PATIENTS_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("nom", { ascending: true })
        .order("prenom", { ascending: true });

      if (error) throw error;
      return data as Patient[];
    },
    enabled: !!user,
  });
}

export function usePatient(patientId: string | undefined) {
  const { user } = useAuth();
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: [PATIENTS_KEY, patientId],
    queryFn: async () => {
      if (!patientId) return null;

      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();

      if (error) throw error;
      return data as Patient;
    },
    enabled: !!user && !!patientId,
  });
}

export function useSearchPatients(searchTerm: string) {
  const { user } = useAuth();
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: [PATIENTS_KEY, "search", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) {
        // Return all patients if no search term
        const { data, error } = await supabase
          .from("patients")
          .select("*")
          .order("nom", { ascending: true })
          .order("prenom", { ascending: true });

        if (error) throw error;
        return data as Patient[];
      }

      // Use the search function for fuzzy matching
      const { data, error } = await supabase.rpc("search_patients", {
        p_user_id: user?.id,
        p_search_term: searchTerm,
      });

      if (error) throw error;
      return data as Patient[];
    },
    enabled: !!user,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (patient: Omit<Patient, "id" | "created_at" | "updated_at" | "user_id">) => {
      const { data, error } = await supabase
        .from("patients")
        .insert({
          ...patient,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PATIENTS_KEY] });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Patient> & { id: string }) => {
      const { data, error } = await supabase
        .from("patients")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Patient;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PATIENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PATIENTS_KEY, data.id] });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();

  return useMutation({
    mutationFn: async (patientId: string) => {
      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", patientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PATIENTS_KEY] });
    },
  });
}

export function useSectors() {
  const { user } = useAuth();
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: [PATIENTS_KEY, "sectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("secteur")
        .not("secteur", "is", null)
        .not("secteur", "eq", "");

      if (error) throw error;

      // Extract unique sectors
      const uniqueSectors = Array.from(new Set(data.map((p) => p.secteur).filter(Boolean))) as string[];
      return uniqueSectors.sort();
    },
    enabled: !!user,
  });
}
