import { EmptyState } from "@/components/admin/ui";
import PublicLayout from "@/components/layout/PublicLayout";
import { MatchesList } from "@/components/matches/MatchesList";
import { PairGrid } from "@/components/pairs/PairGrid";
import { StandingsTable } from "@/components/standings/StandingsTable";
import TorneoTabs, { type TorneoPanel } from "@/components/torneo/TorneoTabs";
import { listPairs, type PairWithRelations } from "@/lib/services/pairs";
import { listMatches } from "@/lib/services/matches";
import { getStandings } from "@/lib/services/standings";

export const dynamic = "force-dynamic";

function groupPairs(pairs: PairWithRelations[]) {
  const byGroup = new Map<string, PairWithRelations[]>();
  for (const pair of pairs) {
    const key = pair.group?.name ?? "Sin grupo";
    byGroup.set(key, [...(byGroup.get(key) ?? []), pair]);
  }
  return [...byGroup.entries()].sort(([a], [b]) => {
    if (a === "Sin grupo") return 1;
    if (b === "Sin grupo") return -1;
    return a.localeCompare(b);
  });
}

function GroupsPanel({ pairs }: { pairs: PairWithRelations[] }) {
  const groups = groupPairs(pairs);

  if (groups.length === 0) {
    return (
      <EmptyState
        icon="?"
        title="Sin grupos"
        description="Los grupos se generan al ejecutar el sorteo."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {groups.map(([name, groupPairs]) => (
        <div key={name} className="rounded-2xl border border-surface/50 bg-surface p-4">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-primary">
            Grupo {name}
          </h3>
          <ul className="flex flex-col gap-2">
            {groupPairs.map((pair) => (
              <li
                key={pair.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="font-medium text-foreground">
                  {pair.participant1.name} + {pair.participant2.name}
                </span>
                <span className="text-primary">
                  {pair.team?.shortName ?? pair.team?.name ?? "Sin equipo"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default async function TorneoPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const [pairsResult, matchesResult, standingsResult] = await Promise.all([
    listPairs(),
    listMatches(),
    getStandings(),
  ]);

  const panels: TorneoPanel[] = [
    {
      id: "parejas",
      label: "Parejas",
      content: !pairsResult.ok ? (
        <EmptyState
          icon="!"
          title="No se pudieron cargar las parejas"
          description={pairsResult.error}
        />
      ) : pairsResult.data.length === 0 ? (
        <EmptyState
          icon="?"
          title="Aún no hay parejas"
          description="Las parejas se forman durante el sorteo."
        />
      ) : (
        <PairGrid pairs={pairsResult.data} />
      ),
    },
    {
      id: "grupos",
      label: "Grupos",
      content: <GroupsPanel pairs={pairsResult.ok ? pairsResult.data : []} />,
    },
    {
      id: "partidos",
      label: "Partidos",
      content: !matchesResult.ok ? (
        <EmptyState
          icon="!"
          title="No se pudieron cargar los partidos"
          description={matchesResult.error}
        />
      ) : (
        <MatchesList matches={matchesResult.data} />
      ),
    },
    {
      id: "resultados",
      label: "Resultados",
      content: !matchesResult.ok ? (
        <EmptyState
          icon="!"
          title="No se pudieron cargar los resultados"
          description={matchesResult.error}
        />
      ) : matchesResult.data.length === 0 ? (
        <EmptyState
          icon="?"
          title="Sin resultados todavía"
          description="Los marcadores aparecen aquí a medida que se juegan los partidos."
        />
      ) : (
        <MatchesList matches={matchesResult.data} />
      ),
    },
    {
      id: "clasificacion",
      label: "Clasificación",
      content: !standingsResult.ok ? (
        <EmptyState
          icon="!"
          title="No se pudo calcular la clasificación"
          description={standingsResult.error}
        />
      ) : standingsResult.data.length === 0 ? (
        <EmptyState
          icon="?"
          title="Sin clasificación todavía"
          description="Se calcula automáticamente a partir de los resultados de la fase de grupos."
        />
      ) : (
        <StandingsTable standings={standingsResult.data} />
      ),
    },
  ];

  return (
    <PublicLayout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">Torneo</h1>
        <p className="mt-1 text-sm text-muted">
          Consulta toda la información del torneo FIFA Friends Cup.
        </p>
      </div>
      <TorneoTabs panels={panels} initialTabId={tab === "resultados" ? "resultados" : undefined} />
    </PublicLayout>
  );
}