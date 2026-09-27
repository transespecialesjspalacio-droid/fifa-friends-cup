import HomeEntry from "@/components/dashboard/HomeEntry";
import { type WelcomeStatus } from "@/components/dashboard/WelcomeHero";
import PublicLayout from "@/components/layout/PublicLayout";
import { NextMatchCard } from "@/components/ui/NextMatchCard";
import { TournamentSummaryCard } from "@/components/ui/TournamentSummaryCard";
import {
  getLastCompletedMatches,
  getNextPendingMatch,
  getPodiumInfo,
  phaseOf,
} from "@/lib/services/knockout";
import { listMatches, type MatchWithSlots } from "@/lib/services/matches";
import { getStandings, type GroupStandings } from "@/lib/services/standings";
import { getAdminSummary } from "@/lib/services/summary";
import { matchTitle, pairDisplayLabel, stageLabel } from "@/lib/services/stage";
import { MatchStage, MatchStatus } from "@/prisma/generated/prisma/enums";
import { ScoreRow } from "@/components/matches/ScoreRow";
import { ChampionPoster } from "@/components/champion/ChampionPoster";

function ResultRow({ match }: { match: MatchWithSlots }) {
  const left = match.home ? pairDisplayLabel(match.home) : "Por definir";
  const right = match.away ? pairDisplayLabel(match.away) : "Por definir";
  return (
    <div className="rounded-xl border border-surface/50 bg-surface px-3 py-2 text-sm">
      <ScoreRow
        homeLabel={left}
        awayLabel={right}
        finished
        homeGoals={match.homeGoals}
        awayGoals={match.awayGoals}
        penaltiesHomeGoals={match.penaltiesHomeGoals}
        penaltiesAwayGoals={match.penaltiesAwayGoals}
        caption={stageLabel(match.stage)}
      />
    </div>
  );
}

