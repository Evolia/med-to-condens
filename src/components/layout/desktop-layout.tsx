"use client";

import { ReactNode } from "react";
import { MainNavigation } from "./main-navigation";
import { TabBar } from "./tab-bar";
import { ModuleType } from "@/types";

interface DesktopLayoutProps {
  children: ReactNode;
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
  onSearchClick: () => void;
  onQuickCreate: (module: ModuleType) => void;
}

export function DesktopLayout({
  children,
  activeModule,
  onModuleChange,
  onSearchClick,
  onQuickCreate,
}: DesktopLayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <MainNavigation
        activeModule={activeModule}
        onModuleChange={onModuleChange}
        onSearchClick={onSearchClick}
        onQuickCreate={onQuickCreate}
      />
      <TabBar module={activeModule} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
