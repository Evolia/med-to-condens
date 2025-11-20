"use client";

import { ReactNode } from "react";
import { MainNavigation } from "./main-navigation";
import { TabBar } from "./tab-bar";
import { useAppModule } from "./use-app-module";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { activeModule, setActiveModule } = useAppModule();

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <MainNavigation
        activeModule={activeModule}
        onModuleChange={setActiveModule}
      />
      <TabBar module={activeModule} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
