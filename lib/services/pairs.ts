import { db } from "@/lib/db";
import { mapDbError } from "@/lib/services/db-errors";
import { ok, type ServiceResult } from "@/lib/services/result";

export interface PairWithRelations {
  id: string;
  participant1: { id: string; name: string; nickname: string | null };
  participant2: { id: string; name: string; nickname: string | null };
  team: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;
  } | null;
  group: { id: string; name: string } | null;
}

export async function listPairs(): Promise<ServiceResult<PairWithRelations[]>> {
  try {
    const pairs = await db.pair.findMany({
      orderBy: { id: "asc" },
      include: {
        participant1: { select: { id: true, name: true, nickname: true } },
        participant2: { select: { id: true, name: true, nickname: true } },
        team: { select: { id: true, name: true, shortName: true, logo: true } },
        group: { select: { id: true, name: true } },
      },
    });
    return ok(pairs);
  } catch (error) {
    return mapDbError(error, "No se pudieron listar las parejas.");
  }
}