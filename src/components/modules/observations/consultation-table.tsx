"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Trash2, ArrowUpDown, FolderOpen, Tag, Filter, X, ChevronUp, ChevronDown } from "lucide-react";
import { Consultation, ModuleType, Observation } from "@/types";
import { useDeleteConsultation, useUpdateConsultation } from "@/hooks";
import { formatDate } from "@/lib/date-utils";
import { useTabsStore } from "@/stores/tabs-store";

type SortField = "titre" | "date" | "type" | "tags" | "secteurs";
type SortDirection = "asc" | "desc";

interface DateFilter {
  start: string;
  end: string;
}

interface ConsultationTableProps {
  consultations: Consultation[];
  observations?: Observation[];
}

const typeLabels: Record<string, string> = {
  consultation: "Consultation",
  reunion: "Reunion",
  contact: "Contact",
  autre: "Autre",
};

export function ConsultationTable({ consultations, observations = [] }: ConsultationTableProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null);
  const [editTagsValue, setEditTagsValue] = useState("");

  // Filter states
  const [selectedSecteurs, setSelectedSecteurs] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ start: "", end: "" });
  const [showSecteurFilter, setShowSecteurFilter] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [showTagsFilter, setShowTagsFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

  const secteurFilterRef = useRef<HTMLDivElement>(null);
  const typeFilterRef = useRef<HTMLDivElement>(null);
  const tagsFilterRef = useRef<HTMLDivElement>(null);
  const dateFilterRef = useRef<HTMLDivElement>(null);

  const deleteConsultation = useDeleteConsultation();
  const updateConsultation = useUpdateConsultation();
  const { addTab } = useTabsStore();

  // Close filter dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (secteurFilterRef.current && !secteurFilterRef.current.contains(event.target as Node)) {
        setShowSecteurFilter(false);
      }
      if (typeFilterRef.current && !typeFilterRef.current.contains(event.target as Node)) {
        setShowTypeFilter(false);
      }
      if (tagsFilterRef.current && !tagsFilterRef.current.contains(event.target as Node)) {
        setShowTagsFilter(false);
      }
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target as Node)) {
        setShowDateFilter(false);
      }
    };

    if (showSecteurFilter || showTypeFilter || showTagsFilter || showDateFilter) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSecteurFilter, showTypeFilter, showTagsFilter, showDateFilter]);

  // Calculate sectors per consultation from observations
  const secteursByConsultation = useMemo(() => {
    const result: Record<string, string[]> = {};

    observations.forEach((obs) => {
      if (obs.consultation_id && obs.patient?.secteur) {
        const consultationId = obs.consultation_id;
        if (!result[consultationId]) {
          result[consultationId] = [];
        }
        // Add unique sectors from this patient
        obs.patient.secteur.split(",").forEach((s) => {
          const trimmed = s.trim();
          if (trimmed && !result[consultationId].includes(trimmed)) {
            result[consultationId].push(trimmed);
          }
        });
      }
    });

    // Sort sectors alphabetically
    Object.keys(result).forEach((id) => {
      result[id].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    });

    return result;
  }, [observations]);

  // Get unique secteurs from all consultations
  const uniqueSecteurs = useMemo(() => {
    const secteurs = new Set<string>();
    Object.values(secteursByConsultation).forEach((sects) => {
      sects.forEach((s) => secteurs.add(s));
    });
    return Array.from(secteurs).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [secteursByConsultation]);

  // Get unique tags from all consultations
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    consultations.forEach((c) => {
      if (c.tags) {
        c.tags.split(",").forEach((t) => {
          const trimmed = t.trim();
          if (trimmed) tags.add(trimmed);
        });
      }
    });
    return Array.from(tags).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [consultations]);

  // Filter consultations
  const filteredConsultations = useMemo(() => {
    return consultations.filter((c) => {
      // Filter by secteur
      if (selectedSecteurs.length > 0) {
        const consultationSecteurs = secteursByConsultation[c.id] || [];
        if (!selectedSecteurs.some((s) => consultationSecteurs.includes(s))) return false;
      }

      // Filter by type
      if (selectedTypes.length > 0) {
        if (!selectedTypes.includes(c.type || "consultation")) return false;
      }

      // Filter by tags
      if (selectedTags.length > 0) {
        if (!c.tags) return false;
        const consultationTags = c.tags.split(",").map((t) => t.trim());
        if (!selectedTags.some((t) => consultationTags.includes(t))) return false;
      }

      // Filter by date
      if (dateFilter.start) {
        const consultationDate = new Date(c.date);
        const startDate = new Date(dateFilter.start);
        startDate.setHours(0, 0, 0, 0);

        if (dateFilter.end) {
          const endDate = new Date(dateFilter.end);
          endDate.setHours(23, 59, 59, 999);
          if (consultationDate < startDate || consultationDate > endDate) return false;
        } else {
          const endOfDay = new Date(dateFilter.start);
          endOfDay.setHours(23, 59, 59, 999);
          if (consultationDate < startDate || consultationDate > endOfDay) return false;
        }
      }

      return true;
    });
  }, [consultations, selectedSecteurs, selectedTypes, selectedTags, dateFilter, secteursByConsultation]);

  // Sort consultations
  const sortedConsultations = useMemo(() => {
    return [...filteredConsultations].sort((a, b) => {
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
        case "secteurs":
          const secteursA = (secteursByConsultation[a.id] || []).join(", ");
          const secteursB = (secteursByConsultation[b.id] || []).join(", ");
          comparison = secteursA.localeCompare(secteursB);
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredConsultations, sortField, sortDirection, secteursByConsultation]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
    }
    return sortDirection === "asc"
      ? <ChevronUp className="h-3 w-3 text-blue-600" />
      : <ChevronDown className="h-3 w-3 text-blue-600" />;
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-4 py-3 font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <SortIcon field={field} />
      </div>
    </th>
  );

  const hasActiveFilters = selectedSecteurs.length > 0 || selectedTypes.length > 0 || selectedTags.length > 0 || dateFilter.start;

  const toggleSecteur = (secteur: string) => {
    setSelectedSecteurs((prev) =>
      prev.includes(secteur) ? prev.filter((s) => s !== secteur) : [...prev, secteur]
    );
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedSecteurs([]);
    setSelectedTypes([]);
    setSelectedTags([]);
    setDateFilter({ start: "", end: "" });
  };

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
    try {
      // Clean up tags data (trim extra spaces between tags)
      const cleanedTags = editTagsValue
        ? editTagsValue.split(',').map(t => t.trim()).filter(t => t).join(', ')
        : '';

      await updateConsultation.mutateAsync({
        id: consultationId,
        tags: cleanedTags,
      });
      setEditingTagsId(null);
      setEditTagsValue("");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des tags:", error);
      alert(`Erreur lors de la sauvegarde des tags: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
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
    <div className="pb-48">
      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 border-b border-blue-100">
          <Filter className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-700">
            Filtres actifs: {filteredConsultations.length} / {consultations.length} consultations
          </span>
          <button
            onClick={clearFilters}
            className="ml-auto flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
          >
            <X className="h-3 w-3" />
            Effacer les filtres
          </button>
        </div>
      )}

      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <SortHeader field="titre">Titre</SortHeader>
            {/* Date column with sort and filter */}
            <th className="relative px-4 py-3 font-medium text-gray-900">
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-1 cursor-pointer hover:text-blue-600"
                  onClick={() => handleSort("date")}
                >
                  Date
                  <SortIcon field="date" />
                </button>
                <div ref={dateFilterRef} className="relative">
                  <button
                    className="flex items-center gap-1 p-1 rounded hover:bg-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDateFilter(!showDateFilter);
                    }}
                  >
                    <Filter className={`h-3 w-3 ${dateFilter.start ? "text-blue-600" : "text-gray-400"}`} />
                  </button>
                  {showDateFilter && (
                    <div
                      className="absolute left-0 top-full z-10 mt-1 w-64 rounded-md border border-gray-200 bg-white p-3 shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="space-y-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700">Du</label>
                          <input
                            type="date"
                            value={dateFilter.start}
                            onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700">Au (optionnel)</label>
                          <input
                            type="date"
                            value={dateFilter.end}
                            onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                      </div>
                      {dateFilter.start && (
                        <button
                          onClick={() => setDateFilter({ start: "", end: "" })}
                          className="mt-2 w-full rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                        >
                          Effacer
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </th>
            {/* Type column with sort and filter */}
            <th className="relative px-4 py-3 font-medium text-gray-900">
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-1 cursor-pointer hover:text-blue-600"
                  onClick={() => handleSort("type")}
                >
                  Type
                  <SortIcon field="type" />
                </button>
                <div ref={typeFilterRef} className="relative">
                  <button
                    className="flex items-center gap-1 p-1 rounded hover:bg-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTypeFilter(!showTypeFilter);
                    }}
                  >
                    <Filter className={`h-3 w-3 ${selectedTypes.length > 0 ? "text-blue-600" : "text-gray-400"}`} />
                    {selectedTypes.length > 0 && (
                      <span className="rounded-full bg-blue-600 px-1.5 text-xs text-white">
                        {selectedTypes.length}
                      </span>
                    )}
                  </button>
                  {showTypeFilter && (
                    <div
                      className="absolute left-0 top-full z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="max-h-48 overflow-y-auto p-2">
                        {Object.entries(typeLabels).map(([type, label]) => (
                          <label key={type} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-gray-100 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedTypes.includes(type)}
                              onChange={() => toggleType(type)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{label}</span>
                          </label>
                        ))}
                      </div>
                      {selectedTypes.length > 0 && (
                        <div className="border-t border-gray-200 p-2">
                          <button
                            onClick={() => setSelectedTypes([])}
                            className="w-full rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                          >
                            Effacer
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </th>
            {/* Secteurs column with sort and filter */}
            <th className="relative px-4 py-3 font-medium text-gray-900">
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-1 cursor-pointer hover:text-blue-600"
                  onClick={() => handleSort("secteurs")}
                >
                  Secteurs
                  <SortIcon field="secteurs" />
                </button>
                <div ref={secteurFilterRef} className="relative">
                  <button
                    className="flex items-center gap-1 p-1 rounded hover:bg-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSecteurFilter(!showSecteurFilter);
                    }}
                  >
                    <Filter className={`h-3 w-3 ${selectedSecteurs.length > 0 ? "text-blue-600" : "text-gray-400"}`} />
                    {selectedSecteurs.length > 0 && (
                      <span className="rounded-full bg-blue-600 px-1.5 text-xs text-white">
                        {selectedSecteurs.length}
                      </span>
                    )}
                  </button>
                  {showSecteurFilter && (
                    <div
                      className="absolute left-0 top-full z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="max-h-48 overflow-y-auto p-2">
                        {uniqueSecteurs.length === 0 ? (
                          <p className="px-2 py-1 text-xs text-gray-500">Aucun secteur</p>
                        ) : (
                          uniqueSecteurs.map((secteur) => (
                            <label key={secteur} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-gray-100 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedSecteurs.includes(secteur)}
                                onChange={() => toggleSecteur(secteur)}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm">{secteur}</span>
                            </label>
                          ))
                        )}
                      </div>
                      {selectedSecteurs.length > 0 && (
                        <div className="border-t border-gray-200 p-2">
                          <button
                            onClick={() => setSelectedSecteurs([])}
                            className="w-full rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                          >
                            Effacer
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </th>
            {/* Tags column with sort and filter */}
            <th className="relative px-4 py-3 font-medium text-gray-900">
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-1 cursor-pointer hover:text-blue-600"
                  onClick={() => handleSort("tags")}
                >
                  Tags
                  <SortIcon field="tags" />
                </button>
                <div ref={tagsFilterRef} className="relative">
                  <button
                    className="flex items-center gap-1 p-1 rounded hover:bg-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTagsFilter(!showTagsFilter);
                    }}
                  >
                    <Filter className={`h-3 w-3 ${selectedTags.length > 0 ? "text-blue-600" : "text-gray-400"}`} />
                    {selectedTags.length > 0 && (
                      <span className="rounded-full bg-blue-600 px-1.5 text-xs text-white">
                        {selectedTags.length}
                      </span>
                    )}
                  </button>
                  {showTagsFilter && (
                    <div
                      className="absolute left-0 top-full z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="max-h-48 overflow-y-auto p-2">
                        {uniqueTags.length === 0 ? (
                          <p className="px-2 py-1 text-xs text-gray-500">Aucun tag</p>
                        ) : (
                          uniqueTags.map((tag) => (
                            <label key={tag} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-gray-100 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedTags.includes(tag)}
                                onChange={() => toggleTag(tag)}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm">{tag}</span>
                            </label>
                          ))
                        )}
                      </div>
                      {selectedTags.length > 0 && (
                        <div className="border-t border-gray-200 p-2">
                          <button
                            onClick={() => setSelectedTags([])}
                            className="w-full rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                          >
                            Effacer
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </th>
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
                {secteursByConsultation[consultation.id]?.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {secteursByConsultation[consultation.id].map((secteur, i) => (
                      <span key={i} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                        {secteur}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
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
