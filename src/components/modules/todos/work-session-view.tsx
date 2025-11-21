"use client";

import { useState } from "react";
import { Calendar, CheckCircle2, Circle, Trash2, Edit2 } from "lucide-react";
import { useWorkSession, useCompleteWorkSession, useTodos } from "@/hooks";
import { formatDate } from "@/lib/date-utils";
import { TodoItem } from "./todo-item";

interface WorkSessionViewProps {
  workSessionId: string;
}

export function WorkSessionView({ workSessionId }: WorkSessionViewProps) {
  const { data: session, isLoading } = useWorkSession(workSessionId);
  const { data: allTodos = [] } = useTodos();
  const completeSession = useCompleteWorkSession();

  const sessionTodos = allTodos.filter(
    (todo) => todo.work_session_id === workSessionId
  );

  const completedTodos = sessionTodos.filter((todo) => todo.completed);
  const activeTodos = sessionTodos.filter((todo) => !todo.completed);
  const progress = sessionTodos.length > 0
    ? Math.round((completedTodos.length / sessionTodos.length) * 100)
    : 0;

  const handleCompleteSession = async () => {
    if (confirm("Voulez-vous vraiment marquer cette session comme terminée ?")) {
      await completeSession.mutateAsync(workSessionId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Session non trouvée</p>
      </div>
    );
  }

  return (
    <div className="mx-auto h-full max-w-4xl overflow-y-auto p-6">
      {/* Session Header */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              {session.name}
            </h1>
            {session.date && (
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(session.date)}</span>
              </div>
            )}
            {session.description && (
              <p className="text-sm text-gray-600">{session.description}</p>
            )}
          </div>
          {!session.completed && (
            <button
              onClick={handleCompleteSession}
              className="ml-4 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              Terminer la session
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-600">Progression</span>
            <span className="font-medium text-gray-900">
              {completedTodos.length} / {sessionTodos.length} tâches ({progress}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {session.completed && (
          <div className="mt-4 rounded-lg bg-green-50 p-3 text-center">
            <p className="text-sm font-medium text-green-800">
              Session terminée
            </p>
          </div>
        )}
      </div>

      {/* Active Todos */}
      {activeTodos.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Circle className="h-5 w-5 text-blue-600" />
            À faire ({activeTodos.length})
          </h2>
          <div className="space-y-2">
            {activeTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} showPatient={true} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Todos */}
      {completedTodos.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Terminées ({completedTodos.length})
          </h2>
          <div className="space-y-2">
            {completedTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} showPatient={true} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {sessionTodos.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <p className="text-gray-500">
            Aucune tâche planifiée pour cette session
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Utilisez le bouton &ldquo;Planifier&rdquo; sur vos tâches pour les ajouter à cette
            session
          </p>
        </div>
      )}
    </div>
  );
}
