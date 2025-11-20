"use client";

import { useState } from "react";
import { Check, Edit, Trash2, MessageSquare } from "lucide-react";
import { Todo, UrgenceTodo, TypeTodo, ModuleType } from "@/types";
import {
  useCompleteTodo,
  useUncompleteTodo,
  useUpdateTodo,
  useDeleteTodo,
} from "@/hooks";
import { formatDate } from "@/lib/date-utils";
import { useTabsStore } from "@/stores/tabs-store";

interface TodoItemProps {
  todo: Todo;
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

export function TodoItem({ todo }: TodoItemProps) {
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [annotation, setAnnotation] = useState(todo.annotations || "");

  const completeTodo = useCompleteTodo();
  const uncompleteTodo = useUncompleteTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const { addTab } = useTabsStore();

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
