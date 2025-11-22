import { create } from "zustand";
import { ModuleType } from "@/types";

interface QuickCreateState {
  triggerModule: ModuleType | null;
  data: { patientId?: string } | null;
  trigger: (module: ModuleType, data?: { patientId?: string }) => void;
  clear: () => void;
}

export const useQuickCreateStore = create<QuickCreateState>((set) => ({
  triggerModule: null,
  data: null,
  trigger: (module, data) => set({ triggerModule: module, data: data || null }),
  clear: () => set({ triggerModule: null, data: null }),
}));
