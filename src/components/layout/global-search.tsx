"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, X, User, FileText, Calendar, CheckSquare } from "lucide-react";
import { usePatients, useObservations, useConsultations, useTodos } from "@/hooks";
import { useTabsStore } from "@/stores/tabs-store";
import { useAppModule } from "./use-app-module";
import { ModuleType } from "@/types";
import { formatDate } from "@/lib/date-utils";

// Normalize string: remove accents and convert to lowercase
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: patients } = usePatients();
  const { data: observations } = useObservations({});
  const { data: consultations } = useConsultations();
  const { data: todos } = useTodos({});
  const { addTab } = useTabsStore();
  const { setActiveModule } = useAppModule();

  // Reset search when closing
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return { patients: [], observations: [], consultations: [], todos: [] };

    const term = normalizeString(searchTerm.trim());

    // Search patients
    const matchedPatients = (patients || []).filter((patient) => {
      const nom = normalizeString(patient.nom);
      const prenom = normalizeString(patient.prenom);
      const fullName = `${nom} ${prenom}`;
      const reverseName = `${prenom} ${nom}`;
      const secteur = patient.secteur ? normalizeString(patient.secteur) : "";

      return (
        nom.includes(term) ||
        prenom.includes(term) ||
        fullName.includes(term) ||
        reverseName.includes(term) ||
        secteur.includes(term)
      );
    }).slice(0, 5);

    // Search observations
    const matchedObservations = (observations || []).filter((obs) => {
      const contenu = obs.contenu ? normalizeString(obs.contenu) : "";
      const patientNom = obs.patient ? normalizeString(obs.patient.nom) : "";
      const patientPrenom = obs.patient ? normalizeString(obs.patient.prenom) : "";

      return (
        contenu.includes(term) ||
        patientNom.includes(term) ||
        patientPrenom.includes(term)
      );
    }).slice(0, 5);

    // Search consultations
    const matchedConsultations = (consultations || []).filter((consultation) => {
      const titre = consultation.titre ? normalizeString(consultation.titre) : "";
      const type = consultation.type ? normalizeString(consultation.type) : "";
      const tags = consultation.tags ? normalizeString(consultation.tags) : "";

      return titre.includes(term) || type.includes(term) || tags.includes(term);
    }).slice(0, 5);

    // Search todos
    const matchedTodos = (todos || []).filter((todo) => {
      const contenu = normalizeString(todo.contenu);
      const typeTodo = normalizeString(todo.type_todo);
      const tags = todo.tags ? normalizeString(todo.tags) : "";
      const patientNom = todo.patient ? normalizeString(todo.patient.nom) : "";
      const patientPrenom = todo.patient ? normalizeString(todo.patient.prenom) : "";

      return (
        contenu.includes(term) ||
        typeTodo.includes(term) ||
        tags.includes(term) ||
        patientNom.includes(term) ||
        patientPrenom.includes(term)
      );
    }).slice(0, 5);

    return {
      patients: matchedPatients,
      observations: matchedObservations,
      consultations: matchedConsultations,
      todos: matchedTodos,
    };
  }, [searchTerm, patients, observations, consultations, todos]);

  const handlePatientClick = (patientId: string, patientName: string) => {
    setActiveModule(ModuleType.DOSSIERS);
    addTab({
      id: `patient-${patientId}`,
      type: "patient",
      module: ModuleType.DOSSIERS,
      title: patientName,
      data: { patientId },
    });
    onClose();
  };

  const handleConsultationClick = (consultationId: string, consultationTitle: string) => {
    setActiveModule(ModuleType.OBSERVATIONS);
    addTab({
      id: `consultation-${consultationId}`,
      type: "consultation",
      module: ModuleType.OBSERVATIONS,
      title: consultationTitle,
      data: { consultationId },
    });
    onClose();
  };

  const totalResults =
    searchResults.patients.length +
    searchResults.observations.length +
    searchResults.consultations.length +
    searchResults.todos.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
        {/* Search input */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher partout (patients, observations, consultations, todos)..."
              className="flex-1 outline-none text-lg"
              autoFocus
            />
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-4">
          {!searchTerm.trim() ? (
            <div className="text-center text-gray-500 py-8">
              Tapez pour rechercher dans tous les modules
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Aucun résultat pour &ldquo;{searchTerm}&rdquo;
            </div>
          ) : (
            <div className="space-y-4">
              {/* Patients */}
              {searchResults.patients.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                    <User className="h-4 w-4" />
                    Patients ({searchResults.patients.length})
                  </h3>
                  <div className="space-y-1">
                    {searchResults.patients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() =>
                          handlePatientClick(
                            patient.id,
                            `${patient.nom} ${patient.prenom}`
                          )
                        }
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          {patient.nom.toUpperCase()} {patient.prenom}
                        </div>
                        {patient.secteur && (
                          <div className="text-xs text-gray-500">
                            Secteur: {patient.secteur}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Consultations */}
              {searchResults.consultations.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                    <Calendar className="h-4 w-4" />
                    Consultations ({searchResults.consultations.length})
                  </h3>
                  <div className="space-y-1">
                    {searchResults.consultations.map((consultation) => (
                      <button
                        key={consultation.id}
                        onClick={() =>
                          handleConsultationClick(
                            consultation.id,
                            consultation.titre ||
                              `Consultation du ${formatDate(consultation.date)}`
                          )
                        }
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          {consultation.titre ||
                            `Consultation du ${formatDate(consultation.date)}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {consultation.type || "consultation"} • {formatDate(consultation.date)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Observations */}
              {searchResults.observations.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                    <FileText className="h-4 w-4" />
                    Observations ({searchResults.observations.length})
                  </h3>
                  <div className="space-y-1">
                    {searchResults.observations.map((obs) => (
                      <button
                        key={obs.id}
                        onClick={() => {
                          if (obs.patient) {
                            handlePatientClick(
                              obs.patient.id,
                              `${obs.patient.nom} ${obs.patient.prenom}`
                            );
                          }
                        }}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors"
                      >
                        {obs.patient && (
                          <div className="font-medium text-gray-900 text-sm">
                            {obs.patient.nom.toUpperCase()} {obs.patient.prenom}
                          </div>
                        )}
                        <div className="text-xs text-gray-600 line-clamp-2">
                          {obs.contenu || "[Vide]"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(obs.date)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Todos */}
              {searchResults.todos.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                    <CheckSquare className="h-4 w-4" />
                    Tâches ({searchResults.todos.length})
                  </h3>
                  <div className="space-y-1">
                    {searchResults.todos.map((todo) => (
                      <div
                        key={todo.id}
                        className="px-3 py-2 rounded border border-gray-200"
                      >
                        {todo.patient && (
                          <div className="font-medium text-gray-900 text-sm">
                            {todo.patient.nom.toUpperCase()} {todo.patient.prenom}
                          </div>
                        )}
                        <div className="text-xs text-gray-700">
                          {todo.contenu}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            todo.urgence === 'critique' ? 'bg-red-100 text-red-700' :
                            todo.urgence === 'haute' ? 'bg-orange-100 text-orange-700' :
                            todo.urgence === 'normale' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {todo.urgence}
                          </span>
                          <span className="text-xs text-gray-500">
                            {todo.type_todo}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
