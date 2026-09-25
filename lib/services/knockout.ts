import { db } from "@/lib/db";
import { ok, type ServiceResult } from "@/lib/services/result";
import {
  listMatches,
  nextPendingMatch,
  type MatchSlotPair,
  type MatchWithSlots,
} from "@/lib/services/matches";
import { listPairs } from "@/lib/services/pairs";
import { getStandings, type GroupStandings } from "@/lib/services/standings";
import { loserOf, winnerOf } from "@/lib/services/resolution";
import {
  MatchSlotType,
  MatchStage,
  MatchStatus,
  SlotPosition,
  TournamentStatus,
} from "@/prisma/generated/prisma/enums";

export interface Podium {
  champion: MatchSlotPair | null;
  runnerUp: MatchSlotPair | null;
  third: MatchSlotPair | null;
}

export type Phase = "groups" | "knockout" | "finished";

export function phaseOf(matches: MatchWithSlots[]): Phase {
  const final = matches.find((match) => match.stage === MatchStage.FINAL);
  if (final && final.status === MatchStatus.COMPLETED) return "finished";
  if (matches.some((match) => match.stage !== MatchStage.GROUP)) return "knockout";
  return "groups";
}

function firstPosition(group: GroupStandings): string | null {
  return group.rows[0]?.pairId ?? null;
}

function secondPosition(group: GroupStandings): string | null {
  return group.rows[1]?.pairId ?? null;
}

async function createSemifinals(
  tournamentId: string,
  groupA: GroupStandings,
  groupB: GroupStandings,
): Promise<boolean> {
  if (groupA.groupId === null || groupB.groupId === null) return false;
  if (!firstPosition(groupA) || !firstPosition(groupB) || !secondPosition(groupA) || !secondPosition(groupB)) {
    return false;
  }

  await db.$transaction(async (tx) => {
    const existing = await tx.match.findFirst({
      where: { tournamentId, stage: MatchStage.SEMIFINAL },
      select: { id: true },
    });
    if (existing) return;

    await tx.match.create({
      data: {
        tournamentId,
        stage: MatchStage.SEMIFINAL,
        status: MatchStatus.SCHEDULED,
        slots: {
          create: [
            {
              position: SlotPosition.HOME,
              type: MatchSlotType.GROUP_POSITION,
              sourceGroupId: groupA.groupId,
              sourcePosition: 1,
            },
            {
              position: SlotPosition.AWAY,
              type: MatchSlotType.GROUP_POSITION,
              sourceGroupId: groupB.groupId,
              sourcePosition: 2,
            },
          ],
        },
      },
    });

    await tx.match.create({
      data: {
        tournamentId,
        stage: MatchStage.SEMIFINAL,
        status: MatchStatus.SCHEDULED,
        slots: {
          create: [
            {
              position: SlotPosition.HOME,
              type: MatchSlotType.GROUP_POSITION,
              sourceGroupId: groupB.groupId,
              sourcePosition: 1,
            },
            {
              position: SlotPosition.AWAY,
              type: MatchSlotType.GROUP_POSITION,
              sourceGroupId: groupA.groupId,
              sourcePosition: 2,
            },
          ],
        },
      },
    });

    await tx.tournament.update({
      where: { id: tournamentId },
      data: { status: TournamentStatus.KNOCKOUT },
    });
  });

  return true;
}

async function createDecider(
  tournamentId: string,
  stage: MatchStage,
  homeSourceMatchId: string,
  homeType: MatchSlotType,
  awaySourceMatchId: string,
  awayType: MatchSlotType,
): Promise<void> {
  await db.match.create({
    data: {
      tournamentId,
      stage,
      status: MatchStatus.SCHEDULED,
      slots: {
        create: [
          { position: SlotPosition.HOME, type: homeType, sourceMatchId: homeSourceMatchId },
          { position: SlotPosition.AWAY, type: awayType, sourceMatchId: awaySourceMatchId },
        ],
      },
    },
  });
}

