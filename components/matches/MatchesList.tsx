import { Badge } from "@/components/admin/ui";
import { ScoreRow } from "@/components/matches/ScoreRow";
import type { MatchWithSlots } from "@/lib/services/matches";
import { pairDisplayLabel, stageLabel, STAGE_ORDER } from "@/lib/services/stage";
import { MatchStatus } from "@/prisma/generated/prisma/enums";

function MatchRow({ match }: { match: MatchWithSlots }) {
  const finished = match.status === MatchStatus.COMPLETED;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-surface/50 bg-surface px-4 py-3 sm:flex-row sm:items-center">
      <div className="shrink-0">
        {match.groupName ? (
          <Badge variant="primary">Grupo {match.groupName}</Badge>
        ) : (
          <Badge variant="default">Eliminación directa</Badge>
        )}
      </div>
      <ScoreRow
        className="flex-1"
        homeLabel={match.home ? pairDisplayLabel(match.home) : "Por definir"}
        awayLabel={match.away ? pairDisplayLabel(match.away) : "Por definir"}
        finished={finished}
        homeGoals={match.homeGoals}
        awayGoals={match.awayGoals}
        penaltiesHomeGoals={match.penaltiesHomeGoals}
        penaltiesAwayGoals={match.penaltiesAwayGoals}
      />
      {finished ? (
        <Badge variant="success">Finalizado</Badge>
      ) : (
        <Badge variant="warning">Pendiente</Badge>
      )}
    </div>
  );
}

export function MatchesList({ matches }: { matches: MatchWithSlots[] }) {
  if (matches.length === 0) {
    return (
      <p className="text-sm text-muted/60">
        Aún no hay partidos registrados.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {STAGE_ORDER.map((stage) => {
        const staged = matches.filter((match) => match.stage === stage);
        if (staged.length === 0) return null;
        return (
          <section key={stage}>
            <h3 className="mb-2 text-sm font-medium uppercase tracking-wider text-muted">
              {stageLabel(stage)}
            </h3>
            <div className="flex flex-col gap-2">
              {staged.map((match) => (
                <MatchRow key={match.id} match={match} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}