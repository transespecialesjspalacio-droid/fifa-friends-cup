import { MatchStage } from "@/prisma/generated/prisma/enums";

export function pairDisplayLabel(pair: {
  participant1: { name: string };
  participant2: { name: string };
  teamName: string | null;
}): string {
  const names = `${pair.participant1.name} + ${pair.participant2.name}`;
  return pair.teamName ? `${names} (${pair.teamName})` : names;
}

export const STAGE_ORDER = [
  MatchStage.GROUP,
  MatchStage.SEMIFINAL,
  MatchStage.THIRD_PLACE,
  MatchStage.FINAL,
] as const;

const STAGE_LABELS: Record<string, string> = {
  [MatchStage.GROUP]: "Fase de Grupos",
  [MatchStage.SEMIFINAL]: "Semifinales",
  [MatchStage.THIRD_PLACE]: "Tercer puesto",
  [MatchStage.FINAL]: "Final",
};

export function stageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? stage;
}

export function matchTitle(stage: string, index: number): string {
  const number = index + 1;
  switch (stage) {
    case MatchStage.GROUP:
      return `Partido ${number}`;
    case MatchStage.SEMIFINAL:
      return `Semifinal ${number}`;
    case MatchStage.FINAL:
      return "Final";
    case MatchStage.THIRD_PLACE:
      return "Tercer puesto";
    default:
      return stage;
  }
}