function PodiumCard({
  title,
  label,
  highlight,
}: {
  title: string;
  label: string | null;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight ? "border-primary/40 bg-primary/10" : "border-surface/50 bg-surface"
      }`}
    >
      <p className={`text-[11px] uppercase tracking-wider ${highlight ? "text-primary" : "text-muted"}`}>
        {title}
      </p>
      <p className="mt-0.5 text-sm font-bold text-foreground">{label ?? "Por definir"}</p>
    </div>
  );
}

function CompactStandings({ standings }: { standings: GroupStandings[] }) {
  if (standings.length === 0) {
    return (
      <p className="text-sm text-muted/60">
        La clasificación aparece cuando haya resultados jugados.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {standings.map((group) => (
        <div key={group.groupId ?? group.groupName} className="rounded-xl border border-surface/50 bg-surface p-3">
          <p className="mb-2 text-[11px] uppercase tracking-wider text-primary">
            Grupo {group.groupName}
          </p>
          <div className="flex flex-col gap-1">
            {group.rows.map((row) => (
              <div
                key={row.pairId}
                className={`flex items-center gap-2 text-sm ${
                  row.position <= 2 ? "text-foreground font-medium" : "text-muted"
                }`}
              >
                <span
                  className={`w-4 text-center font-bold tabular-nums ${
                    row.position <= 2 ? "text-primary" : "text-muted"
                  }`}
                >
                  {row.position}
                </span>
                <span className="flex-1 truncate">
                  {row.label}
                  {row.teamName ? ` (${row.teamName})` : ""}
                </span>
                <span
                  className={`shrink-0 tabular-nums ${row.dg > 0 ? "text-success" : row.dg < 0 ? "text-error" : "text-muted"}`}
                >
                  {row.dg > 0 ? `+${row.dg}` : row.dg}
                </span>
                <span className="w-6 shrink-0 text-right font-bold tabular-nums text-primary">
                  {row.pts}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function KnockoutPreview({ matches }: { matches: MatchWithSlots[] }) {
  if (matches.length === 0) {
    return (
      <p className="text-sm text-muted/60">
        Preparando brackets: se activan al completar los 6 partidos de la fase de grupos.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {matches.map((match) => {
        const index = matches.filter(
          (item) => item.stage === match.stage && item.id < match.id,
        ).length;
        const finished = match.status === MatchStatus.COMPLETED;
        return (
          <div
            key={match.id}
            className="rounded-xl border border-surface/50 bg-surface p-3 text-sm"
          >
            <p className="mb-1 text-[11px] uppercase tracking-wider text-primary">
              {matchTitle(match.stage, index)}
            </p>
            <ScoreRow
              homeLabel={match.home ? pairDisplayLabel(match.home) : "Por definir"}
              awayLabel={match.away ? pairDisplayLabel(match.away) : "Por definir"}
              finished={finished}
              homeGoals={match.homeGoals}
              awayGoals={match.awayGoals}
              penaltiesHomeGoals={match.penaltiesHomeGoals}
              penaltiesAwayGoals={match.penaltiesAwayGoals}
            />
          </div>
        );
      })}
    </div>
  );
}

export default async function Dashboard() {
  const [summaryResult, matchesResult, standingsResult, podium, nextMatch, recent] =
    await Promise.all([
      getAdminSummary(),
      listMatches(),
      getStandings(),
      getPodiumInfo(),
      getNextPendingMatch(),
      getLastCompletedMatches(),
    ]);

  const summary = summaryResult.ok ? summaryResult.data : null;
  const matches = matchesResult.ok ? matchesResult.data : [];
  const standings = standingsResult.ok ? standingsResult.data : [];
  const phase = phaseOf(matches);
  const pendingCount = matches.filter((match) => match.status !== MatchStatus.COMPLETED).length;
  const knockoutMatches = matches.filter((match) => match.stage !== MatchStage.GROUP);
  const finishedCount = matches.length - pendingCount;
  const welcomeStatus: WelcomeStatus =
    phase === "finished"
      ? "finalizado"
      : phase === "knockout"
        ? "fase-final"
        : matches.length === 0
          ? "por-iniciar"
          : "en-curso";

  return (
    <HomeEntry
      status={welcomeStatus}
      participantCount={summary?.participantCount ?? 0}
      pairCount={summary?.pairCount ?? 0}
      groupCount={summary?.groupCount ?? 0}
    >
      <PublicLayout>
        <div className="flex-1 w-full">
          {podium.champion && (
            <ChampionPoster
              className="mb-5"
              pairName={`${podium.champion.participant1.name} + ${podium.champion.participant2.name}`}
              teamName={podium.champion.teamName}
            />
          )}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <TournamentSummaryCard
            title="Participantes"
            count={summary?.participantCount ?? 0}
            label="Total de jugadores inscritos"
          />
          <TournamentSummaryCard
            title="Parejas"
            count={summary?.pairCount ?? 0}
            label="Formadas en el sorteo"
          />
          <TournamentSummaryCard
            title="Grupos"
            count={summary?.groupCount ?? 0}
            label="Grupos definidos"
          />
          <TournamentSummaryCard
            title="Partidos pendientes"
            count={pendingCount}
            label={
              pendingCount === 0
                ? finishedCount > 0
                  ? "Todas las fases completadas"
                  : "Sin partidos generados"
                : "Por jugar"
            }
            variant={pendingCount === 0 ? "success" : "warning"}
          />
        </section>

        {nextMatch ? (
          <NextMatchCard
            className="mb-3"
            label={stageLabel(nextMatch.stage)}
            home={nextMatch.home ? pairDisplayLabel(nextMatch.home) : null}
            away={nextMatch.away ? pairDisplayLabel(nextMatch.away) : null}
            note="Pendiente de jugar"
          />
        ) : (
          <NextMatchCard className="mb-3" label="El torneo aún no ha comenzado" note="Sin partidos programados" />
        )}

        <section className="mb-3">
          <h2 className="text-lg font-medium text-foreground mb-2 flex items-center gap-2">
            <span className="icon-text">★</span>
            Clasificación
            <span className="text-muted/60 text-xs uppercase tracking-wider">
              PJ = jugados, DG = diferencia, PTS = puntos
            </span>
          </h2>
          <CompactStandings standings={standings} />
        </section>

        {podium.champion ? (
          <section className="mb-3">
            <h2 className="text-lg font-medium text-foreground mb-2 flex items-center gap-2">
              <span className="icon-text">🏆</span>
              Campeón
            </h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <PodiumCard title="Campeón" label={pairDisplayLabel(podium.champion)} highlight />
              <PodiumCard
                title="Subcampeón"
                label={podium.runnerUp ? pairDisplayLabel(podium.runnerUp) : null}
              />
              <PodiumCard title="Tercer puesto" label={podium.third ? pairDisplayLabel(podium.third) : null} />
            </div>
          </section>
        ) : (
          <section className="mb-3">
            <h2 className="text-lg font-medium text-foreground mb-2 flex items-center gap-2">
              <span className="icon-text">★</span>
              Fase Final
              <span className="text-muted/60 text-xs uppercase tracking-wider">
                {phase === "groups" ? "Pendiente de activación" : "En curso"}
              </span>
            </h2>
            <KnockoutPreview matches={knockoutMatches} />
          </section>
        )}

        {recent.length > 0 && (
          <section className="mb-3">
            <h2 className="text-lg font-medium text-foreground mb-2 flex items-center gap-2">
              <span className="icon-text">★</span>
              Resultados recientes
            </h2>
            <div className="flex flex-col gap-2">
              {recent.map((match) => (
                <ResultRow key={match.id} match={match} />
              ))}
            </div>
          </section>
        )}
        </div>
      </PublicLayout>
    </HomeEntry>
  );
}