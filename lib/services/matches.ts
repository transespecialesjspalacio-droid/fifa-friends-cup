import { db } from "@/lib/db";
import { mapDbError } from "@/lib/services/db-errors";
import { ok, type ServiceResult } from "@/lib/services/result";
import { orderGroupMatches } from "@/lib/services/match-order";
export { nextPendingMatch, orderGroupMatches } from "@/lib/services/match-order";
import {
  computeStandings,
  type GroupStandings,
  type StandingsInputMatch,
  type StandingsInputPair,
} from "@/lib/services/standings";
import { loserOf, winnerOf } from "@/lib/services/resolution";
import {
  MatchSlotType,
  SlotPosition,
} from "@/prisma/generated/prisma/enums";

export interface MatchParticipant {
  id: string;
  name: string;
  nickname: string | null;
}

export interface MatchSlotPair {
  pairId: string;
  participant1: MatchParticipant;
  participant2: MatchParticipant;
  teamName: string | null;
}

export interface MatchWithSlots {
  id: string;
  groupId: string | null;
  groupName: string | null;
  stage: string;
  status: string;
  homeGoals: number;
  awayGoals: number;
  penaltiesHomeGoals: number | null;
  penaltiesAwayGoals: number | null;
  playedAt: string | null;
  home: MatchSlotPair | null;
  away: MatchSlotPair | null;
}

interface PairRow {
  id: string;
  participant1: MatchParticipant;
  participant2: MatchParticipant;
  team: { name: string; shortName: string | null } | null;
  group: { id: string; name: string } | null;
}

interface RawSlot {
  position: string;
  type: string;
  directPair: {
    id: string;
    participant1: MatchParticipant;
    participant2: MatchParticipant;
    team: { name: string; shortName: string | null } | null;
  } | null;
  sourceGroupId: string | null;
  sourcePosition: number | null;
  sourceMatchId: string | null;
}

interface RawMatch {
  id: string;
  group: { id: string; name: string } | null;
  stage: string;
  status: string;
  homeGoals: number;
  awayGoals: number;
  penaltiesHomeGoals: number | null;
  penaltiesAwayGoals: number | null;
  playedAt: Date | null;
  slots: RawSlot[];
}

function pairToSlotPair(pair: PairRow): MatchSlotPair {
  return {
    pairId: pair.id,
    participant1: pair.participant1,
    participant2: pair.participant2,
    teamName: pair.team ? (pair.team.shortName ?? pair.team.name) : null,
  };
}

function directSlotToPair(slot: RawSlot): MatchSlotPair | null {
  if (!slot.directPair) return null;
  return {
    pairId: slot.directPair.id,
    participant1: slot.directPair.participant1,
    participant2: slot.directPair.participant2,
    teamName: slot.directPair.team
      ? (slot.directPair.team.shortName ?? slot.directPair.team.name)
      : null,
  };
}

function pairByStanding(
  slot: RawSlot,
  standings: GroupStandings[],
  pairById: Map<string, PairRow>,
): MatchSlotPair | null {
  if (!slot.sourceGroupId || slot.sourcePosition == null) return null;
  const group = standings.find((item) => item.groupId === slot.sourceGroupId);
  const row = group?.rows[slot.sourcePosition - 1];
  if (!row) return null;
  const pair = pairById.get(row.pairId);
  return pair ? pairToSlotPair(pair) : null;
}

function sourceSide(
  slot: RawSlot,
  source: MatchWithSlots | undefined,
): MatchSlotPair | null {
  if (!source) return null;
  if (slot.type === MatchSlotType.WINNER) {
    return winnerOf(
      source.home,
      source.away,
      source.homeGoals,
      source.awayGoals,
      source.status,
      source.penaltiesHomeGoals,
      source.penaltiesAwayGoals,
    );
  }
  return loserOf(
    source.home,
    source.away,
    source.homeGoals,
    source.awayGoals,
    source.status,
    source.penaltiesHomeGoals,
    source.penaltiesAwayGoals,
  );
}

function buildMatch(row: RawMatch, home: MatchSlotPair | null, away: MatchSlotPair | null): MatchWithSlots {
  return {
    id: row.id,
    groupId: row.group?.id ?? null,
    groupName: row.group?.name ?? null,
    stage: row.stage,
    status: row.status,
    homeGoals: row.homeGoals,
    awayGoals: row.awayGoals,
    penaltiesHomeGoals: row.penaltiesHomeGoals,
    penaltiesAwayGoals: row.penaltiesAwayGoals,
    playedAt: row.playedAt ? row.playedAt.toISOString() : null,
    home,
    away,
  };
}

