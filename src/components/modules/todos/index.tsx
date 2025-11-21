"use client";

import { useState, useMemo } from "react";
import { CheckCircle, Clock, ChevronDown, ChevronRight, Plus, Users, ListTodo } from "lucide-react";
import { Button } from "@/components/ui";
import { useActiveTodos, useCompletedTodos } from "@/hooks";
import { Todo, ModuleType, TypeTodo } from "@/types";
import { TodoItem } from "./todo-item";
import { TodoForm } from "./todo-form";
import { WorkSessionView } from "./work-session-view";
import { WorkSessionsList } from "./work-sessions-list";
import { useTabsStore } from "@/stores/tabs-store";

type ViewType = "active" | "completed" | "sessions";
type GroupByType = "patient" | "type";

const typeLabels: Record<TypeTodo, string> = {
  [TypeTodo.RAPPEL]: "Rappel",
  [TypeTodo.PRESCRIPTION]: "Prescription",
  [TypeTodo.EXAMEN]: "Examen",
  [TypeTodo.COURRIER]: "Courrier",
  [TypeTodo.RDV]: "RDV a prevoir",
  [TypeTodo.AVIS]: "Avis",
  [TypeTodo.ADMINISTRATIF]: "Administratif",
  [TypeTodo.AUTRE]: "Autre",
};

// Group todos by patient
function groupTodosByPatient(todos: Todo[]) {
  const grouped: Record<
    string,
    { patient: Todo["patient"]; todos: Todo[] }
  > = {};

  todos.forEach((todo) => {
    const key = todo.patient_id || "no-patient";
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

// Group todos by type
function groupTodosByType(todos: Todo[]) {
  const grouped: Record<string, Todo[]> = {};

  todos.forEach((todo) => {
    const key = todo.type_todo;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(todo);
  });

  // Sort todos within each group by urgency and date
  Object.values(grouped).forEach((groupTodos) => {
    groupTodos.sort((a, b) => {
      const urgencyOrder = { critique: 0, haute: 1, normale: 2, basse: 3 };
      const urgencyDiff = urgencyOrder[a.urgence] - urgencyOrder[b.urgence];
      if (urgencyDiff !== 0) return urgencyDiff;

      if (a.date_echeance && b.date_echeance) {
        return new Date(a.date_echeance).getTime() - new Date(b.date_echeance).getTime();
      }
      return 0;
    });
  });

  return grouped;
}

function TypeGroup({
  typeTodo,
  todos,
}: {
  typeTodo: TypeTodo;
  todos: Todo[];
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 rounded-md bg-purple-50 px-3 py-2 text-left hover:bg-purple-100"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-purple-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-purple-500" />
        )}
        <span className="font-medium text-purple-700">
          {typeLabels[typeTodo] || typeTodo}
        </span>
        <span className="text-sm text-gray-500">({todos.length})</span>
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2 pl-6">
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} showPatient />
          ))}
        </div>
      )}
    </div>
  );
}

export function TodosModule() {
  const [view, setView] = useState<ViewType>("active");
  const [groupBy, setGroupBy] = useState<GroupByType>("patient");
  const [showNewTodo, setShowNewTodo] = useState(false);

  const { tabs, activeTabId } = useTabsStore();
  const { data: activeTodos, isLoading: loadingActive } = useActiveTodos();
  const { data: completedTodos, isLoading: loadingCompleted } =
    useCompletedTodos();

  const todos = view === "active" ? activeTodos : completedTodos;
  const isLoading = view === "active" ? loadingActive : loadingCompleted;

  const groupedByPatient = useMemo(() => {
    if (!todos) return {};
    return groupTodosByPatient(todos);
  }, [todos]);

  const groupedByType = useMemo(() => {
    if (!todos) return {};
    return groupTodosByType(todos);
  }, [todos]);

  // Get the active tab for this module
  const activeTab = tabs.find(
    (tab) => tab.id === activeTabId && tab.module === ModuleType.TODOS
  );

  // If there's a work-session tab, render the work session view
  if (activeTab?.type === "work-session") {
    return <WorkSessionView workSessionId={activeTab.data?.workSessionId || ""} />;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
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
            <button
              onClick={() => setView("sessions")}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                view === "sessions"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Users className="h-4 w-4" />
              Sessions
            </button>
          </div>
          {view !== "sessions" && (
            <Button onClick={() => setShowNewTodo(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle tache
            </Button>
          )}
        </div>
        {view !== "sessions" && (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {todos?.length || 0} tache{(todos?.length || 0) !== 1 ? "s" : ""}
              {view === "active" ? " en cours" : " terminee(s)"}
            </p>
            <div className="flex items-center gap-1 rounded-md bg-gray-100 p-1">
              <button
                onClick={() => setGroupBy("patient")}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                  groupBy === "patient"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Grouper par patient"
              >
                <Users className="h-3 w-3" />
                Patient
              </button>
              <button
                onClick={() => setGroupBy("type")}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                  groupBy === "type"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Grouper par type"
              >
                <ListTodo className="h-3 w-3" />
                Type
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {view === "sessions" ? (
          <WorkSessionsList />
        ) : showNewTodo ? (
          <TodoForm
            onSuccess={() => setShowNewTodo(false)}
            onCancel={() => setShowNewTodo(false)}
          />
        ) : isLoading ? (
          <div className="flex h-full items-center justify-center p-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (todos?.length || 0) === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500 p-4">
            <CheckCircle className="mb-2 h-12 w-12 text-gray-300" />
            {view === "active" ? (
              <p>Aucune tache en cours</p>
            ) : (
              <p>Aucune tache terminee</p>
            )}
          </div>
        ) : groupBy === "patient" ? (
          <div className="p-4">
            {Object.entries(groupedByPatient).map(([patientId, { patient, todos }]) => (
              <PatientGroup
                key={patientId}
                patientId={patientId}
                patient={patient}
                todos={todos}
              />
            ))}
          </div>
        ) : (
          <div className="p-4">
            {Object.entries(groupedByType).map(([typeTodo, todos]) => (
              <TypeGroup
                key={typeTodo}
                typeTodo={typeTodo as TypeTodo}
                todos={todos}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { TodoItem } from "./todo-item";
export { TodoForm } from "./todo-form";
