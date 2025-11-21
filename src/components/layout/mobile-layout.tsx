"use client";

import { ReactNode } from "react";
import { MainNavigation } from "./main-navigation";
import { TabBar } from "./tab-bar";
import { ModuleType } from "@/types";

interface MobileLayoutProps {
  children: ReactNode;
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
  onSearchClick: () => void;
}

export function MobileLayout({
  children,
  activeModule,
  onModuleChange,
  onSearchClick,
}: MobileLayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <MainNavigation
        activeModule={activeModule}
        onModuleChange={onModuleChange}
        onSearchClick={onSearchClick}
      />
      <TabBar module={activeModule} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
