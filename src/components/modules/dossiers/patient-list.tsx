"use client";

import { useState, useMemo } from "react";
import { Search, Plus, User } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { usePatients } from "@/hooks";
import { Patient, ModuleType } from "@/types";
import { useTabsStore } from "@/stores/tabs-store";
import { calculateAge } from "@/lib/date-utils";

export function PatientList() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: patients, isLoading } = usePatients();
  const { addTab } = useTabsStore();

  // Filter patients locally for instant feedback
  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    if (!searchTerm.trim()) return patients;

    const term = searchTerm.toLowerCase().trim();

    return patients.filter((patient) => {
      const nom = patient.nom.toLowerCase();
      const prenom = patient.prenom.toLowerCase();
      const fullName = `${nom} ${prenom}`;
      const reverseName = `${prenom} ${nom}`;

      return (
        nom.includes(term) ||
        prenom.includes(term) ||
        fullName.includes(term) ||
        reverseName.includes(term)
      );
    });
  }, [patients, searchTerm]);

  const handlePatientClick = (patient: Patient) => {
    addTab({
      id: `patient-${patient.id}`,
      type: "patient",
      module: ModuleType.DOSSIERS,
      title: `${patient.nom} ${patient.prenom}`,
      data: { patientId: patient.id },
    });
  };

  const handleNewPatient = () => {
    addTab({
      id: `new-patient-${Date.now()}`,
      type: "new",
      module: ModuleType.DOSSIERS,
      title: "Nouveau dossier",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header with search and add button */}
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Rechercher un patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Button onClick={handleNewPatient}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau dossier
          </Button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {filteredPatients.length} patient{filteredPatients.length !== 1 ? "s" : ""}
          {searchTerm && ` pour "${searchTerm}"`}
        </p>
      </div>

      {/* Patient list */}
      <div className="flex-1 overflow-auto">
        {filteredPatients.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-500">
            <User className="mb-2 h-12 w-12 text-gray-300" />
            {searchTerm ? (
              <p>Aucun patient trouve pour "{searchTerm}"</p>
            ) : (
              <p>Aucun patient enregistre</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredPatients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => handlePatientClick(patient)}
                className="w-full px-4 py-3 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {patient.nom.toUpperCase()} {patient.prenom}
                    </p>
                    <p className="text-sm text-gray-500">
                      {patient.date_naissance
                        ? calculateAge(patient.date_naissance)
                        : "Date de naissance non renseignee"}
                      {patient.secteur && ` • ${patient.secteur}`}
                    </p>
                  </div>
                  {patient.sexe && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        patient.sexe === "M"
                          ? "bg-blue-100 text-blue-700"
                          : patient.sexe === "F"
                          ? "bg-pink-100 text-pink-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {patient.sexe}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
