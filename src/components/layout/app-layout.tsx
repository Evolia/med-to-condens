"use client";

import { ReactNode, useState, useEffect } from "react";
import { useAppModule } from "./use-app-module";
import { GlobalSearch } from "./global-search";
import { DesktopLayout } from "./desktop-layout";
import { MobileLayout } from "./mobile-layout";
import { useDevice } from "@/hooks/use-device";
import { useTabsStore } from "@/stores";
import { ModuleType } from "@/types";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { activeModule, setActiveModule } = useAppModule();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const deviceType = useDevice();
  const { addTab } = useTabsStore();

  // Handle Cmd+K / Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleQuickCreate = (module: ModuleType) => {
    // Switch to the target module first if not already active
    if (activeModule !== module) {
      setActiveModule(module);
    }

    // Create a new tab for all modules
    if (module === ModuleType.DOSSIERS) {
      addTab({
        id: `new-patient-${Date.now()}`,
        type: "new",
        module: ModuleType.DOSSIERS,
        title: "Nouveau dossier",
      });
    } else if (module === ModuleType.OBSERVATIONS) {
      addTab({
        id: `new-observation-${Date.now()}`,
        type: "new",
        module: ModuleType.OBSERVATIONS,
        title: "Nouvelle observation",
      });
    } else if (module === ModuleType.TODOS) {
      addTab({
        id: `new-todo-${Date.now()}`,
        type: "new",
        module: ModuleType.TODOS,
        title: "Nouvelle tâche",
      });
    }
  };

  const layoutProps = {
    activeModule,
    onModuleChange: setActiveModule,
    onSearchClick: () => setIsSearchOpen(true),
    onQuickCreate: handleQuickCreate,
    children,
  };

  return (
    <>
      {deviceType === "mobile" ? (
        <MobileLayout {...layoutProps} />
      ) : (
        <DesktopLayout {...layoutProps} />
      )}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
