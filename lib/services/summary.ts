import { db } from "@/lib/db";
import { mapDbError } from "@/lib/services/db-errors";
import { ok, type ServiceResult } from "@/lib/services/result";

export interface AdminSummaryData {
  participantCount: number;
  teamCount: number;
  pairCount: number;
  groupCount: number;
}

export async function getAdminSummary(): Promise<ServiceResult<AdminSummaryData>> {
  try {
    const [participantCount, teamCount, pairCount, groupCount] = await Promise.all([
      db.participant.count(),
      db.team.count(),
      db.pair.count(),
      db.group.count(),
    ]);
    return ok({ participantCount, teamCount, pairCount, groupCount });
  } catch (error) {
    return mapDbError(error, "No se pudo obtener el resumen administrativo.");
  }
}