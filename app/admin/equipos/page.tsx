import TeamsManager from "@/components/admin/teams/TeamsManager";
import { listTeamsWithUsage } from "@/lib/services/teams";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  const result = await listTeamsWithUsage();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Equipos</h1>
        <p className="mt-1 text-sm text-muted">
          Gestiona los equipos del torneo. Cada pareja recibe un equipo al sortear.
        </p>
      </div>
      <TeamsManager
        teams={result.ok ? result.data : []}
        initialError={result.ok ? undefined : result.error}
      />
    </div>
  );
}