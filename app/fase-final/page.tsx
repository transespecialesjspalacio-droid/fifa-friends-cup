import { Badge, EmptyState } from "@/components/admin/ui";
import PublicLayout from "@/components/layout/PublicLayout";
import { MatchesList } from "@/components/matches/MatchesList";
import { getPodiumInfo } from "@/lib/services/knockout";
import { listMatches } from "@/lib/services/matches";
import { pairDisplayLabel } from "@/lib/services/stage";
import { MatchStage } from "@/prisma/generated/prisma/enums";

export const dynamic = "force-dynamic";

function podiumCard(title: string, label: string | null, highlight = false) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight ? "border-primary/40 bg-primary/10" : "border-surface/50 bg-surface"
      }`}
    >
      <h3 className={`text-sm font-medium uppercase tracking-wider ${highlight ? "text-primary" : "text-muted"}`}>
        {title}
      </h3>
      <p className="mt-1 text-base font-bold text-foreground">{label ?? "Por definir"}</p>
    </div>
  );
}

export default async function FaseFinalPage() {
  const [matchesResult, podium] = await Promise.all([listMatches(), getPodiumInfo()]);
  const knockout = matchesResult.ok
    ? matchesResult.data.filter((match) => match.stage !== MatchStage.GROUP)
    : [];

  return (
    <PublicLayout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">Fase Final</h1>
        <p className="mt-1 text-sm text-muted">
          Semifinales, tercer puesto, final y campeón.
        </p>
      </div>

      {!matchesResult.ok ? (
        <EmptyState
          icon="!"
          title="No se pudo cargar la fase final"
          description={matchesResult.error}
        />
      ) : knockout.length === 0 ? (
        <EmptyState
          icon="~"
          title="Fase final pendiente"
          description="Se activa automáticamente cuando se completan los 6 partidos de la fase de grupos."
        />
      ) : (
        <div className="flex flex-col gap-6">
          <MatchesList matches={knockout} />

          <section>
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted">
              Podio
            </h3>
            {podium.champion ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {podiumCard(
                  "Campeón",
                  podium.champion ? pairDisplayLabel(podium.champion) : null,
                  true,
                )}
                {podiumCard(
                  "Subcampeón",
                  podium.runnerUp ? pairDisplayLabel(podium.runnerUp) : null,
                )}
                {podiumCard(
                  "Tercer puesto",
                  podium.third ? pairDisplayLabel(podium.third) : null,
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="warning">En curso</Badge>
                <p className="text-sm text-muted/60">
                  El podio se define al finalizar la final.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </PublicLayout>
  );
}