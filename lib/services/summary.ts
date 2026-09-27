import { db } from "@/lib/db";
import { mapDbError } from "@/lib/services/db-errors";
import { ok, type ServiceResult } from "@/lib/services/result";
import { TournamentStatus } from "@/prisma/generated/prisma/enums";

export interface AdminSummaryData {
  participantCount: number;
  teamCount: number;
  pairCount: number;
  groupCount: number;
  status: TournamentStatus | null;
  drawRunCount: number;
}

export async function getAdminSummary(): Promise<ServiceResult<AdminSummaryData>> {
  try {
    const [participantCount, teamCount, pairCount, groupCount, tournament] = await Promise.all([
      db.participant.count(),
      db.team.count(),
      db.pair.count(),
      db.group.count(),
      db.tournament.findFirst({ orderBy: { createdAt: "asc" } }),
    ]);
    return ok({
      participantCount,
      teamCount,
      pairCount,
      groupCount,
      status: tournament?.status ?? null,
      drawRunCount: tournament?.drawRunCount ?? 0,
    });
  } catch (error) {
    return mapDbError(error, "No se pudo obtener el resumen administrativo.");
  }
}