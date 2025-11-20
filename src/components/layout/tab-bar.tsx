"use client";

import { X } from "lucide-react";
import { Tab, ModuleType } from "@/types";
import { useTabsStore } from "@/stores/tabs-store";
import { cn } from "@/lib/utils";

interface TabBarProps {
  module: ModuleType;
}

export function TabBar({ module }: TabBarProps) {
  const { tabs, activeTabId, setActiveTab, removeTab } = useTabsStore();

  // Filter tabs for current module
  const moduleTabs = tabs.filter((tab) => tab.module === module);

  if (moduleTabs.length === 0) {
    return null;
  }

  return (
    <div className="flex h-10 items-center gap-1 border-b border-gray-200 bg-gray-50 px-2">
      {moduleTabs.map((tab) => {
        const isActive = tab.id === activeTabId;

        return (
          <div
            key={tab.id}
            className={cn(
              "group flex items-center gap-1 rounded-t-md border border-b-0 px-3 py-1.5 text-sm transition-colors",
              isActive
                ? "border-gray-200 bg-white text-gray-900"
                : "border-transparent bg-transparent text-gray-600 hover:bg-gray-100"
            )}
          >
            <button
              onClick={() => setActiveTab(tab.id)}
              className="max-w-[150px] truncate"
            >
              {tab.title}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTab(tab.id);
              }}
              className={cn(
                "ml-1 rounded p-0.5 transition-colors",
                isActive
                  ? "hover:bg-gray-100"
                  : "opacity-0 hover:bg-gray-200 group-hover:opacity-100"
              )}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
