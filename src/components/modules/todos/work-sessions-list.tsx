"use client";

import { useState } from "react";
import { Calendar, Plus, Trash2, CheckCircle2, Circle, X } from "lucide-react";
import { useWorkSessions, useCreateWorkSession, useDeleteWorkSession, useWorkSessionsStats, SessionStats, useWorkSessionTags } from "@/hooks";
import { formatDate } from "@/lib/date-utils";
import { useTabsStore } from "@/stores/tabs-store";
import { ModuleType } from "@/types";
import { Button, TagInput } from "@/components/ui";

// Get color classes based on completion stats
function getCompletionColors(stats: SessionStats | undefined) {
  if (!stats || stats.total === 0) {
    return {
      border: "border-gray-200",
      bg: "bg-white",
      text: "text-gray-500",
    };
  }

  const percentage = Math.round((stats.completed / stats.total) * 100);

  if (percentage === 100) {
    return {
      border: "border-green-200",
      bg: "bg-green-50",
      text: "text-green-700",
    };
  } else if (percentage === 0) {
    return {
      border: "border-blue-200",
      bg: "bg-blue-50",
      text: "text-blue-700",
    };
  } else {
    return {
      border: "border-yellow-200",
      bg: "bg-yellow-50",
      text: "text-yellow-700",
    };
  }
}

// Completion badge component
function CompletionBadge({ stats }: { stats: SessionStats | undefined }) {
  if (!stats || stats.total === 0) {
    return (
      <span className="text-xs text-gray-500">
        0 tache
      </span>
    );
  }

  return (
    <span className="text-xs text-gray-600">
      {stats.completed}/{stats.total}
    </span>
  );
}

export function WorkSessionsList() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    tags: "",
  });

  const { data: sessions = [], isLoading } = useWorkSessions();
  const { data: sessionStats = {} } = useWorkSessionsStats();
  const { data: workSessionTags = [] } = useWorkSessionTags();
  const createSession = useCreateWorkSession();
  const deleteSession = useDeleteWorkSession();
  const { addTab } = useTabsStore();

  const activeSessions = sessions.filter((s) => !s.completed);
  const completedSessions = sessions.filter((s) => s.completed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await createSession.mutateAsync({
        name: formData.name,
        date: formData.date || undefined,
        description: formData.description || undefined,
        tags: formData.tags || undefined,
      });
      setFormData({
        name: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        tags: "",
      });
      setShowForm(false);
    } catch (error) {
      console.error("Failed to create work session:", error);
    }
  };

  const handleOpenSession = (sessionId: string, sessionName: string) => {
    addTab({
      id: `work-session-${sessionId}`,
      type: "work-session",
      module: ModuleType.TODOS,
      title: sessionName,
      data: { workSessionId: sessionId },
    });
  };

  const handleDeleteSession = async (sessionId: string, sessionName: string) => {
    if (confirm(`Voulez-vous vraiment supprimer la session "${sessionName}" ?`)) {
      await deleteSession.mutateAsync(sessionId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Sessions de travail</h2>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Annuler
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle session
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* New Session Form */}
        {showForm && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              Nouvelle session de travail
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nom de la session *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Séance après-midi"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description optionnelle..."
                  rows={2}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <TagInput
                value={formData.tags}
                onChange={(value) => setFormData({ ...formData, tags: value })}
                suggestions={workSessionTags}
                label="Tags"
                placeholder="Tags..."
                color="green"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Circle className="h-4 w-4 text-blue-600" />
              Sessions actives ({activeSessions.length})
            </h3>
            <div className="space-y-2">
              {activeSessions.map((session) => {
                const colors = getCompletionColors(sessionStats[session.id]);
                return (
                <div
                  key={session.id}
                  className={`flex items-center justify-between rounded-lg border ${colors.border} ${colors.bg} p-4 shadow-sm hover:shadow-md transition-shadow`}
                >
                  <button
                    onClick={() => handleOpenSession(session.id, session.name)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 hover:text-blue-600">
                        {session.name}
                      </h4>
                      <CompletionBadge stats={sessionStats[session.id]} />
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                      {session.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(session.date)}
                        </span>
                      )}
                    </div>
                    {session.tags && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {session.tags.split(",").map((tag, i) => (
                          <span key={i} className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    {session.description && (
                      <p className="mt-1 text-sm text-gray-600">{session.description}</p>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteSession(session.id, session.name)}
                    className="ml-4 rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
              })}
            </div>
          </div>
        )}

        {/* Completed Sessions */}
        {completedSessions.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Sessions terminées ({completedSessions.length})
            </h3>
            <div className="space-y-2">
              {completedSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 opacity-75 shadow-sm hover:opacity-100 transition-opacity"
                >
                  <button
                    onClick={() => handleOpenSession(session.id, session.name)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-700 hover:text-blue-600">
                        {session.name}
                      </h4>
                      <CompletionBadge stats={sessionStats[session.id]} />
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                      {session.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(session.date)}
                        </span>
                      )}
                    </div>
                    {session.tags && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {session.tags.split(",").map((tag, i) => (
                          <span key={i} className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    {session.description && (
                      <p className="mt-1 text-sm text-gray-600">{session.description}</p>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteSession(session.id, session.name)}
                    className="ml-4 rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {activeSessions.length === 0 && completedSessions.length === 0 && !showForm && (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500">
            <Calendar className="mb-2 h-12 w-12 text-gray-300" />
            <p>Aucune session de travail</p>
            <p className="mt-2 text-sm text-gray-400">
              Créez une session pour organiser vos tâches
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
