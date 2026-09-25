"use client";

import { useEffect, useState } from "react";
import type { DrawnMatch, DrawResult } from "@/lib/services/draw-run";
import type { DrawableParticipant, DrawableTeam } from "@/lib/services/draw";
import { DrawStage } from "@/components/draw/DrawStage";
import { PairRevealCard } from "@/components/draw/PairRevealCard";
import { TeamRevealCard } from "@/components/draw/TeamRevealCard";

interface DrawResultsProps {
  result: DrawResult;
  animated: boolean;
}

type StageName = "pairs" | "teams" | "groups" | "fixture";

const STAGES: StageName[] = ["pairs", "teams", "groups", "fixture"];

const FIRST_REVEAL_MS = 600;
const REVEAL_STEP_MS = 700;
const STAGE_PAUSE_MS = 900;

function personLabel(name: string, nickname: string | null): string {
  return nickname ? `${name} (${nickname})` : name;
}

function pairLabel(
  participant1: DrawableParticipant,
  participant2: DrawableParticipant,
): string {
  return `${personLabel(participant1.name, participant1.nickname)} y ${personLabel(
    participant2.name,
    participant2.nickname,
  )}`;
}

interface TeamStepView {
  order: number;
  pair: { order: number; participant1: DrawableParticipant; participant2: DrawableParticipant };
  team: DrawableTeam;
}

function buildTeamSteps(result: DrawResult): TeamStepView[] {
  return result.pairs.map((drawPair) => ({
    order: drawPair.order,
    pair: {
      order: drawPair.order,
      participant1: drawPair.participant1,
      participant2: drawPair.participant2,
    },
    team: drawPair.team,
  }));
}

function StageHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {number}
      </span>
      <h2 className="text-lg font-semibold uppercase tracking-wide text-foreground">{title}</h2>
    </div>
  );
}

function PairsRevealSection({
  result,
  revealedCount,
}: {
  result: DrawResult;
  revealedCount: number;
}) {
  return (
    <section className="flex flex-col gap-3">
      <StageHeader number="1" title="Sorteo de parejas" />
      <DrawStage
        steps={result.pairs}
        revealedCount={revealedCount}
        emptyMessage="No hay parejas para mostrar."
        renderStep={(step, revealed) => (
          <PairRevealCard
            order={step.order}
            participant1={step.participant1}
            participant2={step.participant2}
            revealed={revealed}
          />
        )}
      />
    </section>
  );
}

function TeamsRevealSection({
  result,
  revealedCount,
}: {
  result: DrawResult;
  revealedCount: number;
}) {
  const teamSteps = buildTeamSteps(result);
  return (
    <section className="flex flex-col gap-3">
      <StageHeader number="2" title="Sorteo de equipos" />
      <DrawStage
        steps={teamSteps}
        revealedCount={revealedCount}
        emptyMessage="No hay equipos para mostrar."
        renderStep={(step, revealed) => (
          <TeamRevealCard pair={step.pair} team={step.team} revealed={revealed} />
        )}
      />
    </section>
  );
}

function GroupsSection({ result }: { result: DrawResult }) {
  return (
    <section className="flex flex-col gap-3">
      <StageHeader number="3" title="Distribucion de grupos" />
      <div className="grid gap-4 sm:grid-cols-2">
        {result.groups.map((group) => (
          <div
            key={group.name}
            className="rounded-2xl border border-surface/50 bg-surface p-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground">Grupo {group.name}</h3>
              <span className="text-xs text-muted">{group.pairOrders.length} parejas</span>
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {[...group.pairOrders]
                .sort((a, b) => a - b)
                .map((order) => {
                  const drawPair = result.pairs.find((pair) => pair.order === order);
                  if (!drawPair) return null;
                  return (
                    <li key={order} className="text-sm text-foreground">
                      {pairLabel(drawPair.participant1, drawPair.participant2)}
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function FixtureSection({ result }: { result: DrawResult }) {
  const byGroup = new Map<string, DrawnMatch[]>();
  for (const nextMatch of result.matches) {
    byGroup.set(nextMatch.groupName, [
      ...(byGroup.get(nextMatch.groupName) ?? []),
      nextMatch,
    ]);
  }
  const orderedMatches = [...result.matches].sort((a, b) => {
    const roundDiff =
      (byGroup.get(a.groupName)?.indexOf(a) ?? 0) -
      (byGroup.get(b.groupName)?.indexOf(b) ?? 0);
    if (roundDiff !== 0) return roundDiff;
    return a.groupName.localeCompare(b.groupName);
  });
  return (
    <section className="flex flex-col gap-3">
      <StageHeader number="4" title="Fixture generado" />
      <div className="flex flex-col gap-2">
        {orderedMatches.map((nextMatch) => {
          const home = result.pairs.find((pair) => pair.order === nextMatch.homeOrder);
          const away = result.pairs.find((pair) => pair.order === nextMatch.awayOrder);
          const round = (byGroup.get(nextMatch.groupName)?.indexOf(nextMatch) ?? 0) + 1;
          return (
            <div
              key={nextMatch.order}
              className="flex flex-col gap-1 rounded-xl border border-surface/50 bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-primary">
                  Partido {round}
                </span>
                <span className="text-xs text-muted">Grupo {nextMatch.groupName}</span>
              </div>
              <span className="text-sm font-medium text-foreground">
                {home && away
                  ? `${pairLabel(home.participant1, home.participant2)} vs ${pairLabel(
                      away.participant1,
                      away.participant2,
                    )}`
                  : "-"}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function DrawResults({ result, animated }: DrawResultsProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const totalPairs = result.pairs.length;

  useEffect(() => {
    if (!animated || stageIndex >= STAGES.length) return;

    if (stageIndex >= 2) {
      const timer = setTimeout(() => setStageIndex((index) => index + 1), STAGE_PAUSE_MS);
      return () => clearTimeout(timer);
    }

    const isFirstReveal = revealed === 0;
    const timer = setTimeout(() => {
      if (revealed < totalPairs) {
        setRevealed((count) => count + 1);
      } else {
        setRevealed(0);
        setStageIndex((index) => index + 1);
      }
    }, isFirstReveal ? FIRST_REVEAL_MS : REVEAL_STEP_MS);
    return () => clearTimeout(timer);
  }, [animated, stageIndex, revealed, totalPairs]);

  if (!animated) {
    return (
      <div className="flex flex-col gap-8">
        <PairsRevealSection result={result} revealedCount={totalPairs} />
        <TeamsRevealSection result={result} revealedCount={totalPairs} />
        <GroupsSection result={result} />
        <FixtureSection result={result} />
      </div>
    );
  }

  const currentStage = STAGES[Math.min(stageIndex, STAGES.length - 1)];

  return (
    <div className="flex flex-col gap-8">
      {currentStage === "pairs" && <PairsRevealSection result={result} revealedCount={revealed} />}
      {currentStage === "teams" && <TeamsRevealSection result={result} revealedCount={revealed} />}
      {currentStage === "groups" && <GroupsSection result={result} />}
      {currentStage === "fixture" && <FixtureSection result={result} />}
    </div>
  );
}