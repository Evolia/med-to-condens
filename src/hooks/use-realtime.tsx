"use client";

import { useEffect, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "./use-auth";

type TableName = "patients" | "consultations" | "observations" | "todos";

const tableToQueryKey: Record<TableName, string> = {
  patients: "patients",
  consultations: "consultations",
  observations: "observations",
  todos: "todos",
};

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const supabase = createBrowserClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Create a channel for all table changes
    const channel = supabase
      .channel("db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "patients",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["patients"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "consultations",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["consultations"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "observations",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["observations"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "todos",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["todos"] });
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, queryClient]);
}

// Hook to use in the app layout to enable realtime for the entire app
export function RealtimeProvider({ children }: { children: ReactNode }): ReactNode {
  useRealtimeSync();
  return children;
}
