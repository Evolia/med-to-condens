"use client";

import { useState } from "react";
import { Save, X, Plus, Trash2 } from "lucide-react";
import { Button, Input, PatientSearch } from "@/components/ui";
import { useCreateObservation, useCreateTodo } from "@/hooks";
import { TypeObservation, Patient, TypeTodo, UrgenceTodo } from "@/types";
import { calculateAgeInDays } from "@/lib/date-utils";

interface ObservationFormProps {
  patientId?: string;
  consultationId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const typeOptions = [
  { value: TypeObservation.CONSULTATION, label: "Consultation" },
  { value: TypeObservation.SUIVI, label: "Suivi" },
  { value: TypeObservation.URGENCE, label: "Urgence" },
  { value: TypeObservation.TELEPHONE, label: "Telephone" },
  { value: TypeObservation.RESULTATS, label: "Resultats" },
  { value: TypeObservation.COURRIER, label: "Courrier" },
  { value: TypeObservation.REUNION, label: "Reunion" },
  { value: TypeObservation.NOTE, label: "Note" },
];

const typeTodoOptions = [
  { value: TypeTodo.RAPPEL, label: "Rappel" },
  { value: TypeTodo.PRESCRIPTION, label: "Prescription" },
  { value: TypeTodo.EXAMEN, label: "Examen" },
  { value: TypeTodo.COURRIER, label: "Courrier" },
  { value: TypeTodo.RDV, label: "RDV" },
  { value: TypeTodo.AUTRE, label: "Autre" },
];

const urgenceOptions = [
  { value: UrgenceTodo.BASSE, label: "Basse" },
  { value: UrgenceTodo.NORMALE, label: "Normale" },
  { value: UrgenceTodo.HAUTE, label: "Haute" },
  { value: UrgenceTodo.CRITIQUE, label: "Critique" },
];

interface TodoToCreate {
  id: string; // temp id for the list
  contenu: string;
  type_todo: TypeTodo;
  urgence: UrgenceTodo;
  date_echeance?: string;
}

export function ObservationForm({
  patientId,
  consultationId,
  onSuccess,
  onCancel,
}: ObservationFormProps) {
  const [selectedPatientId, setSelectedPatientId] = useState(patientId || "");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [typeObservation, setTypeObservation] = useState<TypeObservation>(
    TypeObservation.CONSULTATION
  );
  const [contenu, setContenu] = useState("");
  const [todos, setTodos] = useState<TodoToCreate[]>([]);

  const createObservation = useCreateObservation();
  const createTodo = useCreateTodo();

  const handlePatientChange = (id: string, patient?: Patient) => {
    setSelectedPatientId(id);
    setSelectedPatient(patient || null);
  };

  const handleAddTodo = () => {
    setTodos([
      ...todos,
      {
        id: `temp-${Date.now()}`,
        contenu: "",
        type_todo: TypeTodo.RAPPEL,
        urgence: UrgenceTodo.NORMALE,
      },
    ]);
  };

  const handleRemoveTodo = (id: string) => {
    setTodos(todos.filter((t) => t.id !== id));
  };

  const handleTodoChange = (id: string, field: keyof TodoToCreate, value: string) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatientId) {
      alert("Veuillez selectionner un patient");
      return;
    }

    // Calculate age in days at the observation date
    let ageInDays: number | undefined;
    if (selectedPatient?.date_naissance) {
      ageInDays = calculateAgeInDays(selectedPatient.date_naissance, date);
    }

    const observation = await createObservation.mutateAsync({
      patient_id: selectedPatientId,
      consultation_id: consultationId,
      date,
      type_observation: typeObservation,
      contenu,
      age_patient_jours: ageInDays,
    });

    // Create todos if any
    for (const todo of todos) {
      if (todo.contenu.trim()) {
        await createTodo.mutateAsync({
          patient_id: selectedPatientId,
          observation_id: observation.id,
          contenu: todo.contenu,
          type_todo: todo.type_todo,
          urgence: todo.urgence,
          date_echeance: todo.date_echeance || undefined,
        });
      }
    }

    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      {!patientId && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Patient
          </label>
          {selectedPatient ? (
            <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              <span className="font-medium text-gray-900">
                {selectedPatient.nom.toUpperCase()} {selectedPatient.prenom}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedPatientId("");
                  setSelectedPatient(null);
                }}
                className="text-gray-400 hover:text-gray-600"
                title="Changer de patient"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <PatientSearch
              value={selectedPatientId}
              onChange={handlePatientChange}
              placeholder="Rechercher un patient..."
              required
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            value={typeObservation}
            onChange={(e) =>
              setTypeObservation(e.target.value as TypeObservation)
            }
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Contenu
        </label>
        <textarea
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          rows={6}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Contenu de l'observation..."
        />
      </div>

      {/* Todos section */}
      <div className="border-t border-gray-200 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Taches à faire</label>
          <button
            type="button"
            onClick={handleAddTodo}
            className="flex items-center gap-1 rounded-md bg-orange-50 px-3 py-1.5 text-sm text-orange-700 hover:bg-orange-100"
          >
            <Plus className="h-4 w-4" />
            Nouveau todo
          </button>
        </div>

        {todos.length > 0 && (
          <div className="space-y-3">
            {todos.map((todo) => (
              <div key={todo.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <textarea
                      value={todo.contenu}
                      onChange={(e) => handleTodoChange(todo.id, "contenu", e.target.value)}
                      placeholder="Description de la tache..."
                      rows={2}
                      className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveTodo(todo.id)}
                      className="text-gray-400 hover:text-red-600"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="mb-0.5 block text-xs text-gray-600">Type</label>
                      <select
                        value={todo.type_todo}
                        onChange={(e) => handleTodoChange(todo.id, "type_todo", e.target.value)}
                        className="block w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                      >
                        {typeTodoOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs text-gray-600">Urgence</label>
                      <select
                        value={todo.urgence}
                        onChange={(e) => handleTodoChange(todo.id, "urgence", e.target.value)}
                        className="block w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                      >
                        {urgenceOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs text-gray-600">Echéance</label>
                      <input
                        type="date"
                        value={todo.date_echeance || ""}
                        onChange={(e) => handleTodoChange(todo.id, "date_echeance", e.target.value)}
                        className="block w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Annuler
          </Button>
        )}
        <Button type="submit" isLoading={createObservation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
