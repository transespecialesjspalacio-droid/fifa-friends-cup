import { drawOptionsForRun } from "@/lib/services/draw-test-sequence";
import {
  DRAW_TARGETS,
  normalizeName,
  planGroupDistribution,
  planPairDraw,
  planTeamDraw,
  type DrawableParticipant,
  type DrawableTeam,
  type GroupStep,
} from "@/lib/services/draw";
import { mapDbError } from "@/lib/services/db-errors";
import { fail, ok, type ServiceResult } from "@/lib/services/result";
import {
  MatchSlotType,
  MatchStage,
  MatchStatus,
  SlotPosition,
  TournamentStatus,
} from "@/prisma/generated/prisma/enums";

export interface DrawnPair {
  id: string;
  order: number;
  participant1: DrawableParticipant;
  participant2: DrawableParticipant;
  team: DrawableTeam;
  groupName: string;
}

export interface DrawnGroup {
  name: string;
  pairOrders: number[];
}

export interface DrawnMatch {
  order: number;
  groupName: string;
  homeOrder: number;
  awayOrder: number;
}

export interface DrawResult {
  tournamentId: string;
  tournamentName: string;
  pairs: DrawnPair[];
  groups: DrawnGroup[];
  matches: DrawnMatch[];
}

class DrawNotAllowedError extends Error {
  constructor() {
    super("El sorteo no esta permitido en el estado actual del torneo.");
    this.name = "DrawNotAllowedError";
  }
}

export interface DrawRunTx {
  participant: {
    findMany(args: {
      select: { id: true; name: true; nickname: true };
    }): Promise<Array<{ id: string; name: string; nickname: string | null }>>;
  };
  team: {
    findMany(args: {
      select: { id: true; name: true; shortName: true; logo: true };
    }): Promise<
      Array<{ id: string; name: string; shortName: string | null; logo: string | null }>
    >;
  };
  tournament: {
    findFirst(args: {
      orderBy: { createdAt: "asc" };
    }): Promise<
      | { id: string; name: string; status: TournamentStatus; drawRunCount: number }
      | null
    >;
    create(args: {
      data: { name: string; description: string; status: TournamentStatus };
    }): Promise<{
      id: string;
      name: string;
      status: TournamentStatus;
      drawRunCount: number;
    }>;
    update(args: {
      where: { id: string };
      data: { drawRunCount: number };
    }): Promise<{ id: string }>;
  };
  matchSlot: {
    deleteMany(args: { where: { match: { tournamentId: string } } }): Promise<{ count: number }>;
  };
  match: {
    deleteMany(args: { where: { tournamentId: string } }): Promise<{ count: number }>;
    create(args: {
      data: {
        tournamentId: string;
        groupId?: string | null;
        stage: MatchStage;
        status: MatchStatus;
        slots: {
          create: Array<{
            position: SlotPosition;
            type: MatchSlotType;
            directPairId: string;
          }>;
        };
      };
    }): Promise<{ id: string }>;
  };
  pair: {
    deleteMany(args: { where: { tournamentId: string } }): Promise<{ count: number }>;
    create(args: {
      data: {
        tournamentId: string;
        participant1Id: string;
        participant2Id: string;
        teamId: string;
        groupId: string;
      };
    }): Promise<{ id: string }>;
  };
  group: {
    deleteMany(args: { where: { tournamentId: string } }): Promise<{ count: number }>;
    create(args: { data: { name: string; tournamentId: string } }): Promise<{ id: string; name: string }>;
  };
}

export interface DrawDeps {
  db: {
    $transaction<T>(fn: (tx: DrawRunTx) => Promise<T>): Promise<T>;
  };
}

function findDuplicates(names: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const name of names) {
    const key = normalizeName(name);
    if (seen.has(key)) {
      duplicates.add(key);
    }
    seen.add(key);
  }
  return [...duplicates];
}

function buildFixture(
  pairIdByOrder: Map<number, string>,
  groups: GroupStep[],
): DrawnMatch[] {
  const matches: DrawnMatch[] = [];
  let matchOrder = 1;

  for (const groupStep of groups) {
    const positions = [...groupStep.pairOrders].sort((a, b) => a - b);
    const first = positions[0];
    const second = positions[1];
    const third = positions[2];

    const fixtures = [
      { home: first, away: second },
      { home: first, away: third },
      { home: second, away: third },
    ];

    for (const fixture of fixtures) {
      const homePairId = pairIdByOrder.get(fixture.home);
      const awayPairId = pairIdByOrder.get(fixture.away);
      if (!homePairId || !awayPairId) continue;

      matches.push({
        order: matchOrder,
        groupName: groupStep.name,
        homeOrder: fixture.home,
        awayOrder: fixture.away,
      });
      matchOrder += 1;
    }
  }

  return matches;
}

