"use client";

import { ReactNode, useState, useEffect } from "react";
import { useAppModule } from "./use-app-module";
import { GlobalSearch } from "./global-search";
import { DesktopLayout } from "./desktop-layout";
import { MobileLayout } from "./mobile-layout";
import { useDevice } from "@/hooks/use-device";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { activeModule, setActiveModule } = useAppModule();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const deviceType = useDevice();

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

  const layoutProps = {
    activeModule,
    onModuleChange: setActiveModule,
    onSearchClick: () => setIsSearchOpen(true),
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
