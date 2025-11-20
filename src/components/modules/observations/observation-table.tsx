"use client";

import { useState, useMemo } from "react";
import { Edit, Trash2, CheckSquare, ArrowUpDown, ClipboardList } from "lucide-react";
import { Observation, TypeObservation, Patient, ModuleType } from "@/types";
import { useDeleteObservation, useUpdateObservation, useTodos } from "@/hooks";
import { formatDate, calculateAge } from "@/lib/date-utils";
import { useTabsStore } from "@/stores/tabs-store";
import { useAppModule } from "@/components/layout/use-app-module";

type SortField = "patient" | "secteur" | "age" | "date" | "type";
type SortDirection = "asc" | "desc";

interface ObservationTableProps {
  observations: Observation[];
  showPatient?: boolean;
}

const typeLabels: Record<TypeObservation, string> = {
  [TypeObservation.CONSULTATION]: "Consultation",
  [TypeObservation.SUIVI]: "Suivi",
  [TypeObservation.URGENCE]: "Urgence",
  [TypeObservation.TELEPHONE]: "Telephone",
  [TypeObservation.RESULTATS]: "Resultats",
  [TypeObservation.COURRIER]: "Courrier",
  [TypeObservation.REUNION]: "Reunion",
  [TypeObservation.NOTE]: "Note",
};

export function ObservationTable({
  observations,
  showPatient = true,
}: ObservationTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const deleteObservation = useDeleteObservation();
  const updateObservation = useUpdateObservation();
  const { data: allTodos } = useTodos({ completed: false });
  const { addTab } = useTabsStore();
  const { setActiveModule } = useAppModule();

  // Get todos count by patient
  const todosByPatient = useMemo(() => {
    if (!allTodos) return {};
    const map: Record<string, number> = {};
    allTodos.forEach((todo) => {
      map[todo.patient_id] = (map[todo.patient_id] || 0) + 1;
    });
    return map;
  }, [allTodos]);

  // Sort observations
  const sortedObservations = useMemo(() => {
    return [...observations].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "patient":
          const nameA = a.patient ? `${a.patient.nom} ${a.patient.prenom}` : "";
          const nameB = b.patient ? `${b.patient.nom} ${b.patient.prenom}` : "";
          comparison = nameA.localeCompare(nameB);
          break;
        case "secteur":
          const secteurA = a.patient?.secteur || "";
          const secteurB = b.patient?.secteur || "";
          comparison = secteurA.localeCompare(secteurB);
          break;
        case "age":
          const ageA = a.age_patient_jours || 0;
          const ageB = b.age_patient_jours || 0;
          comparison = ageA - ageB;
          break;
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "type":
          comparison = a.type_observation.localeCompare(b.type_observation);
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [observations, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
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

  const handleEdit = (obs: Observation) => {
    setEditingId(obs.id);
    setEditContent(obs.contenu || "");
  };

  const handleSave = async (obsId: string) => {
    await updateObservation.mutateAsync({
      id: obsId,
      contenu: editContent,
    });
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleDelete = async (obsId: string) => {
    if (confirm("Voulez-vous vraiment supprimer cette observation ?")) {
      await deleteObservation.mutateAsync(obsId);
    }
  };

  const handlePatientClick = (patient: Patient) => {
    // Switch to dossiers module and open patient tab
    setActiveModule(ModuleType.DOSSIERS);
    addTab({
      id: `patient-${patient.id}`,
      type: "patient",
      module: ModuleType.DOSSIERS,
      title: `${patient.nom} ${patient.prenom}`,
      data: { patientId: patient.id },
    });
  };

  const getAgeDisplay = (obs: Observation) => {
    if (obs.age_patient_jours) {
      const years = Math.floor(obs.age_patient_jours / 365);
      const months = Math.floor((obs.age_patient_jours % 365) / 30);
      if (years > 0) {
        return `${years}a${months}m`;
      }
      return `${months}m`;
    }
    if (obs.patient?.date_naissance) {
      return calculateAge(obs.patient.date_naissance);
    }
    return "-";
  };

  if (observations.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Aucune observation
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            {showPatient && (
              <SortHeader field="patient">Patient</SortHeader>
            )}
            <SortHeader field="secteur">Secteur</SortHeader>
            <SortHeader field="age">Age</SortHeader>
            <SortHeader field="date">Date</SortHeader>
            <SortHeader field="type">Type</SortHeader>
            <th className="px-4 py-3 font-medium text-gray-900">Contenu</th>
            <th className="px-4 py-3 font-medium text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedObservations.map((obs) => (
            <tr key={obs.id} className="hover:bg-gray-50">
              {showPatient && (
                <td className="px-4 py-3">
                  {obs.patient ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePatientClick(obs.patient!)}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {obs.patient.nom.toUpperCase()} {obs.patient.prenom}
                      </button>
                      {todosByPatient[obs.patient.id] > 0 && (
                        <span
                          className="flex items-center gap-0.5 rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700"
                          title={`${todosByPatient[obs.patient.id]} tache(s) en cours`}
                        >
                          <ClipboardList className="h-3 w-3" />
                          {todosByPatient[obs.patient.id]}
                        </span>
                      )}
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
              )}
              <td className="px-4 py-3">
                {obs.patient?.secteur ? (
                  <div className="flex flex-wrap gap-1">
                    {obs.patient.secteur.split(",").map((s, i) => (
                      <span key={i} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600">{getAgeDisplay(obs)}</td>
              <td className="px-4 py-3 text-gray-600">{formatDate(obs.date)}</td>
              <td className="px-4 py-3">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                  {typeLabels[obs.type_observation]}
                </span>
              </td>
              <td className="max-w-md px-4 py-3">
                {editingId === obs.id ? (
                  <div className="flex items-center gap-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                      rows={2}
                      autoFocus
                    />
                    <button
                      onClick={() => handleSave(obs.id)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <CheckSquare className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <p
                    onClick={() => handleEdit(obs)}
                    className="line-clamp-2 text-gray-600 cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1"
                    title="Cliquez pour modifier"
                  >
                    {obs.contenu || <span className="text-gray-400 italic">Ajouter du contenu...</span>}
                  </p>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(obs)}
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(obs.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
