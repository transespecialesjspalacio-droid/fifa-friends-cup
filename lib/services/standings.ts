import { db } from "@/lib/db";
import { mapDbError } from "@/lib/services/db-errors";
import { ok, type ServiceResult } from "@/lib/services/result";
import {
  computeStandings,
  type GroupStandings,
  type StandingsInputMatch,
  type StandingsInputPair,
} from "@/lib/services/standings-core";
import { MatchSlotType, SlotPosition } from "@/prisma/generated/prisma/enums";

export {
  computeStandings,
  type GroupStandings,
  type StandingRow,
  type StandingsInputMatch,
  type StandingsInputPair,
} from "@/lib/services/standings-core";

export async function getStandings(): Promise<ServiceResult<GroupStandings[]>> {
  try {
    const [pairs, matches] = await Promise.all([
      db.pair.findMany({
        select: {
          id: true,
          participant1: { select: { name: true } },
          participant2: { select: { name: true } },
          team: { select: { name: true, shortName: true } },
          group: { select: { id: true, name: true } },
        },
      }),
      db.match.findMany({
        select: {
          id: true,
          stage: true,
          status: true,
          homeGoals: true,
          awayGoals: true,
          slots: {
            select: {
              position: true,
              type: true,
              directPair: { select: { id: true } },
            },
          },
        },
      }),
    ]);

    const inputPairs: StandingsInputPair[] = pairs.map((pair) => ({
      id: pair.id,
      groupId: pair.group?.id ?? null,
      groupName: pair.group?.name ?? null,
      label: `${pair.participant1.name} + ${pair.participant2.name}`,
      teamName: pair.team ? (pair.team.shortName ?? pair.team.name) : null,
    }));

    const inputMatches: StandingsInputMatch[] = matches.map((match) => {
      const slotFor = (position: string) =>
        match.slots.find(
          (slot) =>
            slot.position === position && slot.type === MatchSlotType.GROUP_DIRECT,
        );
      return {
        id: match.id,
        stage: match.stage,
        status: match.status,
        homePairId: slotFor(SlotPosition.HOME)?.directPair?.id ?? null,
        homeGoals: match.homeGoals,
        awayPairId: slotFor(SlotPosition.AWAY)?.directPair?.id ?? null,
        awayGoals: match.awayGoals,
      };
    });

    return ok(computeStandings(inputPairs, inputMatches));
  } catch (error) {
    return mapDbError(error, "No se pudo calcular la clasificación.");
  }
}