export async function listMatches(): Promise<ServiceResult<MatchWithSlots[]>> {
  try {
    const [pairs, rows] = await Promise.all([
      db.pair.findMany({
        select: {
          id: true,
          participant1: { select: { id: true, name: true, nickname: true } },
          participant2: { select: { id: true, name: true, nickname: true } },
          team: { select: { name: true, shortName: true } },
          group: { select: { id: true, name: true } },
        },
      }),
      db.match.findMany({
        orderBy: [{ stage: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          stage: true,
          status: true,
          homeGoals: true,
          awayGoals: true,
          penaltiesHomeGoals: true,
          penaltiesAwayGoals: true,
          playedAt: true,
          group: { select: { id: true, name: true } },
          slots: {
            orderBy: { position: "asc" },
            select: {
              position: true,
              type: true,
              directPair: {
                select: {
                  id: true,
                  participant1: { select: { id: true, name: true, nickname: true } },
                  participant2: { select: { id: true, name: true, nickname: true } },
                  team: { select: { name: true, shortName: true } },
                },
              },
              sourceGroupId: true,
              sourcePosition: true,
              sourceMatchId: true,
            },
          },
        },
      }),
    ]);

    const pairById = new Map<string, PairRow>(pairs.map((pair) => [pair.id, pair]));

    const inputPairs: StandingsInputPair[] = pairs.map((pair) => ({
      id: pair.id,
      groupId: pair.group?.id ?? null,
      groupName: pair.group?.name ?? null,
      label: `${pair.participant1.name} + ${pair.participant2.name}`,
      teamName: pair.team ? (pair.team.shortName ?? pair.team.name) : null,
    }));

    const inputMatches: StandingsInputMatch[] = rows.map((row) => {
      const slotFor = (position: string) =>
        row.slots.find(
          (slot) =>
            slot.position === position && slot.type === MatchSlotType.GROUP_DIRECT,
        );
      return {
        id: row.id,
        stage: row.stage,
        status: row.status,
        homePairId: slotFor(SlotPosition.HOME)?.directPair?.id ?? null,
        homeGoals: row.homeGoals,
        awayPairId: slotFor(SlotPosition.AWAY)?.directPair?.id ?? null,
        awayGoals: row.awayGoals,
      };
    });

    const standings = computeStandings(inputPairs, inputMatches);

    const resolved = new Map<string, MatchWithSlots>();
    const remaining = new Set<string>(rows.map((row) => row.id));

    const alreadyResolvable = (row: RawMatch): boolean =>
      row.slots.every((slot) => slot.type !== MatchSlotType.WINNER && slot.type !== MatchSlotType.LOSER);

    for (const row of rows) {
      if (!alreadyResolvable(row)) continue;
      const homeSlot = row.slots.find((slot) => slot.position === SlotPosition.HOME);
      const awaySlot = row.slots.find((slot) => slot.position === SlotPosition.AWAY);
      const home =
        homeSlot?.type === MatchSlotType.GROUP_DIRECT
          ? directSlotToPair(homeSlot)
          : pairByStanding(homeSlot as RawSlot, standings, pairById);
      const away =
        awaySlot?.type === MatchSlotType.GROUP_DIRECT
          ? directSlotToPair(awaySlot)
          : pairByStanding(awaySlot as RawSlot, standings, pairById);
      resolved.set(row.id, buildMatch(row, home, away));
      remaining.delete(row.id);
    }

    let progressed = true;
    while (progressed) {
      progressed = false;
      for (const row of rows) {
        if (!remaining.has(row.id)) continue;
        const homeSlot = row.slots.find((slot) => slot.position === SlotPosition.HOME);
        const awaySlot = row.slots.find((slot) => slot.position === SlotPosition.AWAY);
        const homeSource = homeSlot?.sourceMatchId ? resolved.get(homeSlot.sourceMatchId) : undefined;
        const awaySource = awaySlot?.sourceMatchId ? resolved.get(awaySlot.sourceMatchId) : undefined;
        if (!homeSlot || !awaySlot) continue;
        if ((homeSlot.sourceMatchId && !homeSource) || (awaySlot.sourceMatchId && !awaySource)) continue;
        const home = homeSlot.sourceMatchId ? sourceSide(homeSlot, homeSource) : null;
        const away = awaySlot.sourceMatchId ? sourceSide(awaySlot, awaySource) : null;
        resolved.set(row.id, buildMatch(row, home, away));
        remaining.delete(row.id);
        progressed = true;
      }
    }

    return ok(
      orderGroupMatches(
        rows.map((row) => resolved.get(row.id) as MatchWithSlots).filter(Boolean),
      ),
    );
  } catch (error) {
    return mapDbError(error, "No se pudieron listar los partidos.");
  }
}