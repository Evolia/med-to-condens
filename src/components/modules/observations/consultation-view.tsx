"use client";

import { useState } from "react";
import { Plus, Users, FileText, UserPlus, X, Calendar, Edit2, Check } from "lucide-react";
import { Button, Input } from "@/components/ui";
import {
  useConsultation,
  useObservations,
  usePatients,
  useCreateBulkObservations,
  useCreatePatient,
  useCreateObservation,
  useUpdateConsultation,
} from "@/hooks";
import { TypeObservation } from "@/types";
import { ObservationTable } from "./observation-table";
import { ObservationForm } from "./observation-form";
import { formatDate, calculateAgeInDays } from "@/lib/date-utils";

// Normalize string: remove accents and convert to lowercase
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

interface ConsultationViewProps {
  consultationId: string;
}

const typeOptions = [
  { value: "consultation", label: "Consultation" },
  { value: "visite", label: "Visite" },
  { value: "reunion", label: "Reunion" },
  { value: "staff", label: "Staff" },
  { value: "autre", label: "Autre" },
];

export function ConsultationView({ consultationId }: ConsultationViewProps) {
  const [showNewObservation, setShowNewObservation] = useState(false);
  const [nameList, setNameList] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [unmatchedNames, setUnmatchedNames] = useState<string[]>([]);
  const [creatingPatient, setCreatingPatient] = useState<string | null>(null);

  // Inline editing states
  const [editingField, setEditingField] = useState<"titre" | "type" | "date" | null>(null);
  const [editValue, setEditValue] = useState("");

  const { data: consultation, isLoading } = useConsultation(consultationId);
  const { data: observations } = useObservations({ consultationId });
  const { data: patients } = usePatients();
  const createBulkObservations = useCreateBulkObservations();
  const createPatient = useCreatePatient();
  const createObservation = useCreateObservation();
  const updateConsultation = useUpdateConsultation();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        Consultation non trouvee
      </div>
    );
  }

  const handleStartEdit = (field: "titre" | "type" | "date") => {
    if (field === "titre") {
      setEditValue(consultation.titre || "");
    } else if (field === "type") {
      setEditValue(consultation.type || "consultation");
    } else if (field === "date") {
      setEditValue(consultation.date);
    }
    setEditingField(field);
  };

  const handleSaveField = async () => {
    if (!editingField) return;

    const updates: Record<string, string> = {};
    updates[editingField] = editValue;

    await updateConsultation.mutateAsync({
      id: consultationId,
      ...updates,
    });
    setEditingField(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleImportNames = async () => {
    if (!nameList.trim() || !patients) return;

    setIsImporting(true);

    // Parse names (one per line or comma separated)
    const names = nameList
      .split(/[,\n]/)
      .map((n) => n.trim())
      .filter((n) => n);

    const observationsToCreate = [];
    const notFoundNames: string[] = [];

    for (const name of names) {
      // Try to find matching patient (case and accent insensitive)
      const normalizedName = normalizeString(name);
      const nameParts = normalizedName.split(/\s+/);
      const matchedPatient = patients.find((p) => {
        const patientNom = normalizeString(p.nom);
        const patientPrenom = normalizeString(p.prenom);

        return nameParts.some(
          (part) =>
            patientNom.includes(part) ||
            patientPrenom.includes(part) ||
            `${patientNom} ${patientPrenom}`.includes(normalizedName) ||
            `${patientPrenom} ${patientNom}`.includes(normalizedName)
        );
      });

      if (matchedPatient) {
        let ageInDays: number | undefined;
        if (matchedPatient.date_naissance) {
          ageInDays = calculateAgeInDays(
            matchedPatient.date_naissance,
            consultation.date
          );
        }

        observationsToCreate.push({
          patient_id: matchedPatient.id,
          consultation_id: consultationId,
          date: consultation.date,
          type_observation: TypeObservation.CONSULTATION,
          contenu: "",
          age_patient_jours: ageInDays,
        });
      } else {
        notFoundNames.push(name);
      }
    }

    if (observationsToCreate.length > 0) {
      await createBulkObservations.mutateAsync(observationsToCreate);
    }

    setNameList("");
    setIsImporting(false);
    setUnmatchedNames(notFoundNames);
  };

  const handleCreatePatient = async (name: string) => {
    if (!consultation) return;

    setCreatingPatient(name);

    // Parse name into nom/prenom (assume format: "Prenom Nom" or "Nom")
    const parts = name.trim().split(/\s+/);
    let nom: string;
    let prenom: string;

    if (parts.length === 1) {
      nom = parts[0];
      prenom = "";
    } else {
      // Assume last word is nom, rest is prenom
      nom = parts[parts.length - 1];
      prenom = parts.slice(0, -1).join(" ");
    }

    try {
      // Create the patient
      const newPatient = await createPatient.mutateAsync({
        nom: nom.toUpperCase(),
        prenom,
      });

      // Create the observation for this consultation
      await createObservation.mutateAsync({
        patient_id: newPatient.id,
        consultation_id: consultationId,
        date: consultation.date,
        type_observation: TypeObservation.CONSULTATION,
        contenu: "",
      });

      // Remove from unmatched list
      setUnmatchedNames((prev) => prev.filter((n) => n !== name));
    } catch (error) {
      console.error("Error creating patient:", error);
      alert("Erreur lors de la creation du patient");
    } finally {
      setCreatingPatient(null);
    }
  };

  const handleDismissUnmatched = (name: string) => {
    setUnmatchedNames((prev) => prev.filter((n) => n !== name));
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Title */}
            {editingField === "titre" ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-lg font-semibold"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveField();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                />
                <button onClick={handleSaveField} className="text-green-600 hover:text-green-800">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <h2
                onClick={() => handleStartEdit("titre")}
                className="text-xl font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1 inline-block"
                title="Cliquez pour modifier"
              >
                {consultation.titre || `Consultation du ${formatDate(consultation.date)}`}
              </h2>
            )}

            {/* Type and Date */}
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              {/* Type */}
              {editingField === "type" ? (
                <div className="flex items-center gap-1">
                  <select
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="rounded border border-gray-300 px-2 py-0.5 text-sm"
                    autoFocus
                  >
                    {typeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button onClick={handleSaveField} className="text-green-600 hover:text-green-800">
                    <Check className="h-3 w-3" />
                  </button>
                  <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <span
                  onClick={() => handleStartEdit("type")}
                  className="cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1"
                  title="Cliquez pour modifier"
                >
                  {consultation.type || "consultation"}
                </span>
              )}

              <span>•</span>

              {/* Date */}
              {editingField === "date" ? (
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="rounded border border-gray-300 px-2 py-0.5 text-sm"
                    autoFocus
                  />
                  <button onClick={handleSaveField} className="text-green-600 hover:text-green-800">
                    <Check className="h-3 w-3" />
                  </button>
                  <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <span
                  onClick={() => handleStartEdit("date")}
                  className="cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1 flex items-center gap-1"
                  title="Cliquez pour modifier"
                >
                  <Calendar className="h-3 w-3" />
                  {formatDate(consultation.date)}
                </span>
              )}
            </div>
          </div>
          <Button onClick={() => setShowNewObservation(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle observation
          </Button>
        </div>
      </div>

      {/* Import names section */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Users className="h-4 w-4" />
              Import liste de patients
            </label>
            <textarea
              value={nameList}
              onChange={(e) => setNameList(e.target.value)}
              placeholder="Collez une liste de noms (un par ligne ou separes par des virgules)"
              rows={3}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <Button
            onClick={handleImportNames}
            isLoading={isImporting}
            disabled={!nameList.trim()}
            className="mt-6"
          >
            <FileText className="mr-2 h-4 w-4" />
            Creer observations
          </Button>
        </div>
      </div>

      {/* Unmatched names section */}
      {unmatchedNames.length > 0 && (
        <div className="border-b border-gray-200 bg-yellow-50 p-4">
          <p className="mb-2 text-sm font-medium text-yellow-800">
            {unmatchedNames.length} patient(s) non trouve(s) :
          </p>
          <div className="space-y-2">
            {unmatchedNames.map((name) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-md bg-white px-3 py-2 shadow-sm"
              >
                <span className="text-sm text-gray-700">{name}</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleCreatePatient(name)}
                    isLoading={creatingPatient === name}
                  >
                    <UserPlus className="mr-1 h-3 w-3" />
                    Creer
                  </Button>
                  <button
                    onClick={() => handleDismissUnmatched(name)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Ignorer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Observations list */}
      <div className="flex-1 overflow-auto">
        {showNewObservation ? (
          <ObservationForm
            consultationId={consultationId}
            onSuccess={() => setShowNewObservation(false)}
            onCancel={() => setShowNewObservation(false)}
          />
        ) : (
          <ObservationTable observations={observations || []} showPatient />
        )}
      </div>
    </div>
  );
}
