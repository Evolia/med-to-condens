"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Edit, Trash2, MessageSquare, Calendar } from "lucide-react";
import { Todo, UrgenceTodo, TypeTodo, ModuleType } from "@/types";
import {
  useCompleteTodo,
  useUncompleteTodo,
  useUpdateTodo,
  useDeleteTodo,
  useActiveWorkSessions,
} from "@/hooks";
import { formatDate } from "@/lib/date-utils";
import { useTabsStore } from "@/stores/tabs-store";

interface TodoItemProps {
  todo: Todo;
  showPatient?: boolean;
}

const urgenceColors: Record<UrgenceTodo, string> = {
  [UrgenceTodo.CRITIQUE]: "bg-red-500",
  [UrgenceTodo.HAUTE]: "bg-orange-500",
  [UrgenceTodo.NORMALE]: "bg-yellow-500",
  [UrgenceTodo.BASSE]: "bg-green-500",
};

const typeLabels: Record<TypeTodo, string> = {
  [TypeTodo.RAPPEL]: "Rappel",
  [TypeTodo.PRESCRIPTION]: "Prescription",
  [TypeTodo.EXAMEN]: "Examen",
  [TypeTodo.COURRIER]: "Courrier",
  [TypeTodo.RDV]: "RDV",
  [TypeTodo.AVIS]: "Avis",
  [TypeTodo.ADMINISTRATIF]: "Administratif",
  [TypeTodo.AUTRE]: "Autre",
};

export function TodoItem({ todo, showPatient = false }: TodoItemProps) {
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [annotation, setAnnotation] = useState(todo.annotations || "");
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);

  const completeTodo = useCompleteTodo();
  const uncompleteTodo = useUncompleteTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const { addTab } = useTabsStore();
  const { data: workSessions = [] } = useActiveWorkSessions();

  const sessionDropdownRef = useRef<HTMLDivElement>(null);

  const handleToggleComplete = async () => {
    if (todo.completed) {
      await uncompleteTodo.mutateAsync(todo.id);
    } else {
      await completeTodo.mutateAsync(todo.id);
    }
  };

  const handleSaveAnnotation = async () => {
    await updateTodo.mutateAsync({
      id: todo.id,
      annotations: annotation,
    });
    setShowAnnotation(false);
  };

  const handleDelete = async () => {
    if (confirm("Voulez-vous vraiment supprimer cette tache ?")) {
      await deleteTodo.mutateAsync(todo.id);
    }
  };

  const handlePatientClick = () => {
    if (todo.patient) {
      addTab({
        id: `patient-${todo.patient.id}`,
        type: "patient",
        module: ModuleType.DOSSIERS,
        title: `${todo.patient.nom} ${todo.patient.prenom}`,
        data: { patientId: todo.patient.id },
      });
    }
  };

  const handleAssignToSession = async (sessionId: string) => {
    await updateTodo.mutateAsync({
      id: todo.id,
      work_session_id: sessionId,
    });
    setShowSessionDropdown(false);
  };

  const handleUnassignSession = async () => {
    await updateTodo.mutateAsync({
      id: todo.id,
      work_session_id: undefined,
    });
    setShowSessionDropdown(false);
  };

  // Click outside to close session dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sessionDropdownRef.current &&
        !sessionDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSessionDropdown(false);
      }
    };

    if (showSessionDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSessionDropdown]);

  return (
    <div
      className={`rounded-md border p-3 ${
        todo.completed ? "border-gray-200 bg-gray-50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Urgency indicator */}
        <div
          className={`mt-1 h-3 w-3 flex-shrink-0 rounded-full ${
            urgenceColors[todo.urgence]
          }`}
          title={todo.urgence}
        />

        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${
            todo.completed
              ? "border-green-500 bg-green-500 text-white"
              : "border-gray-300 hover:border-blue-500"
          }`}
        >
          {todo.completed && <Check className="h-3 w-3" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {showPatient && todo.patient && (
            <button
              onClick={handlePatientClick}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 mb-1"
            >
              {todo.patient.nom.toUpperCase()} {todo.patient.prenom}
            </button>
          )}
          <p
            className={`text-sm ${
              todo.completed ? "text-gray-500 line-through" : "text-gray-900"
            }`}
          >
            {todo.contenu}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="rounded bg-gray-100 px-1.5 py-0.5">
              {typeLabels[todo.type_todo]}
            </span>
            {todo.date_echeance && (
              <span
                className={
                  new Date(todo.date_echeance) < new Date() && !todo.completed
                    ? "text-red-600"
                    : ""
                }
              >
                Echeance: {formatDate(todo.date_echeance)}
              </span>
            )}
            {todo.tags && (
              <div className="flex flex-wrap gap-1">
                {todo.tags.split(",").map((tag, i) => (
                  <span key={i} className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Annotations */}
          {todo.annotations && !showAnnotation && (
            <p className="mt-2 rounded bg-yellow-50 p-2 text-xs text-gray-600">
              {todo.annotations}
            </p>
          )}

          {showAnnotation && (
            <div className="mt-2">
              <textarea
                value={annotation}
                onChange={(e) => setAnnotation(e.target.value)}
                className="w-full rounded border border-gray-300 p-2 text-xs"
                rows={2}
                placeholder="Ajouter une annotation..."
                autoFocus
              />
              <div className="mt-1 flex justify-end gap-2">
                <button
                  onClick={() => setShowAnnotation(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveAnnotation}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAnnotation(!showAnnotation)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Annoter"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <div className="relative" ref={sessionDropdownRef}>
            <button
              onClick={() => setShowSessionDropdown(!showSessionDropdown)}
              className={`rounded p-1 ${
                todo.work_session_id
                  ? "text-blue-600 hover:bg-blue-100"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              }`}
              title="Planifier"
            >
              <Calendar className="h-4 w-4" />
            </button>
            {showSessionDropdown && (
              <div className="absolute right-0 z-10 mt-1 w-64 rounded-md border border-gray-200 bg-white shadow-lg">
                <div className="max-h-64 overflow-y-auto p-2">
                  {todo.work_session_id && (
                    <>
                      <button
                        onClick={handleUnassignSession}
                        className="w-full rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        Retirer de la session
                      </button>
                      <div className="my-1 border-t border-gray-200" />
                    </>
                  )}
                  {workSessions.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-gray-500">
                      Aucune session active
                    </p>
                  ) : (
                    workSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => handleAssignToSession(session.id)}
                        className={`w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                          todo.work_session_id === session.id
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-700"
                        }`}
                      >
                        <div className="font-medium">{session.name}</div>
                        {session.date && (
                          <div className="text-xs text-gray-500">
                            {formatDate(session.date)}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleDelete}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
