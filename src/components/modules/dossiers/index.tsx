"use client";

import { useTabsStore } from "@/stores/tabs-store";
import { ModuleType, Patient } from "@/types";
import { PatientList } from "./patient-list";
import { PatientCard } from "./patient-card";
import { PatientForm } from "./patient-form";

export function DossiersModule() {
  const { tabs, activeTabId, removeTab, updateTab, addTab } = useTabsStore();

  // Get the active tab for this module
  const activeTab = tabs.find(
    (tab) => tab.id === activeTabId && tab.module === ModuleType.DOSSIERS
  );

  // If no active tab for this module, show the patient list
  if (!activeTab) {
    return <PatientList />;
  }

  // Render based on tab type
  switch (activeTab.type) {
    case "patient":
      return <PatientCard patientId={activeTab.data?.patientId || ""} />;

    case "new":
      return (
        <PatientForm
          onSuccess={(patient: Patient) => {
            // Close the "new" tab
            removeTab(activeTab.id);
            // Open the patient card tab
            addTab({
              id: `patient-${patient.id}`,
              type: "patient",
              module: ModuleType.DOSSIERS,
              title: `${patient.nom} ${patient.prenom}`,
              data: { patientId: patient.id },
            });
          }}
          onCancel={() => removeTab(activeTab.id)}
        />
      );

    case "list":
    default:
      return <PatientList />;
  }
}

export { PatientList } from "./patient-list";
export { PatientCard } from "./patient-card";
export { PatientForm } from "./patient-form";
