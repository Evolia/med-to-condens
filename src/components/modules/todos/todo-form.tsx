"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import { Button, Input, PatientSearch } from "@/components/ui";
import { useCreateTodo } from "@/hooks";
import { TypeTodo, UrgenceTodo } from "@/types";

interface TodoFormProps {
  patientId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const typeOptions = [
  { value: TypeTodo.RAPPEL, label: "Rappel" },
  { value: TypeTodo.PRESCRIPTION, label: "Prescription" },
  { value: TypeTodo.EXAMEN, label: "Examen" },
  { value: TypeTodo.COURRIER, label: "Courrier" },
  { value: TypeTodo.RDV, label: "RDV" },
  { value: TypeTodo.AVIS, label: "Avis" },
  { value: TypeTodo.ADMINISTRATIF, label: "Administratif" },
  { value: TypeTodo.AUTRE, label: "Autre" },
];

const urgenceOptions = [
  { value: UrgenceTodo.BASSE, label: "Basse" },
  { value: UrgenceTodo.NORMALE, label: "Normale" },
  { value: UrgenceTodo.HAUTE, label: "Haute" },
  { value: UrgenceTodo.CRITIQUE, label: "Critique" },
];

export function TodoForm({
  patientId,
  onSuccess,
  onCancel,
}: TodoFormProps) {
  const [selectedPatientId, setSelectedPatientId] = useState(patientId || "");
  const [contenu, setContenu] = useState("");
  const [typeTodo, setTypeTodo] = useState<TypeTodo>(TypeTodo.RAPPEL);
  const [urgence, setUrgence] = useState<UrgenceTodo>(UrgenceTodo.NORMALE);
  const [dateEcheance, setDateEcheance] = useState("");
  const [tags, setTags] = useState("");

  const createTodo = useCreateTodo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contenu.trim()) {
      alert("Veuillez saisir le contenu de la tache");
      return;
    }

    await createTodo.mutateAsync({
      patient_id: selectedPatientId || undefined,
      contenu,
      type_todo: typeTodo,
      urgence,
      date_echeance: dateEcheance || undefined,
      tags: tags || undefined,
    });

    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      {!patientId && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Patient <span className="text-xs text-gray-500">(facultatif)</span>
          </label>
          <PatientSearch
            value={selectedPatientId}
            onChange={(id) => setSelectedPatientId(id)}
            placeholder="Rechercher un patient (optionnel)..."
          />
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          rows={3}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Description de la tache..."
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            value={typeTodo}
            onChange={(e) => setTypeTodo(e.target.value as TypeTodo)}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Urgence
          </label>
          <select
            value={urgence}
            onChange={(e) => setUrgence(e.target.value as UrgenceTodo)}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {urgenceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Echeance"
          type="date"
          value={dateEcheance}
          onChange={(e) => setDateEcheance(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Tags <span className="text-xs text-gray-500">(séparés par des virgules)</span>
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Ex: urgent, médical, suivi..."
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Annuler
          </Button>
        )}
        <Button type="submit" isLoading={createTodo.isPending}>
          <Save className="mr-2 h-4 w-4" />
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
