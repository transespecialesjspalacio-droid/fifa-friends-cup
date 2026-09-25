import { db } from "@/lib/db";
import { fail, ok, type ServiceResult } from "@/lib/services/result";
import { validateResultOutcome } from "@/lib/services/results-core";
import { MatchStatus } from "@/prisma/generated/prisma/enums";

export interface SaveMatchResultOutput {
  tournamentId: string;
  matchId: string;
}

export async function saveMatchResult(
  matchId: string,
  homeGoals: number,
  awayGoals: number,
  penaltiesHomeGoals: number | null = null,
  penaltiesAwayGoals: number | null = null,
): Promise<ServiceResult<SaveMatchResultOutput>> {
  const match = await db.match.findUnique({
    where: { id: matchId },
    select: { id: true, stage: true, tournamentId: true },
  });
  if (!match) {
    return fail("Partido no encontrado.");
  }

  const validation = validateResultOutcome({
    stage: match.stage,
    homeGoals,
    awayGoals,
    penaltiesHomeGoals,
    penaltiesAwayGoals,
  });
  if (!validation.ok) return validation;

  const usesPenalties = validation.data.usesPenalties;

  await db.match.update({
    where: { id: matchId },
    data: {
      homeGoals,
      awayGoals,
      penaltiesHomeGoals: usesPenalties ? penaltiesHomeGoals : null,
      penaltiesAwayGoals: usesPenalties ? penaltiesAwayGoals : null,
      status: MatchStatus.COMPLETED,
      playedAt: new Date(),
    },
  });

  return ok({ tournamentId: match.tournamentId, matchId });
}