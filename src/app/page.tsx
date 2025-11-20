"use client";

import { AppLayout } from "@/components/layout";
import { useAppModule } from "@/components/layout/use-app-module";
import { DossiersModule } from "@/components/modules/dossiers";
import { ObservationsModule } from "@/components/modules/observations";
import { TodosModule } from "@/components/modules/todos";
import { ModuleType } from "@/types";

function ModuleContent() {
  const { activeModule } = useAppModule();

  switch (activeModule) {
    case ModuleType.DOSSIERS:
      return <DossiersModule />;
    case ModuleType.OBSERVATIONS:
      return <ObservationsModule />;
    case ModuleType.TODOS:
      return <TodosModule />;
    default:
      return <DossiersModule />;
  }
}

export default function Home() {
  return (
    <AppLayout>
      <ModuleContent />
    </AppLayout>
  );
}
