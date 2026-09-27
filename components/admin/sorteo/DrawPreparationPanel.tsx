"use client";

import { useMemo, useState } from "react";
import type { DrawnGroup, DrawnMatch, DrawnPair, DrawResult } from "@/lib/services/draw-run";
import type { PairWithRelations } from "@/lib/services/pairs";
import type { MatchWithSlots } from "@/lib/services/matches";
import { TournamentStatus } from "@/prisma/generated/prisma/enums";
import { Badge } from "@/components/admin/ui";
import TournamentActionsPanel from "@/components/admin/actions/TournamentActionsPanel";
import DrawResults from "@/components/admin/sorteo/DrawResults";

interface DrawPreparationPanelProps {
  participantCount: number;
  teamCount: number;
  pairCount: number;
  tournamentStatus: TournamentStatus | null;
  drawRunCount: number;
  persistedPairs: PairWithRelations[];
  persistedMatches: MatchWithSlots[];
  initialError?: string;
}

interface CheckItem {
  done: boolean;
  label: string;
}

function buildPersistedResult(
  pairs: PairWithRelations[],
  matches: MatchWithSlots[],
): DrawResult | null {
  if (pairs.length === 0) return null;

  const ordered = [...pairs].sort((a, b) => {
    const groupA = a.group?.name ?? "";
    const groupB = b.group?.name ?? "";
    return groupA.localeCompare(groupB) || a.id.localeCompare(b.id);
  });

  const orderById = new Map<string, number>();
  ordered.forEach((pair, index) => orderById.set(pair.id, index + 1));

  const drawnPairs: DrawnPair[] = ordered.map((pair, index) => ({
    id: pair.id,
    order: index + 1,
    participant1: {
      id: pair.participant1.id,
      name: pair.participant1.name,
      nickname: pair.participant1.nickname,
    },
    participant2: {
      id: pair.participant2.id,
      name: pair.participant2.name,
      nickname: pair.participant2.nickname,
    },
    team: pair.team
      ? {
          id: pair.team.id,
          name: pair.team.name,
          shortName: pair.team.shortName,
          logo: pair.team.logo,
        }
      : { id: "", name: "Sin equipo", shortName: null, logo: null },
    groupName: pair.group?.name ?? "A",
  }));

  const groupNames = ordered
    .map((pair) => pair.group?.name)
    .filter((name): name is string => name !== undefined && name !== null)
    .filter((name, index, all) => all.indexOf(name) === index)
    .sort();

  const groups: DrawnGroup[] = groupNames.map((name) => ({
    name,
    pairOrders: ordered
      .filter((pairItem) => pairItem.group?.name === name)
      .map((pairItem) => orderById.get(pairItem.id) as number)
      .sort((x, y) => x - y),
  }));

  const drawnMatches: DrawnMatch[] = matches.map((match, index) => ({
    order: index + 1,
    groupName: match.groupName ?? "-",
    homeOrder: match.home ? (orderById.get(match.home.pairId) ?? 0) : 0,
    awayOrder: match.away ? (orderById.get(match.away.pairId) ?? 0) : 0,
  }));

  return {
    tournamentId: "",
    tournamentName: "",
    pairs: drawnPairs,
    groups,
    matches: drawnMatches,
  };
}

export default function DrawPreparationPanel({
  participantCount,
  teamCount,
  tournamentStatus,
  drawRunCount,
  persistedPairs,
  persistedMatches,
  initialError,
}: DrawPreparationPanelProps) {
  const [freshResult, setFreshResult] = useState<DrawResult | null>(null);

  const persistedResult = useMemo(
    () => buildPersistedResult(persistedPairs, persistedMatches),
    [persistedPairs, persistedMatches],
  );

  const displayedResult = freshResult ?? persistedResult;

  const checks: CheckItem[] = [
    {
      done: participantCount === 12,
      label: `12 participantes registrados (hay ${participantCount})`,
    },
    {
      done: teamCount === 6,
      label: `6 equipos registrados (hay ${teamCount})`,
    },
    {
      done: tournamentStatus === TournamentStatus.SETUP,
      label: "Torneo en estado SETUP (requerido para un nuevo sorteo)",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {initialError && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-2 text-sm text-error">
          {initialError}
        </div>
      )}

      {displayedResult ? (
        <div className="flex flex-col gap-6">
          {!freshResult && (
            <div className="flex items-center gap-2">
              <Badge variant="success">Sorteo realizado</Badge>
            </div>
          )}
          <DrawResults result={displayedResult} animated={freshResult !== null} />
        </div>
      ) : (
        <section className="rounded-2xl border border-surface/50 bg-surface p-6">
          <h2 className="text-lg font-medium text-foreground">Requisitos previos</h2>
          <p className="mt-1 text-sm text-muted">
            Antes de ejecutar el sorteo se valida que el torneo esté listo. La
            operación es atómica: parejas, equipos, grupos y fixture se guardan juntos.
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
                <span className={check.done ? "text-foreground" : "text-muted"}>
                  {check.label}
                </span>
              </li>
            ))}
          </ul>

          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-surface/50 bg-surface p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
                Fase 1: Parejas
              </h3>
              <p className="mt-2 text-sm text-muted">
                Los 12 participantes se agrupan aleatoriamente en 6 parejas.
              </p>
            </div>
            <div className="rounded-2xl border border-surface/50 bg-surface p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
                Fase 2: Equipos
              </h3>
              <p className="mt-2 text-sm text-muted">
                Cada pareja recibe uno de los 6 equipos registrados.
              </p>
            </div>
            <div className="rounded-2xl border border-surface/50 bg-surface p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
                Fase 3: Grupos
              </h3>
              <p className="mt-2 text-sm text-muted">
                Las parejas se distribuyen en 2 grupos de 3 parejas.
              </p>
            </div>
            <div className="rounded-2xl border border-surface/50 bg-surface p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
                Fixture
              </h3>
              <p className="mt-2 text-sm text-muted">
                Se generan 6 partidos de fase de grupos (3 por grupo).
              </p>
            </div>
          </section>
        </section>
      )}

      <TournamentActionsPanel
        tournamentStatus={tournamentStatus}
        drawRunCount={drawRunCount}
        onNewDrawComplete={setFreshResult}
      />
    </div>
  );
}