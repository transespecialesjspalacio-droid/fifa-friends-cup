"use client";

import { useState, useActionState, type ChangeEvent } from "react";
import { Badge } from "@/components/admin/ui";
import { ScoreRow } from "@/components/matches/ScoreRow";
import { Button } from "@/components/ui/Button";
import { saveMatchResultAction, type MatchResultActionState } from "@/lib/actions/matches";
import type { MatchWithSlots } from "@/lib/services/matches";
import { matchTitle, pairDisplayLabel, stageLabel, STAGE_ORDER } from "@/lib/services/stage";
import { MatchStage, MatchStatus } from "@/prisma/generated/prisma/enums";

function numberInput(
  name: string,
  label: string,
  value: string,
  onChange: (event: ChangeEvent<HTMLInputElement>) => void,
  required: boolean,
) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type="number"
        name={name}
        inputMode="numeric"
        min={0}
        step={1}
        required={required}
        value={value}
        onChange={onChange}
        className="h-10 rounded-lg border border-surface/50 bg-surface px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/40 focus:border-primary"
      />
    </label>
  );
}

function penaltyNumberInput(
  key: string,
  name: string,
  label: string,
  defaultValue: string,
) {
  return (
    <label key={key} className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type="number"
        name={name}
        inputMode="numeric"
        min={0}
        step={1}
        defaultValue={defaultValue}
        className="h-10 rounded-lg border border-surface/50 bg-surface px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/40 focus:border-primary"
      />
    </label>
  );
}

function MatchResultCard({ match, index }: { match: MatchWithSlots; index: number }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<MatchResultActionState, FormData>(
    saveMatchResultAction,
    {},
  );

  const finished = match.status === MatchStatus.COMPLETED;
  const title = matchTitle(match.stage, index);
  const isPenaltyStage =
    match.stage === MatchStage.SEMIFINAL || match.stage === MatchStage.FINAL;

  const [homeGoalsValue, setHomeGoalsValue] = useState(
    finished ? String(match.homeGoals) : "",
  );
  const [awayGoalsValue, setAwayGoalsValue] = useState(
    finished ? String(match.awayGoals) : "",
  );

  const goalsTied =
    homeGoalsValue !== "" &&
    awayGoalsValue !== "" &&
    Number(homeGoalsValue) === Number(awayGoalsValue);
  const showPenalties = isPenaltyStage && goalsTied;

  return (
    <div className="rounded-xl border border-surface/50 bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        {match.groupName ? (
          <Badge variant="primary">Grupo {match.groupName}</Badge>
        ) : (
          <Badge variant="primary">{stageLabel(match.stage)}</Badge>
        )}
        <span className="text-sm font-medium text-foreground">{title}</span>
        {finished ? (
          <Badge variant="success">Finalizado</Badge>
        ) : (
          <Badge variant="warning">Pendiente</Badge>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <ScoreRow
          className="flex-1 text-sm"
          homeSubLabel="Pareja local"
          awaySubLabel="Pareja visitante"
          homeLabel={match.home ? pairDisplayLabel(match.home) : "Por definir"}
          awayLabel={match.away ? pairDisplayLabel(match.away) : "Por definir"}
          finished={finished}
          homeGoals={match.homeGoals}
          awayGoals={match.awayGoals}
          penaltiesHomeGoals={match.penaltiesHomeGoals}
          penaltiesAwayGoals={match.penaltiesAwayGoals}
        />

        <div className="flex gap-2">
          <Button
            type="button"
            variant={finished ? "ghost" : "primary"}
            size="sm"
            onClick={() => setOpen((value) => !value)}
          >
            {finished ? "Editar resultado" : "Registrar resultado"}
          </Button>
        </div>
      </div>

      {open && (
        <form action={formAction} className="mt-3 rounded-lg border border-surface/50 bg-surface-secondary p-4">
          <input type="hidden" name="matchId" value={match.id} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {numberInput(
              "homeGoals",
              match.home ? `Goles · ${pairDisplayLabel(match.home)}` : "Goles local",
              homeGoalsValue,
              (event) => setHomeGoalsValue(event.target.value),
              true,
            )}
            {numberInput(
              "awayGoals",
              match.away ? `Goles · ${pairDisplayLabel(match.away)}` : "Goles visitante",
              awayGoalsValue,
              (event) => setAwayGoalsValue(event.target.value),
              true,
            )}
            {showPenalties && (
              <>
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-foreground">Penales</p>
                  <p className="text-xs text-muted/60">
                    El partido está empatado en goles; ingresá el resultado de la tanda.
                  </p>
                </div>
                {penaltyNumberInput(
                  `ph-${homeGoalsValue}-${awayGoalsValue}`,
                  "penaltiesHomeGoals",
                  match.home ? `Equipo A · ${pairDisplayLabel(match.home)}` : "Equipo A",
                  finished && match.penaltiesHomeGoals !== null
                    ? String(match.penaltiesHomeGoals)
                    : "",
                )}
                {penaltyNumberInput(
                  `pa-${homeGoalsValue}-${awayGoalsValue}`,
                  "penaltiesAwayGoals",
                  match.away ? `Equipo B · ${pairDisplayLabel(match.away)}` : "Equipo B",
                  finished && match.penaltiesAwayGoals !== null
                    ? String(match.penaltiesAwayGoals)
                    : "",
                )}
              </>
            )}
          </div>
          {state.error && (
            <p className="mt-3 text-sm text-error">{state.error}</p>
          )}
          <div className="mt-3 flex justify-end gap-2">
            <Button type="button" variant="default" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar resultado"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export function MatchResultManager({ matches }: { matches: MatchWithSlots[] }) {
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
              {staged.map((match, index) => (
                <MatchResultCard key={match.id} match={match} index={index} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}