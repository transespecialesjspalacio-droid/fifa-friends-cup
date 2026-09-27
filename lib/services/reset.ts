import { TournamentStatus } from "@/prisma/generated/prisma/enums";
import { mapDbError } from "@/lib/services/db-errors";
import { ok, type ServiceResult } from "@/lib/services/result";

export interface ResetCounts {
  deletedSlots: number;
  deletedMatches: number;
  deletedPairs: number;
  deletedGroups: number;
}

export interface ResetResult extends ResetCounts {
  tournamentId: string | null;
}

export interface ResetTx {
  matchSlot: {
    deleteMany(args: { where: { match: { tournamentId: string } } }): Promise<{ count: number }>;
  };
  match: {
    deleteMany(args: { where: { tournamentId: string } }): Promise<{ count: number }>;
  };
  pair: {
    deleteMany(args: { where: { tournamentId: string } }): Promise<{ count: number }>;
  };
  group: {
    deleteMany(args: { where: { tournamentId: string } }): Promise<{ count: number }>;
  };
  tournament: {
    findFirst(args: { orderBy: { createdAt: "asc" } }): Promise<{ id: string } | null>;
    update(args: {
      where: { id: string };
      data: { status: TournamentStatus; drawRunCount: number };
    }): Promise<{ id: string }>;
  };
}

export interface ResetDeps {
  db: {
    $transaction<T>(fn: (tx: ResetTx) => Promise<T>): Promise<T>;
  };
  authorize: () => Promise<void>;
}

export async function resetTournament(deps: ResetDeps): Promise<ServiceResult<ResetResult>> {
  await deps.authorize();

  try {
    const result = await deps.db.$transaction(async (tx) => {
      const tournament = await tx.tournament.findFirst({ orderBy: { createdAt: "asc" } });
      if (!tournament) {
        return {
          tournamentId: null,
          deletedSlots: 0,
          deletedMatches: 0,
          deletedPairs: 0,
          deletedGroups: 0,
        } satisfies ResetResult;
      }

      const deletedSlots = await tx.matchSlot.deleteMany({
        where: { match: { tournamentId: tournament.id } },
      });
      const deletedMatches = await tx.match.deleteMany({
        where: { tournamentId: tournament.id },
      });
      const deletedPairs = await tx.pair.deleteMany({
        where: { tournamentId: tournament.id },
      });
      const deletedGroups = await tx.group.deleteMany({
        where: { tournamentId: tournament.id },
      });

      await tx.tournament.update({
        where: { id: tournament.id },
        data: { status: TournamentStatus.SETUP, drawRunCount: 0 },
      });

      return {
        tournamentId: tournament.id,
        deletedSlots: deletedSlots.count,
        deletedMatches: deletedMatches.count,
        deletedPairs: deletedPairs.count,
        deletedGroups: deletedGroups.count,
      } satisfies ResetResult;
    });

    return ok(result);
  } catch (error) {
    return mapDbError(error, "No se pudo reiniciar el torneo. Intente nuevamente.");
  }
}