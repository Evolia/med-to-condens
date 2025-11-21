"use client";

import { ReactNode, useState, useEffect } from "react";
import { MainNavigation } from "./main-navigation";
import { TabBar } from "./tab-bar";
import { useAppModule } from "./use-app-module";
import { GlobalSearch } from "./global-search";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { activeModule, setActiveModule } = useAppModule();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <MainNavigation
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        onSearchClick={() => setIsSearchOpen(true)}
      />
      <TabBar module={activeModule} />
      <main className="flex-1 overflow-auto">{children}</main>
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
