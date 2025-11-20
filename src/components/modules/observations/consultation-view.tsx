"use client";

import { useState } from "react";
import { Plus, Users, FileText } from "lucide-react";
import { Button, Input } from "@/components/ui";
import {
  useConsultation,
  useObservations,
  usePatients,
  useCreateBulkObservations,
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

export function ConsultationView({ consultationId }: ConsultationViewProps) {
  const [showNewObservation, setShowNewObservation] = useState(false);
  const [nameList, setNameList] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const { data: consultation, isLoading } = useConsultation(consultationId);
  const { data: observations } = useObservations({ consultationId });
  const { data: patients } = usePatients();
  const createBulkObservations = useCreateBulkObservations();

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

  const handleImportNames = async () => {
    if (!nameList.trim() || !patients) return;

    setIsImporting(true);

    // Parse names (one per line or comma separated)
    const names = nameList
      .split(/[,\n]/)
      .map((n) => n.trim())
      .filter((n) => n);

    const observationsToCreate = [];

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
      }
    }

    if (observationsToCreate.length > 0) {
      await createBulkObservations.mutateAsync(observationsToCreate);
    }

    setNameList("");
    setIsImporting(false);

    const notFound = names.length - observationsToCreate.length;
    if (notFound > 0) {
      alert(
        `${observationsToCreate.length} observation(s) creee(s). ${notFound} patient(s) non trouve(s).`
      );
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {consultation.titre || `Consultation du ${formatDate(consultation.date)}`}
            </h2>
            <p className="text-sm text-gray-500">
              {consultation.type && `${consultation.type} • `}
              {formatDate(consultation.date)}
            </p>
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
