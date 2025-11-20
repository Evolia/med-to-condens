"use client";

import { useState, useMemo } from "react";
import { CheckCircle, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { useActiveTodos, useCompletedTodos } from "@/hooks";
import { Todo, ModuleType } from "@/types";
import { TodoItem } from "./todo-item";
import { useTabsStore } from "@/stores/tabs-store";

type ViewType = "active" | "completed";

// Group todos by patient
function groupTodosByPatient(todos: Todo[]) {
  const grouped: Record<
    string,
    { patient: Todo["patient"]; todos: Todo[] }
  > = {};

  todos.forEach((todo) => {
    const key = todo.patient_id;
    if (!grouped[key]) {
      grouped[key] = {
        patient: todo.patient,
        todos: [],
      };
    }
    grouped[key].todos.push(todo);
  });

  // Sort todos within each group by urgency and date
  Object.values(grouped).forEach((group) => {
    group.todos.sort((a, b) => {
      // Sort by urgency first (critique > haute > normale > basse)
      const urgencyOrder = { critique: 0, haute: 1, normale: 2, basse: 3 };
      const urgencyDiff = urgencyOrder[a.urgence] - urgencyOrder[b.urgence];
      if (urgencyDiff !== 0) return urgencyDiff;

      // Then by date
      if (a.date_echeance && b.date_echeance) {
        return (
          new Date(a.date_echeance).getTime() -
          new Date(b.date_echeance).getTime()
        );
      }
      return 0;
    });
  });

  return grouped;
}

function PatientGroup({
  patientId,
  patient,
  todos,
}: {
  patientId: string;
  patient: Todo["patient"];
  todos: Todo[];
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { addTab } = useTabsStore();

  const handlePatientClick = () => {
    if (patient) {
      addTab({
        id: `patient-${patient.id}`,
        type: "patient",
        module: ModuleType.DOSSIERS,
        title: `${patient.nom} ${patient.prenom}`,
        data: { patientId: patient.id },
      });
    }
  };

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-left hover:bg-gray-200"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
        <span
          onClick={(e) => {
            e.stopPropagation();
            handlePatientClick();
          }}
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          {patient
            ? `${patient.nom.toUpperCase()} ${patient.prenom}`
            : "Patient inconnu"}
        </span>
        <span className="text-sm text-gray-500">({todos.length})</span>
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2 pl-6">
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </div>
      )}
    </div>
  );
}

export function TodosModule() {
  const [view, setView] = useState<ViewType>("active");

  const { data: activeTodos, isLoading: loadingActive } = useActiveTodos();
  const { data: completedTodos, isLoading: loadingCompleted } =
    useCompletedTodos();

  const todos = view === "active" ? activeTodos : completedTodos;
  const isLoading = view === "active" ? loadingActive : loadingCompleted;

  const groupedTodos = useMemo(() => {
    if (!todos) return {};
    return groupTodosByPatient(todos);
  }, [todos]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("active")}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              view === "active"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Clock className="h-4 w-4" />
            En cours
          </button>
          <button
            onClick={() => setView("completed")}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              view === "completed"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            Termines
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {todos?.length || 0} tache{(todos?.length || 0) !== 1 ? "s" : ""}
          {view === "active" ? " en cours" : " terminee(s)"}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : Object.keys(groupedTodos).length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500">
            <CheckCircle className="mb-2 h-12 w-12 text-gray-300" />
            {view === "active" ? (
              <p>Aucune tache en cours</p>
            ) : (
              <p>Aucune tache terminee</p>
            )}
          </div>
        ) : (
          Object.entries(groupedTodos).map(([patientId, { patient, todos }]) => (
            <PatientGroup
              key={patientId}
              patientId={patientId}
              patient={patient}
              todos={todos}
            />
          ))
        )}
      </div>
    </div>
  );
}

export { TodoItem } from "./todo-item";
