"use client";

import { useQuery } from "@tanstack/react-query";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "./use-auth";

const TAGS_KEY = "tags";

export type TagSource = "sectors" | "consultation-tags" | "todo-tags";

// Hook to get unique tags from a specific source
export function useTags(source: TagSource) {
  const { user } = useAuth();
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: [TAGS_KEY, source],
    queryFn: async () => {
      let data: { tags?: string | null; secteur?: string | null }[] = [];

      switch (source) {
        case "sectors": {
          const result = await supabase
            .from("patients")
            .select("secteur")
            .not("secteur", "is", null)
            .not("secteur", "eq", "");

          if (result.error) throw result.error;
          data = result.data || [];
          break;
        }

        case "consultation-tags": {
          const result = await supabase
            .from("consultations")
            .select("tags")
            .not("tags", "is", null)
            .not("tags", "eq", "");

          if (result.error) throw result.error;
          data = result.data || [];
          break;
        }

        case "todo-tags": {
          const result = await supabase
            .from("todos")
            .select("tags")
            .not("tags", "is", null)
            .not("tags", "eq", "");

          if (result.error) throw result.error;
          data = result.data || [];
          break;
        }
      }

      // Extract unique tags
      const allTags = new Set<string>();
      data.forEach((item) => {
        const tagString = source === "sectors" ? item.secteur : item.tags;
        if (tagString) {
          tagString.split(",").forEach((tag) => {
            const trimmed = tag.trim();
            if (trimmed) {
              allTags.add(trimmed);
            }
          });
        }
      });

      return Array.from(allTags).sort((a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
      );
    },
    enabled: !!user,
  });
}

// Convenience hooks for specific sources
export function useSectorTags() {
  return useTags("sectors");
}

export function useConsultationTags() {
  return useTags("consultation-tags");
}

export function useTodoTags() {
  return useTags("todo-tags");
}
