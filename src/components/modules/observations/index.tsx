"use client";

import { useState } from "react";
import { Plus, Calendar, List } from "lucide-react";
import { Button } from "@/components/ui";
import {
  useTodayObservations,
  useObservations,
  useCreateConsultation,
} from "@/hooks";
import { useTabsStore } from "@/stores/tabs-store";
import { ModuleType } from "@/types";
import { ObservationTable } from "./observation-table";
import { ObservationForm } from "./observation-form";
import { ConsultationView } from "./consultation-view";

type ViewType = "today" | "all";

export function ObservationsModule() {
  const [view, setView] = useState<ViewType>("today");
  const [showNewObservation, setShowNewObservation] = useState(false);

  const { tabs, activeTabId, addTab, removeTab } = useTabsStore();
  const { data: todayObservations, isLoading: loadingToday } =
    useTodayObservations();
  const { data: allObservations, isLoading: loadingAll } = useObservations();
  const createConsultation = useCreateConsultation();

  // Check if we have an active tab for this module
  const activeTab = tabs.find(
    (tab) =>
      tab.id === activeTabId && tab.module === ModuleType.OBSERVATIONS
  );

  // If there's an active consultation tab, show it
  if (activeTab?.type === "consultation" && activeTab.data?.consultationId) {
    return <ConsultationView consultationId={activeTab.data.consultationId} />;
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

  const observations = view === "today" ? todayObservations : allObservations;
  const isLoading = view === "today" ? loadingToday : loadingAll;

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
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowNewObservation(true)}
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
          {observations?.length || 0} observation
          {(observations?.length || 0) !== 1 ? "s" : ""}
          {view === "today" && " aujourd'hui"}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : showNewObservation ? (
          <ObservationForm
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

export { ObservationTable } from "./observation-table";
export { ObservationForm } from "./observation-form";
export { ConsultationView } from "./consultation-view";