export async function runNewDraw(deps: DrawDeps): Promise<ServiceResult<DrawResult>> {
  try {
    const result = await deps.db.$transaction(async (tx): Promise<ServiceResult<DrawResult>> => {
      const tournament =
        (await tx.tournament.findFirst({ orderBy: { createdAt: "asc" } })) ??
        (await tx.tournament.create({
          data: {
            name: "FIFA FRIENDS CUP",
            description: "Torneo amistoso de parejas.",
            status: TournamentStatus.SETUP,
          },
        }));

      if (tournament.status !== TournamentStatus.SETUP) {
        throw new DrawNotAllowedError();
      }

      const participants = await tx.participant.findMany({
        select: { id: true, name: true, nickname: true },
      });
      const teams = await tx.team.findMany({
        select: { id: true, name: true, shortName: true, logo: true },
      });

      if (participants.length !== DRAW_TARGETS.participants) {
        return fail(
          `Se requieren exactamente ${DRAW_TARGETS.participants} participantes.`,
          "NOT_READY",
        );
      }

      const duplicateParticipants = findDuplicates(participants.map((participant) => participant.name));
      if (duplicateParticipants.length > 0) {
        return fail(
          `Hay participantes duplicados: ${duplicateParticipants.join(", ")}. Corrija antes de ejecutar el sorteo.`,
          "DUPLICATES",
        );
      }

      if (teams.length !== DRAW_TARGETS.pairs) {
        return fail(
          `Se requieren exactamente ${DRAW_TARGETS.pairs} equipos.`,
          "NOT_READY",
        );
      }

      const duplicateTeams = findDuplicates(teams.map((team) => team.name));
      if (duplicateTeams.length > 0) {
        return fail(
          `Hay equipos duplicados: ${duplicateTeams.join(", ")}. Corrija antes de ejecutar el sorteo.`,
          "DUPLICATES",
        );
      }

      const nextRun = tournament.drawRunCount + 1;
      const runOptions = drawOptionsForRun(nextRun);

      const pairPlan = planPairDraw(participants, runOptions);
      if (!pairPlan.ok) return pairPlan;

      const teamPlan = planTeamDraw(pairPlan.data, teams, runOptions);
      if (!teamPlan.ok) return teamPlan;

      const groupPlan = planGroupDistribution(pairPlan.data.length);
      if (!groupPlan.ok) return groupPlan;

      await tx.matchSlot.deleteMany({
        where: { match: { tournamentId: tournament.id } },
      });
      await tx.match.deleteMany({ where: { tournamentId: tournament.id } });
      await tx.pair.deleteMany({ where: { tournamentId: tournament.id } });
      await tx.group.deleteMany({ where: { tournamentId: tournament.id } });

      const groups: Array<{ id: string; name: string }> = [];
      for (const groupStep of groupPlan.data) {
        const created = await tx.group.create({
          data: { name: groupStep.name, tournamentId: tournament.id },
        });
        groups.push(created);
      }
      const groupIdByName = new Map(groups.map((group) => [group.name, group.id]));

      const pairByOrder = new Map(pairPlan.data.map((pair) => [pair.order, pair]));
      const teamByOrder = new Map(teamPlan.data.map((step) => [step.order, step.team]));
      const groupNameByOrder = new Map<number, string>();
      for (const groupStep of groupPlan.data) {
        for (const order of groupStep.pairOrders) {
          groupNameByOrder.set(order, groupStep.name);
        }
      }

      const drawnPairs: DrawnPair[] = [];
      const pairIdByOrder = new Map<number, string>();

      for (let order = 1; order <= pairPlan.data.length; order += 1) {
        const step = pairByOrder.get(order);
        const pair = step as NonNullable<typeof step>;
        const team = teamByOrder.get(order) as DrawableTeam;
        const groupName = groupNameByOrder.get(order) ?? "A";

        const created = await tx.pair.create({
          data: {
            tournamentId: tournament.id,
            participant1Id: pair.participant1.id,
            participant2Id: pair.participant2.id,
            teamId: team.id,
            groupId: groupIdByName.get(groupName) as string,
          },
        });

        pairIdByOrder.set(order, created.id);
        drawnPairs.push({
          id: created.id,
          order,
          participant1: pair.participant1,
          participant2: pair.participant2,
          team,
          groupName,
        });
      }

      const matches = buildFixture(pairIdByOrder, groupPlan.data);

      for (const nextMatch of matches) {
        const homePairId = pairIdByOrder.get(nextMatch.homeOrder);
        const awayPairId = pairIdByOrder.get(nextMatch.awayOrder);
        const groupId = groupIdByName.get(nextMatch.groupName);

        await tx.match.create({
          data: {
            tournamentId: tournament.id,
            groupId,
            stage: MatchStage.GROUP,
            status: MatchStatus.SCHEDULED,
            slots: {
              create: [
                {
                  position: SlotPosition.HOME,
                  type: MatchSlotType.GROUP_DIRECT,
                  directPairId: homePairId as string,
                },
                {
                  position: SlotPosition.AWAY,
                  type: MatchSlotType.GROUP_DIRECT,
                  directPairId: awayPairId as string,
                },
              ],
            },
          },
        });
      }

      await tx.tournament.update({
        where: { id: tournament.id },
        data: { drawRunCount: nextRun },
      });

      return ok({
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        pairs: drawnPairs,
        groups: groupPlan.data,
        matches,
      } satisfies DrawResult);
    });

    return result;
  } catch (error) {
    if (error instanceof DrawNotAllowedError) {
      return fail(error.message, "DRAW_NOT_ALLOWED");
    }
    return mapDbError(error, "No se pudo ejecutar el sorteo. Intente nuevamente.");
  }
}