"use client";

import { FolderOpen, ClipboardList, CheckSquare, LogOut, Search, Plus } from "lucide-react";
import { ModuleType } from "@/types";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface MainNavigationProps {
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
  onSearchClick?: () => void;
  onQuickCreate?: (module: ModuleType) => void;
}

const modules = [
  {
    id: ModuleType.DOSSIERS,
    label: "Dossiers",
    icon: FolderOpen,
  },
  {
    id: ModuleType.OBSERVATIONS,
    label: "Observations",
    icon: ClipboardList,
  },
  {
    id: ModuleType.TODOS,
    label: "To-do",
    icon: CheckSquare,
  },
];

export function MainNavigation({
  activeModule,
  onModuleChange,
  onSearchClick,
  onQuickCreate,
}: MainNavigationProps) {
  const router = useRouter();
  const supabase = createBrowserClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
      <div className="flex items-center gap-1">
        {onSearchClick && (
          <button
            onClick={onSearchClick}
            className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:border-gray-400"
            title="Recherche globale (Ctrl+K)"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Rechercher...</span>
            <span className="hidden sm:inline text-xs text-gray-400 ml-2">⌘K</span>
          </button>
        )}
        {modules.map((module) => {
          const Icon = module.icon;
          const isActive = activeModule === module.id;

          return (
            <div key={module.id} className="flex items-center gap-0.5">
              <button
                onClick={() => onModuleChange(module.id)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {module.label}
              </button>
              {isActive && onQuickCreate && (
                <button
                  onClick={() => onQuickCreate(module.id)}
                  className="flex items-center justify-center w-6 h-6 rounded-md text-blue-700 hover:bg-blue-100 transition-colors"
                  title={`Créer ${
                    module.id === ModuleType.DOSSIERS
                      ? "un nouveau dossier"
                      : module.id === ModuleType.OBSERVATIONS
                      ? "une nouvelle observation"
                      : "une nouvelle tâche"
                  }`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        <LogOut className="h-4 w-4" />
        Déconnexion
      </button>
    </nav>
  );
}
