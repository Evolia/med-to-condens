"use client";

import { create } from "zustand";
import { ModuleType } from "@/types";

interface AppModuleState {
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
}

export const useAppModule = create<AppModuleState>((set) => ({
  activeModule: ModuleType.DOSSIERS,
  setActiveModule: (module) => set({ activeModule: module }),
}));
