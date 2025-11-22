"use client";

import { useState, useEffect } from "react";
import { Plus, Calendar, List, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui";
import {
  useTodayObservations,
  useObservations,
  useCreateConsultation,
  useConsultations,
} from "@/hooks";
import { useTabsStore } from "@/stores/tabs-store";
import { ModuleType } from "@/types";
import { ObservationTable } from "./observation-table";
import { ObservationForm } from "./observation-form";
import { ConsultationView } from "./consultation-view";
import { ConsultationTable } from "./consultation-table";

type ViewType = "today" | "all" | "group";

export function ObservationsModule() {
  const [view, setView] = useState<ViewType>("today");

  const { tabs, activeTabId, addTab, removeTab } = useTabsStore();
  const { data: todayObservations, isLoading: loadingToday } =
    useTodayObservations();
  const { data: allObservations, isLoading: loadingAll } = useObservations();
  const { data: consultations, isLoading: loadingConsultations } = useConsultations();
  const createConsultation = useCreateConsultation();

  // Ensure the main list tab exists on mount
  useEffect(() => {
    const hasListTab = tabs.some(
      (tab) => tab.module === ModuleType.OBSERVATIONS && tab.type === "list"
    );
    if (!hasListTab) {
      addTab({
        id: "observations-list",
        type: "list",
        module: ModuleType.OBSERVATIONS,
        title: "Observations",
      });
    }
  }, [tabs, addTab]);

  // Check if we have an active tab for this module
  const activeTab = tabs.find(
    (tab) =>
      tab.id === activeTabId && tab.module === ModuleType.OBSERVATIONS
  );

  // If there's an active consultation tab, show it
  if (activeTab?.type === "consultation" && activeTab.data?.consultationId) {
    return <ConsultationView consultationId={activeTab.data.consultationId} />;
  }

  // If there's an active "new" tab, show the observation form
  if (activeTab?.type === "new") {
    return (
      <ObservationForm
        patientId={activeTab.data?.patientId}
        onSuccess={() => removeTab(activeTab.id)}
        onCancel={() => removeTab(activeTab.id)}
      />
    );
  }

  const handleNewConsultation = async () => {
    const today = new Date().toISOString().split("T")[0];
    const consultation = await createConsultation.mutateAsync({
      date: today,
      type: "consultation",
      titre: `Consultation du ${new Date().toLocaleDateString("fr-FR")}`,
    });

    addTab({
      id: `consultation-${consultation.id}`,
      type: "consultation",
      module: ModuleType.OBSERVATIONS,
      title: consultation.titre || "Consultation",
      data: { consultationId: consultation.id },
    });
  };

  const handleConsultationClick = (consultationId: string, titre: string) => {
    addTab({
      id: `consultation-${consultationId}`,
      type: "consultation",
      module: ModuleType.OBSERVATIONS,
      title: titre,
      data: { consultationId },
    });
  };

  const observations = view === "today" ? todayObservations : allObservations;
  const isLoading = view === "today" ? loadingToday : view === "group" ? loadingConsultations : loadingAll;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("today")}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                view === "today"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Calendar className="h-4 w-4" />
              Ce jour
            </button>
            <button
              onClick={() => setView("all")}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                view === "all"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <List className="h-4 w-4" />
              Toutes
            </button>
            <button
              onClick={() => setView("group")}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                view === "group"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FolderOpen className="h-4 w-4" />
              Groupes
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                addTab({
                  id: `new-observation-${Date.now()}`,
                  type: "new",
                  module: ModuleType.OBSERVATIONS,
                  title: "Nouvelle observation",
                });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Observation
            </Button>
            <Button
              onClick={handleNewConsultation}
              isLoading={createConsultation.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              Consultation
            </Button>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {view === "group"
            ? `${consultations?.length || 0} consultation${(consultations?.length || 0) !== 1 ? "s" : ""} / reunion${(consultations?.length || 0) !== 1 ? "s" : ""}`
            : `${observations?.length || 0} observation${(observations?.length || 0) !== 1 ? "s" : ""}${view === "today" ? " aujourd'hui" : ""}`}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : view === "group" ? (
          <ConsultationTable consultations={consultations || []} observations={allObservations || []} />
        ) : (
          <ObservationTable observations={observations || []} showPatient />
        )}
      </div>
    </div>
  );
}

export { ObservationTable } from "./observation-table";
export { ObservationForm } from "./observation-form";
export { ConsultationView } from "./consultation-view";
export { ConsultationTable } from "./consultation-table";