export async function ensureKnockoutStage(): Promise<ServiceResult<boolean>> {
  const tournament = await db.tournament.findFirst({
    select: { id: true, status: true },
  });
  if (!tournament) return ok(false);

  const [pairsResult, matchesResult, standingsResult] = await Promise.all([
    listPairs(),
    listMatches(),
    getStandings(),
  ]);
  if (!pairsResult.ok || !matchesResult.ok || !standingsResult.ok) return ok(false);

  const groupMatches = matchesResult.data.filter((match) => match.stage === MatchStage.GROUP);
  if (
    groupMatches.length === 0 ||
    !groupMatches.every((match) => match.status === MatchStatus.COMPLETED)
  ) {
    return ok(false);
  }

  const standingGroups = standingsResult.data
    .filter((group) => group.groupId !== null)
    .sort((a, b) => a.groupName.localeCompare(b.groupName));
  if (standingGroups.length !== 2) return ok(false);

  const [groupA, groupB] = standingGroups;
  const madeProgress = await createSemifinals(tournament.id, groupA, groupB);

  const semifinals = await db.match.findMany({
    where: { tournamentId: tournament.id, stage: MatchStage.SEMIFINAL },
    select: {
      id: true,
      status: true,
      slots: {
        select: { position: true, type: true, sourceGroupId: true, sourcePosition: true },
      },
    },
  });

  if (semifinals.length === 2 && semifinals.every((sf) => sf.status === MatchStatus.COMPLETED)) {
    const sf1 = semifinals.find((sf) => {
      const home = sf.slots.find((slot) => slot.position === SlotPosition.HOME);
      return (
        home?.type === MatchSlotType.GROUP_POSITION &&
        home.sourceGroupId === groupA.groupId &&
        home.sourcePosition === 1
      );
    });
    const sf2 = semifinals.find((sf) => sf !== sf1) ?? null;

    if (sf1 && sf2) {
      const finalExists = await db.match.findFirst({
        where: { tournamentId: tournament.id, stage: MatchStage.FINAL },
        select: { id: true },
      });
      if (!finalExists) {
        await createDecider(
          tournament.id,
          MatchStage.FINAL,
          sf1.id,
          MatchSlotType.WINNER,
          sf2.id,
          MatchSlotType.WINNER,
        );
      }

      const thirdExists = await db.match.findFirst({
        where: { tournamentId: tournament.id, stage: MatchStage.THIRD_PLACE },
        select: { id: true },
      });
      if (!thirdExists) {
        await createDecider(
          tournament.id,
          MatchStage.THIRD_PLACE,
          sf1.id,
          MatchSlotType.LOSER,
          sf2.id,
          MatchSlotType.LOSER,
        );
      }
    }
  }

  const finalMatch = await db.match.findFirst({
    where: { tournamentId: tournament.id, stage: MatchStage.FINAL },
    select: { id: true, status: true },
  });
  if (finalMatch && finalMatch.status === MatchStatus.COMPLETED) {
    await db.tournament.update({
      where: { id: tournament.id },
      data: { status: TournamentStatus.FINISHED },
    });
  }

  return ok(madeProgress);
}

export async function getPodiumInfo(): Promise<Podium> {
  const matchesResult = await listMatches();
  if (!matchesResult.ok) return { champion: null, runnerUp: null, third: null };

  const matches = matchesResult.data;
  const finalMatch = matches.find(
    (match) => match.stage === MatchStage.FINAL && match.status === MatchStatus.COMPLETED,
  );
  const thirdMatch = matches.find(
    (match) => match.stage === MatchStage.THIRD_PLACE && match.status === MatchStatus.COMPLETED,
  );

  return {
    champion: finalMatch
      ? winnerOf(
          finalMatch.home,
          finalMatch.away,
          finalMatch.homeGoals,
          finalMatch.awayGoals,
          finalMatch.status,
          finalMatch.penaltiesHomeGoals,
          finalMatch.penaltiesAwayGoals,
        )
      : null,
    runnerUp: finalMatch
      ? loserOf(
          finalMatch.home,
          finalMatch.away,
          finalMatch.homeGoals,
          finalMatch.awayGoals,
          finalMatch.status,
          finalMatch.penaltiesHomeGoals,
          finalMatch.penaltiesAwayGoals,
        )
      : null,
    third: thirdMatch
      ? winnerOf(
          thirdMatch.home,
          thirdMatch.away,
          thirdMatch.homeGoals,
          thirdMatch.awayGoals,
          thirdMatch.status,
          thirdMatch.penaltiesHomeGoals,
          thirdMatch.penaltiesAwayGoals,
        )
      : null,
  };
}

export async function getLastCompletedMatches(): Promise<MatchWithSlots[]> {
  const result = await listMatches();
  if (!result.ok) return [];
  return result.data
    .filter((match) => match.status === MatchStatus.COMPLETED && match.home && match.away)
    .sort((a, b) => (b.playedAt ?? "").localeCompare(a.playedAt ?? ""))
    .slice(0, 3);
}

export async function getNextPendingMatch(): Promise<MatchWithSlots | null> {
  const result = await listMatches();
  if (!result.ok) return null;
  return nextPendingMatch(result.data);
}