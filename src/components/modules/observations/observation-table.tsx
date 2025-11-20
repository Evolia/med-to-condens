"use client";

import { useState } from "react";
import { Edit, Trash2, CheckSquare } from "lucide-react";
import { Observation, TypeObservation, Patient, ModuleType } from "@/types";
import { useDeleteObservation, useUpdateObservation } from "@/hooks";
import { formatDate, calculateAge } from "@/lib/date-utils";
import { useTabsStore } from "@/stores/tabs-store";

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
  const deleteObservation = useDeleteObservation();
  const updateObservation = useUpdateObservation();
  const { addTab } = useTabsStore();

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
              <th className="px-4 py-3 font-medium text-gray-900">Patient</th>
            )}
            <th className="px-4 py-3 font-medium text-gray-900">Age</th>
            <th className="px-4 py-3 font-medium text-gray-900">Date</th>
            <th className="px-4 py-3 font-medium text-gray-900">Type</th>
            <th className="px-4 py-3 font-medium text-gray-900">Contenu</th>
            <th className="px-4 py-3 font-medium text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {observations.map((obs) => (
            <tr key={obs.id} className="hover:bg-gray-50">
              {showPatient && (
                <td className="px-4 py-3">
                  {obs.patient ? (
                    <button
                      onClick={() => handlePatientClick(obs.patient!)}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {obs.patient.nom.toUpperCase()} {obs.patient.prenom}
                    </button>
                  ) : (
                    "-"
                  )}
                </td>
              )}
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
                  <p className="line-clamp-2 text-gray-600">{obs.contenu || "-"}</p>
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
