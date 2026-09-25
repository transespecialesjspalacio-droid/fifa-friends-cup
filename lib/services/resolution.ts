import type { MatchSlotPair } from "@/lib/services/matches";
import { MatchStatus } from "@/prisma/generated/prisma/enums";

export function winnerOf(
  home: MatchSlotPair | null,
  away: MatchSlotPair | null,
  homeGoals: number,
  awayGoals: number,
  status: string,
  penaltiesHomeGoals: number | null = null,
  penaltiesAwayGoals: number | null = null,
): MatchSlotPair | null {
  if (!home || !away || status !== MatchStatus.COMPLETED) return null;
  if (homeGoals !== awayGoals) return homeGoals > awayGoals ? home : away;
  if (penaltiesHomeGoals === null || penaltiesAwayGoals === null || penaltiesHomeGoals === penaltiesAwayGoals) {
    return null;
  }
  return penaltiesHomeGoals > penaltiesAwayGoals ? home : away;
}

export function loserOf(
  home: MatchSlotPair | null,
  away: MatchSlotPair | null,
  homeGoals: number,
  awayGoals: number,
  status: string,
  penaltiesHomeGoals: number | null = null,
  penaltiesAwayGoals: number | null = null,
): MatchSlotPair | null {
  if (!home || !away || status !== MatchStatus.COMPLETED) return null;
  if (homeGoals !== awayGoals) return homeGoals > awayGoals ? away : home;
  if (penaltiesHomeGoals === null || penaltiesAwayGoals === null || penaltiesHomeGoals === penaltiesAwayGoals) {
    return null;
  }
  return penaltiesHomeGoals > penaltiesAwayGoals ? away : home;
}