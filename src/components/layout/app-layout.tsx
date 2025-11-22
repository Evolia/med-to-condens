"use client";

import { ReactNode, useState, useEffect } from "react";
import { useAppModule } from "./use-app-module";
import { GlobalSearch } from "./global-search";
import { DesktopLayout } from "./desktop-layout";
import { MobileLayout } from "./mobile-layout";
import { useDevice } from "@/hooks/use-device";
import { useTabsStore, useQuickCreateStore } from "@/stores";
import { ModuleType } from "@/types";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { activeModule, setActiveModule } = useAppModule();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const deviceType = useDevice();
  const { addTab } = useTabsStore();
  const { trigger } = useQuickCreateStore();

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
    if (module === ModuleType.DOSSIERS) {
      // For Dossiers, create a new tab
      addTab({
        id: `new-patient-${Date.now()}`,
        type: "new",
        module: ModuleType.DOSSIERS,
        title: "Nouveau dossier",
      });
    } else {
      // For Observations and Todos, trigger the store
      trigger(module);
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
