"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Edit, Trash2, ArrowUpDown, ClipboardList, Calendar, X, Filter, ChevronUp, ChevronDown } from "lucide-react";
import { Observation, TypeObservation, Patient, ModuleType } from "@/types";
import { useDeleteObservation, useTodos } from "@/hooks";
import { formatDate, calculateAge } from "@/lib/date-utils";
import { useTabsStore } from "@/stores/tabs-store";
import { useAppModule } from "@/components/layout/use-app-module";
import { ObservationForm } from "./observation-form";

type SortField = "patient" | "secteur" | "age" | "date" | "type";
type SortDirection = "asc" | "desc";

interface DateFilter {
  start: string;
  end: string;
}

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
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showTodosForPatient, setShowTodosForPatient] = useState<string | null>(null);
  const todosPopupRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [selectedSecteurs, setSelectedSecteurs] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<TypeObservation[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ start: "", end: "" });
  const [showSecteurFilter, setShowSecteurFilter] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Edit modal state
  const [editingObservation, setEditingObservation] = useState<Observation | null>(null);

  const secteurFilterRef = useRef<HTMLDivElement>(null);
  const typeFilterRef = useRef<HTMLDivElement>(null);
  const dateFilterRef = useRef<HTMLDivElement>(null);

  const deleteObservation = useDeleteObservation();
  const { data: allTodos } = useTodos({ completed: false });
  const { addTab } = useTabsStore();
  const { setActiveModule } = useAppModule();

  // Close todos popup on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        todosPopupRef.current &&
        !todosPopupRef.current.contains(event.target as Node)
      ) {
        setShowTodosForPatient(null);
      }
    };

    if (showTodosForPatient) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showTodosForPatient]);

  // Close filter dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (secteurFilterRef.current && !secteurFilterRef.current.contains(event.target as Node)) {
        setShowSecteurFilter(false);
      }
      if (typeFilterRef.current && !typeFilterRef.current.contains(event.target as Node)) {
        setShowTypeFilter(false);
      }
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target as Node)) {
        setShowDateFilter(false);
      }
    };

    if (showSecteurFilter || showTypeFilter || showDateFilter) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSecteurFilter, showTypeFilter, showDateFilter]);

  // Get unique secteurs from observations
  const uniqueSecteurs = useMemo(() => {
    const secteurs = new Set<string>();
    observations.forEach((obs) => {
      if (obs.patient?.secteur) {
        obs.patient.secteur.split(",").forEach((s) => {
          const trimmed = s.trim();
          if (trimmed) secteurs.add(trimmed);
        });
      }
    });
    return Array.from(secteurs).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [observations]);

  // Get todos count by patient
  const todosByPatient = useMemo(() => {
    if (!allTodos) return {};
    const map: Record<string, number> = {};
    allTodos.forEach((todo) => {
      if (todo.patient_id) {
        map[todo.patient_id] = (map[todo.patient_id] || 0) + 1;
      }
    });
    return map;
  }, [allTodos]);

  // Get todos for a specific patient
  const getTodosForPatient = (patientId: string) => {
    if (!allTodos) return [];
    return allTodos.filter((todo) => todo.patient_id === patientId);
  };

  // Filter observations
  const filteredObservations = useMemo(() => {
    return observations.filter((obs) => {
      // Filter by secteur
      if (selectedSecteurs.length > 0) {
        if (!obs.patient?.secteur) return false;
        const obsSecteurs = obs.patient.secteur.split(",").map((s) => s.trim());
        if (!selectedSecteurs.some((s) => obsSecteurs.includes(s))) return false;
      }

      // Filter by type
      if (selectedTypes.length > 0) {
        if (!selectedTypes.includes(obs.type_observation)) return false;
      }

      // Filter by date
      if (dateFilter.start) {
        const obsDate = new Date(obs.date);
        const startDate = new Date(dateFilter.start);
        startDate.setHours(0, 0, 0, 0);

        if (dateFilter.end) {
          const endDate = new Date(dateFilter.end);
          endDate.setHours(23, 59, 59, 999);
          if (obsDate < startDate || obsDate > endDate) return false;
        } else {
          // Only start date - show only that day
          const endOfDay = new Date(dateFilter.start);
          endOfDay.setHours(23, 59, 59, 999);
          if (obsDate < startDate || obsDate > endOfDay) return false;
        }
      }

      return true;
    });
  }, [observations, selectedSecteurs, selectedTypes, dateFilter]);

  // Sort observations
  const sortedObservations = useMemo(() => {
    return [...filteredObservations].sort((a, b) => {
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
  }, [filteredObservations, sortField, sortDirection]);

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

  const hasActiveFilters = selectedSecteurs.length > 0 || selectedTypes.length > 0 || dateFilter.start;

  const toggleSecteur = (secteur: string) => {
    setSelectedSecteurs((prev) =>
      prev.includes(secteur) ? prev.filter((s) => s !== secteur) : [...prev, secteur]
    );
  };

  const toggleType = (type: TypeObservation) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedSecteurs([]);
    setSelectedTypes([]);
    setDateFilter({ start: "", end: "" });
  };

  const handleEdit = (obs: Observation) => {
    setEditingObservation(obs);
  };

  const handleEditSuccess = () => {
    setEditingObservation(null);
  };

  const handleEditCancel = () => {
    setEditingObservation(null);
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
    <div className="pb-48">
      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 border-b border-blue-100">
          <Filter className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-700">
            Filtres actifs: {filteredObservations.length} / {observations.length} observations
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
            {showPatient && (
              <SortHeader field="patient">Patient</SortHeader>
            )}
            {/* Secteur column with sort and filter */}
            <th className="relative px-4 py-3 font-medium text-gray-900">
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-1 cursor-pointer hover:text-blue-600"
                  onClick={() => handleSort("secteur")}
                >
                  Secteur
                  <SortIcon field="secteur" />
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
            <SortHeader field="age">Age</SortHeader>
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
                              checked={selectedTypes.includes(type as TypeObservation)}
                              onChange={() => toggleType(type as TypeObservation)}
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
                        <div className="relative">
                          <button
                            className="flex items-center gap-0.5 rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700 hover:bg-orange-200 cursor-pointer transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowTodosForPatient(
                                showTodosForPatient === obs.patient!.id ? null : obs.patient!.id
                              );
                            }}
                            onMouseEnter={() => setShowTodosForPatient(obs.patient!.id)}
                            title={`${todosByPatient[obs.patient.id]} tache(s) en cours - cliquez pour voir`}
                          >
                            <ClipboardList className="h-3 w-3" />
                            {todosByPatient[obs.patient.id]}
                          </button>

                          {showTodosForPatient === obs.patient.id && (
                            <div
                              ref={todosPopupRef}
                              className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[300px] max-w-[400px]"
                              onMouseLeave={() => setShowTodosForPatient(null)}
                            >
                              <div className="mb-2 font-medium text-sm text-gray-900 border-b pb-2">
                                Taches en cours ({getTodosForPatient(obs.patient.id).length})
                              </div>
                              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {getTodosForPatient(obs.patient.id).map((todo) => (
                                  <div key={todo.id} className="border-l-2 border-orange-400 pl-2 py-1 text-xs">
                                    <div className="flex items-start gap-2 mb-1">
                                      <span className={`rounded px-1.5 py-0.5 text-xs ${
                                        todo.urgence === 'critique' ? 'bg-red-100 text-red-700' :
                                        todo.urgence === 'haute' ? 'bg-orange-100 text-orange-700' :
                                        todo.urgence === 'normale' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {todo.urgence}
                                      </span>
                                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
                                        {todo.type_todo}
                                      </span>
                                    </div>
                                    <p className="text-gray-700 mb-1">{todo.contenu}</p>
                                    {todo.date_echeance && (
                                      <div className="flex items-center gap-1 text-gray-500">
                                        <Calendar className="h-3 w-3" />
                                        <span>{formatDate(todo.date_echeance)}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
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
                <p className="line-clamp-2 text-gray-600">
                  {obs.contenu || <span className="text-gray-400 italic">-</span>}
                </p>
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

      {/* Edit Modal */}
      {editingObservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h3 className="text-lg font-medium text-gray-900">
                Modifier l'observation
              </h3>
              <button
                onClick={handleEditCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ObservationForm
              observation={editingObservation}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
