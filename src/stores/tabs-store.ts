import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { Tab, ModuleType } from "@/types";

interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;

  // Actions
  addTab: (tab: Tab) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (tabId: string) => void;
  getTabsByModule: (module: ModuleType) => Tab[];
}

export const useTabsStore = create<TabsState>()(
  devtools(
    persist(
      (set, get) => ({
        tabs: [],
        activeTabId: null,

        addTab: (tab) => {
          const existingTab = get().tabs.find(
            (t) =>
              t.type === tab.type &&
              t.module === tab.module &&
              JSON.stringify(t.data) === JSON.stringify(tab.data)
          );

          if (existingTab) {
            set({ activeTabId: existingTab.id });
          } else {
            set((state) => ({
              tabs: [...state.tabs, tab],
              activeTabId: tab.id,
            }));
          }
        },

        removeTab: (tabId) => {
          set((state) => {
            const newTabs = state.tabs.filter((t) => t.id !== tabId);
            let newActiveTabId = state.activeTabId;

            if (state.activeTabId === tabId) {
              const index = state.tabs.findIndex((t) => t.id === tabId);
              if (newTabs.length > 0) {
                newActiveTabId =
                  newTabs[Math.min(index, newTabs.length - 1)]?.id || null;
              } else {
                newActiveTabId = null;
              }
            }

            return {
              tabs: newTabs,
              activeTabId: newActiveTabId,
            };
          });
        },

        setActiveTab: (tabId) => {
          set({ activeTabId: tabId });
        },

        updateTab: (tabId, updates) => {
          set((state) => ({
            tabs: state.tabs.map((tab) =>
              tab.id === tabId ? { ...tab, ...updates } : tab
            ),
          }));
        },

        closeAllTabs: () => {
          set({ tabs: [], activeTabId: null });
        },

        closeOtherTabs: (tabId) => {
          set((state) => ({
            tabs: state.tabs.filter((t) => t.id === tabId),
            activeTabId: tabId,
          }));
        },

        getTabsByModule: (module) => {
          return get().tabs.filter((t) => t.module === module);
        },
      }),
      {
        name: "tabs-storage",
        partialize: (state) => ({
          tabs: state.tabs,
          activeTabId: state.activeTabId,
        }),
      }
    )
  )
);
