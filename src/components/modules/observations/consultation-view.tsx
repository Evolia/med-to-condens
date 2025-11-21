"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Users, FileText, UserPlus, X, Calendar, Edit2, Check, Tag } from "lucide-react";
import { Button, Input } from "@/components/ui";
import {
  useConsultation,
  useObservations,
  usePatients,
  useCreateBulkObservations,
  useCreatePatient,
  useCreateObservation,
  useUpdateConsultation,
  useDeleteConsultation,
} from "@/hooks";
import { TypeObservation } from "@/types";
import { ObservationTable } from "./observation-table";
import { ObservationForm } from "./observation-form";
import { formatDate, calculateAgeInDays } from "@/lib/date-utils";
import { useTabsStore } from "@/stores/tabs-store";

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
  { value: "reunion", label: "Reunion" },
  { value: "contact", label: "Contact" },
  { value: "autre", label: "Autre" },
];

export function ConsultationView({ consultationId }: ConsultationViewProps) {
  const [showNewObservation, setShowNewObservation] = useState(false);
  const [nameList, setNameList] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [unmatchedNames, setUnmatchedNames] = useState<string[]>([]);
  const [creatingPatient, setCreatingPatient] = useState<string | null>(null);

  // Inline editing states
  const [editingField, setEditingField] = useState<"titre" | "type" | "date" | "tags" | null>(null);
  const [editValue, setEditValue] = useState("");
  const editingContainerRef = useRef<HTMLDivElement>(null);
  const observationsRef = useRef(observations);

  const { data: consultation, isLoading } = useConsultation(consultationId);
  const { data: observations } = useObservations({ consultationId });
  const { data: patients } = usePatients();
  const createBulkObservations = useCreateBulkObservations();
  const createPatient = useCreatePatient();
  const createObservation = useCreateObservation();
  const updateConsultation = useUpdateConsultation();
  const deleteConsultation = useDeleteConsultation();
  const { updateTab } = useTabsStore();

  // Update observations ref when observations change
  useEffect(() => {
    observationsRef.current = observations;
  }, [observations]);

  // Delete consultation if empty on unmount
  useEffect(() => {
    return () => {
      // Cleanup function called when component unmounts
      const currentObservations = observationsRef.current;
      if (currentObservations && currentObservations.length === 0) {
        // Delete consultation if it has no observations
        deleteConsultation.mutate(consultationId);
      }
    };
  }, [consultationId]);

  // Handle click outside to auto-save
  useEffect(() => {
    const handleClickOutside = async (event: MouseEvent) => {
      if (
        editingField &&
        editingContainerRef.current &&
        !editingContainerRef.current.contains(event.target as Node)
      ) {
        // Auto-save and close
        await handleSaveField();
      }
    };

    if (editingField) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [editingField, editValue]);

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

  const handleStartEdit = (field: "titre" | "type" | "date" | "tags") => {
    if (field === "titre") {
      setEditValue(consultation.titre || "");
    } else if (field === "type") {
      setEditValue(consultation.type || "consultation");
    } else if (field === "date") {
      setEditValue(consultation.date);
    } else if (field === "tags") {
      setEditValue(consultation.tags || "");
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

    // Update tab title if titre was modified
    if (editingField === "titre") {
      updateTab(`consultation-${consultationId}`, {
        title: editValue,
      });
    }

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
      // Try to find matching patient with stricter logic
      const normalizedName = normalizeString(name);

      // First: try exact full name match (nom prenom or prenom nom)
      let matchedPatient = patients.find((p) => {
        const patientFullName1 = normalizeString(`${p.nom} ${p.prenom}`);
        const patientFullName2 = normalizeString(`${p.prenom} ${p.nom}`);
        return patientFullName1 === normalizedName || patientFullName2 === normalizedName;
      });

      // Second: try partial match but require at least 2 matching parts or single exact nom match
      if (!matchedPatient) {
        const nameParts = normalizedName.split(/\s+/);

        if (nameParts.length === 1) {
          // Single word: only match if it's an exact nom match
          matchedPatient = patients.find((p) => normalizeString(p.nom) === nameParts[0]);
        } else {
          // Multiple words: try to match all parts
          const candidates = patients.filter((p) => {
            const patientNom = normalizeString(p.nom);
            const patientPrenom = normalizeString(p.prenom);

            // Check if all name parts are found in patient name
            return nameParts.every(part =>
              patientNom.includes(part) || patientPrenom.includes(part)
            );
          });

          // If multiple candidates, choose the best match (shortest full name = closest match)
          if (candidates.length > 0) {
            matchedPatient = candidates.reduce((best, current) => {
              const bestLen = (best.nom + best.prenom).length;
              const currentLen = (current.nom + current.prenom).length;
              return currentLen < bestLen ? current : best;
            });
          }
        }
      }

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

  const findSimilarPatients = (name: string) => {
    if (!patients) return [];

    const normalizedName = normalizeString(name);
    const nameParts = normalizedName.split(/\s+/);

    // Find patients where at least one name part matches
    const similar = patients.filter((p) => {
      const patientNom = normalizeString(p.nom);
      const patientPrenom = normalizeString(p.prenom);

      return nameParts.some(part =>
        patientNom.includes(part) || patientPrenom.includes(part) ||
        part.includes(patientNom) || part.includes(patientPrenom)
      );
    });

    // Limit to 3 suggestions
    return similar.slice(0, 3);
  };

  const handleSelectSimilarPatient = async (name: string, patientId: string) => {
    if (!consultation) return;

    try {
      const patient = patients?.find(p => p.id === patientId);
      if (!patient) return;

      let ageInDays: number | undefined;
      if (patient.date_naissance) {
        ageInDays = calculateAgeInDays(patient.date_naissance, consultation.date);
      }

      await createObservation.mutateAsync({
        patient_id: patientId,
        consultation_id: consultationId,
        date: consultation.date,
        type_observation: TypeObservation.CONSULTATION,
        contenu: "",
        age_patient_jours: ageInDays,
      });

      // Remove from unmatched list
      setUnmatchedNames((prev) => prev.filter((n) => n !== name));
    } catch (error) {
      console.error("Error creating observation:", error);
      alert("Erreur lors de la création de l'observation");
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Title */}
            {editingField === "titre" ? (
              <div ref={editingContainerRef} className="flex items-center gap-2">
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
                <div ref={editingContainerRef} className="flex items-center gap-1">
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
                <div ref={editingContainerRef} className="flex items-center gap-1">
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

            {/* Tags */}
            <div className="mt-2">
              {editingField === "tags" ? (
                <div ref={editingContainerRef} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="Separez par des virgules"
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveField();
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                  />
                  <button onClick={handleSaveField} className="text-green-600 hover:text-green-800">
                    <Check className="h-3 w-3" />
                  </button>
                  <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : consultation.tags ? (
                <div
                  onClick={() => handleStartEdit("tags")}
                  className="flex flex-wrap gap-1 cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1"
                  title="Cliquez pour modifier"
                >
                  {consultation.tags.split(",").map((tag, i) => (
                    <span key={i} className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => handleStartEdit("tags")}
                  className="text-gray-400 hover:text-gray-600 text-xs flex items-center gap-1"
                >
                  <Tag className="h-3 w-3" />
                  Ajouter des tags
                </button>
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
          <div className="space-y-3">
            {unmatchedNames.map((name) => {
              const similarPatients = findSimilarPatients(name);
              return (
                <div
                  key={name}
                  className="rounded-md bg-white p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{name}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCreatePatient(name)}
                        isLoading={creatingPatient === name}
                      >
                        <UserPlus className="mr-1 h-3 w-3" />
                        Creer nouveau
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
                  {similarPatients.length > 0 && (
                    <div className="pl-2 border-l-2 border-blue-200">
                      <p className="text-xs text-gray-500 mb-1">Patients similaires :</p>
                      <div className="space-y-1">
                        {similarPatients.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handleSelectSimilarPatient(name, p.id)}
                            className="block w-full text-left px-2 py-1 text-xs rounded hover:bg-blue-50 text-blue-700"
                          >
                            {p.nom} {p.prenom}
                            {p.date_naissance && ` (${formatDate(p.date_naissance)})`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
