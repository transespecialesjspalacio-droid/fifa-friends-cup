import { getAdminSummary } from "@/lib/services/summary";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/admin/ui";
import ResetTournamentPanel from "@/components/admin/reset/ResetTournamentPanel";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const summaryResult = await getAdminSummary();

  if (!summaryResult.ok) {
    return (
      <EmptyState
        icon="!"
        title="No se pudo cargar el resumen"
        description={summaryResult.error}
      />
    );
  }

  const { participantCount, teamCount, pairCount, groupCount } = summaryResult.data;

  const checks = [
    {
      done: participantCount === 12,
      label: `12 participantes registrados (hay ${participantCount})`,
    },
    {
      done: teamCount >= 6,
      label: `Al menos 6 equipos registrados (hay ${teamCount})`,
    },
    {
      done: pairCount === 0,
      label: "Sin parejas previas (el sorteo las genera)",
    },
    {
      done: groupCount === 0,
      label: "Sin grupos previos (se generan en el sorteo)",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resumen</h1>
        <p className="mt-1 text-sm text-muted">
          Estado actual del torneo desde el panel administrativo.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Participantes"
          value={participantCount}
          subtitle="Objetivo: 12"
          variant={participantCount === 12 ? "success" : "warning"}
        />
        <StatCard
          title="Equipos"
          value={teamCount}
          subtitle="Mínimo: 6"
          variant={teamCount >= 6 ? "success" : "warning"}
        />
        <StatCard
          title="Parejas"
          value={pairCount}
          subtitle="Se generan en el sorteo"
        />
        <StatCard
          title="Grupos"
          value={groupCount}
          subtitle="Objetivo: 2"
        />
      </section>

      <section className="rounded-2xl border border-surface/50 bg-surface p-6">
        <h2 className="text-lg font-medium text-foreground">Preparación del sorteo</h2>
        <p className="mt-1 text-sm text-muted">
          Se habilita cuando se cumplen todos los requisitos. Consulta el panel de
          Sorteo al terminar de registrar.
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {checks.map((check) => (
            <li key={check.label} className="flex items-center gap-2 text-sm">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                  check.done
                    ? "border-success/50 bg-success/10 text-success"
                    : "border-surface/50 bg-surface-secondary text-muted"
                }`}
              >
                {check.done ? "v" : ""}
              </span>
              <span className={check.done ? "text-foreground" : "text-muted"}>{check.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <ResetTournamentPanel />
    </div>
  );
}