"use client";

import { useState, useMemo } from "react";
import { Trash2, ArrowUpDown, FolderOpen, Tag } from "lucide-react";
import { Consultation, ModuleType } from "@/types";
import { useDeleteConsultation, useUpdateConsultation } from "@/hooks";
import { formatDate } from "@/lib/date-utils";
import { useTabsStore } from "@/stores/tabs-store";

type SortField = "titre" | "date" | "type" | "tags";
type SortDirection = "asc" | "desc";

interface ConsultationTableProps {
  consultations: Consultation[];
}

const typeLabels: Record<string, string> = {
  consultation: "Consultation",
  visite: "Visite",
  reunion: "Reunion",
  staff: "Staff",
  autre: "Autre",
};

export function ConsultationTable({ consultations }: ConsultationTableProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null);
  const [editTagsValue, setEditTagsValue] = useState("");

  const deleteConsultation = useDeleteConsultation();
  const updateConsultation = useUpdateConsultation();
  const { addTab } = useTabsStore();

  // Sort consultations
  const sortedConsultations = useMemo(() => {
    return [...consultations].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "titre":
          const titreA = a.titre || "";
          const titreB = b.titre || "";
          comparison = titreA.localeCompare(titreB);
          break;
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "type":
          const typeA = a.type || "";
          const typeB = b.type || "";
          comparison = typeA.localeCompare(typeB);
          break;
        case "tags":
          const tagsA = a.tags || "";
          const tagsB = b.tags || "";
          comparison = tagsA.localeCompare(tagsB);
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [consultations, sortField, sortDirection]);

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

  const handleConsultationClick = (consultation: Consultation) => {
    addTab({
      id: `consultation-${consultation.id}`,
      type: "consultation",
      module: ModuleType.OBSERVATIONS,
      title: consultation.titre || `Consultation du ${new Date(consultation.date).toLocaleDateString("fr-FR")}`,
      data: { consultationId: consultation.id },
    });
  };

  const handleDelete = async (consultationId: string) => {
    if (confirm("Voulez-vous vraiment supprimer cette consultation et toutes ses observations ?")) {
      await deleteConsultation.mutateAsync(consultationId);
    }
  };

  const handleEditTags = (consultation: Consultation) => {
    setEditingTagsId(consultation.id);
    setEditTagsValue(consultation.tags || "");
  };

  const handleSaveTags = async (consultationId: string) => {
    await updateConsultation.mutateAsync({
      id: consultationId,
      tags: editTagsValue,
    });
    setEditingTagsId(null);
    setEditTagsValue("");
  };

  const handleCancelEditTags = () => {
    setEditingTagsId(null);
    setEditTagsValue("");
  };

  if (consultations.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Aucune consultation ou reunion
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <SortHeader field="titre">Titre</SortHeader>
            <SortHeader field="date">Date</SortHeader>
            <SortHeader field="type">Type</SortHeader>
            <SortHeader field="tags">Tags</SortHeader>
            <th className="px-4 py-3 font-medium text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedConsultations.map((consultation) => (
            <tr key={consultation.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <button
                  onClick={() => handleConsultationClick(consultation)}
                  className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2"
                >
                  <FolderOpen className="h-4 w-4" />
                  {consultation.titre || `Consultation du ${new Date(consultation.date).toLocaleDateString("fr-FR")}`}
                </button>
              </td>
              <td className="px-4 py-3 text-gray-600">{formatDate(consultation.date)}</td>
              <td className="px-4 py-3">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                  {typeLabels[consultation.type || "consultation"] || consultation.type}
                </span>
              </td>
              <td className="px-4 py-3">
                {editingTagsId === consultation.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editTagsValue}
                      onChange={(e) => setEditTagsValue(e.target.value)}
                      placeholder="Separez par des virgules"
                      className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveTags(consultation.id);
                        if (e.key === "Escape") handleCancelEditTags();
                      }}
                    />
                    <button
                      onClick={() => handleSaveTags(consultation.id)}
                      className="text-green-600 hover:text-green-800 text-xs"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancelEditTags}
                      className="text-gray-400 hover:text-gray-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : consultation.tags ? (
                  <div
                    onClick={() => handleEditTags(consultation)}
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
                    onClick={() => handleEditTags(consultation)}
                    className="text-gray-400 hover:text-gray-600 text-xs flex items-center gap-1"
                  >
                    <Tag className="h-3 w-3" />
                    Ajouter tags
                  </button>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(consultation.id)}
                    className="text-gray-400 hover:text-red-600"
                    title="Supprimer"
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
