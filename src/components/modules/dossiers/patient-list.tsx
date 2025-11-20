"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Plus, User, List, Table, ArrowUpDown, Trash2 } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { usePatients, useDeletePatient } from "@/hooks";
import { Patient, ModuleType } from "@/types";
import { useTabsStore } from "@/stores/tabs-store";
import { calculateAge, formatDate } from "@/lib/date-utils";

// Normalize string: remove accents and convert to lowercase
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

type ViewMode = "list" | "table";
type SortField = "nom" | "prenom" | "date_naissance" | "secteur" | "sexe";
type SortDirection = "asc" | "desc";

export function PatientList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortField, setSortField] = useState<SortField>("nom");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const { data: patients, isLoading } = usePatients();
  const deletePatient = useDeletePatient();
  const { addTab, tabs } = useTabsStore();

  // Ensure the main list tab exists on mount
  useEffect(() => {
    const hasListTab = tabs.some(
      (tab) => tab.module === ModuleType.DOSSIERS && tab.type === "list"
    );
    if (!hasListTab) {
      addTab({
        id: "dossiers-list",
        type: "list",
        module: ModuleType.DOSSIERS,
        title: "Liste patients",
      });
    }
  }, [tabs, addTab]);

  // Filter and sort patients locally for instant feedback
  const filteredPatients = useMemo(() => {
    if (!patients) return [];

    // First filter
    let result = patients;
    if (searchTerm.trim()) {
      const term = normalizeString(searchTerm.trim());
      result = patients.filter((patient) => {
        const nom = normalizeString(patient.nom);
        const prenom = normalizeString(patient.prenom);
        const fullName = `${nom} ${prenom}`;
        const reverseName = `${prenom} ${nom}`;

        return (
          nom.includes(term) ||
          prenom.includes(term) ||
          fullName.includes(term) ||
          reverseName.includes(term)
        );
      });
    }

    // Then sort
    return [...result].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "nom":
          comparison = a.nom.localeCompare(b.nom);
          break;
        case "prenom":
          comparison = a.prenom.localeCompare(b.prenom);
          break;
        case "date_naissance":
          const dateA = a.date_naissance || "";
          const dateB = b.date_naissance || "";
          comparison = dateA.localeCompare(dateB);
          break;
        case "secteur":
          const secteurA = a.secteur || "";
          const secteurB = b.secteur || "";
          comparison = secteurA.localeCompare(secteurB);
          break;
        case "sexe":
          const sexeA = a.sexe || "";
          const sexeB = b.sexe || "";
          comparison = sexeA.localeCompare(sexeB);
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [patients, searchTerm, sortField, sortDirection]);

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDelete = async (patientId: string, patientName: string) => {
    if (confirm(`Voulez-vous vraiment supprimer le dossier de ${patientName} ?`)) {
      await deletePatient.mutateAsync(patientId);
    }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-4 py-3 font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortField === field ? "text-blue-600" : "text-gray-400"}`} />
      </div>
    </th>
  );

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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <List className="h-4 w-4" />
              Liste
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Table className="h-4 w-4" />
              Tableau
            </button>
          </div>
        </div>
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
              <p>Aucun patient trouve pour &quot;{searchTerm}&quot;</p>
            ) : (
              <p>Aucun patient enregistre</p>
            )}
          </div>
        ) : viewMode === "list" ? (
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
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <SortHeader field="nom">Nom</SortHeader>
                <SortHeader field="prenom">Prenom</SortHeader>
                <SortHeader field="date_naissance">Date naissance</SortHeader>
                <SortHeader field="sexe">Sexe</SortHeader>
                <SortHeader field="secteur">Secteur</SortHeader>
                <th className="px-4 py-3 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handlePatientClick(patient)}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {patient.nom.toUpperCase()}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{patient.prenom}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {patient.date_naissance ? (
                      <div>
                        <div>{formatDate(patient.date_naissance)}</div>
                        <div className="text-xs text-gray-500">
                          {calculateAge(patient.date_naissance)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {patient.sexe ? (
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
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {patient.secteur ? (
                      <div className="flex flex-wrap gap-1">
                        {patient.secteur.split(",").map((s, i) => (
                          <span key={i} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                            {s.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(patient.id, `${patient.nom} ${patient.prenom}`);
                      }}
                      className="text-gray-400 hover:text-red-600"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
