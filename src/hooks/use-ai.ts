"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useGenerateSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patientId: string) => {
      const response = await fetch("/api/ai/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ patientId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la generation");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}

export function useAnalyzeMail() {
  return useMutation({
    mutationFn: async ({
      patientId,
      mailContent,
    }: {
      patientId: string;
      mailContent: string;
    }) => {
      const response = await fetch("/api/ai/analyze-mail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ patientId, mailContent }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'analyse");
      }

      return response.json();
    },
  });
}
