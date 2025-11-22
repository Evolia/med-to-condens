import { create } from "zustand";
import { ModuleType } from "@/types";

interface QuickCreateState {
  triggerModule: ModuleType | null;
  trigger: (module: ModuleType) => void;
  clear: () => void;
}

export const useQuickCreateStore = create<QuickCreateState>((set) => ({
  triggerModule: null,
  trigger: (module) => set({ triggerModule: module }),
  clear: () => set({ triggerModule: null }),
}));
