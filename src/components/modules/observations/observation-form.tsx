"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import { Button, Input, PatientSearch } from "@/components/ui";
import { useCreateObservation } from "@/hooks";
import { TypeObservation, Patient } from "@/types";
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

  const createObservation = useCreateObservation();

  const handlePatientChange = (id: string, patient?: Patient) => {
    setSelectedPatientId(id);
    setSelectedPatient(patient || null);
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

    await createObservation.mutateAsync({
      patient_id: selectedPatientId,
      consultation_id: consultationId,
      date,
      type_observation: typeObservation,
      contenu,
      age_patient_jours: ageInDays,
    });

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
