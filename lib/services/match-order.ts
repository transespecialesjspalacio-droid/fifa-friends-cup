import {
  MatchStage,
  MatchStatus,
} from "@/prisma/generated/prisma/enums";
import type { MatchWithSlots } from "@/lib/services/matches";

/** Ordena los partidos de grupos intercalados por ronda: A1, B1, A2, B2, A3, B3. */
export function orderGroupMatches(matches: MatchWithSlots[]): MatchWithSlots[] {
  const byGroup = new Map<string, MatchWithSlots[]>();
  for (const match of matches) {
    if (match.stage !== MatchStage.GROUP || !match.groupName) continue;
    const key = match.groupName;
    byGroup.set(key, [...(byGroup.get(key) ?? []), match]);
  }
  const round = new Map<string, number>();
  for (const members of byGroup.values()) {
    members.forEach((member, index) => round.set(member.id, index + 1));
  }
  const groupMatches = matches.filter(
    (match) => match.stage === MatchStage.GROUP && match.groupName,
  );
  const others = matches.filter(
    (match) => match.stage !== MatchStage.GROUP || !match.groupName,
  );
  const sorted = [...groupMatches].sort((a, b) => {
    const roundDiff = (round.get(a.id) ?? 0) - (round.get(b.id) ?? 0);
    if (roundDiff !== 0) return roundDiff;
    return (a.groupName ?? "").localeCompare(b.groupName ?? "");
  });
  return [...sorted, ...others];
}

/** Devuelve el primer partido pendiente respetando el orden de fixtures (A1, B1, A2, B2, A3, B3). */
export function nextPendingMatch(matches: MatchWithSlots[]): MatchWithSlots | null {
  return matches.find((match) => match.status !== MatchStatus.COMPLETED) ?? null;
}