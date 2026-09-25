import { db } from "@/lib/db";
import { mapDbError } from "@/lib/services/db-errors";
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

class AlreadyDrawnError extends Error {
  constructor() {
    super("El sorteo ya fue realizado.");
    this.name = "AlreadyDrawnError";
  }
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

interface ValidatedState {
  participants: DrawableParticipant[];
  teams: DrawableTeam[];
}

async function validatePreconditions(): Promise<ServiceResult<ValidatedState>> {
  const [participants, teams] = await Promise.all([
    db.participant.findMany({ select: { id: true, name: true, nickname: true } }),
    db.team.findMany({ select: { id: true, name: true, shortName: true, logo: true } }),
  ]);

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

  const hasRealMadrid = teams.some((team) => normalizeName(team.name) === "real madrid");
  if (!hasRealMadrid) {
    return fail(
      "Real Madrid debe estar registrado antes de ejecutar el sorteo.",
      "TEAM_NOT_REGISTERED",
    );
  }

  return ok({ participants, teams });
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

export async function runDraw(): Promise<ServiceResult<DrawResult>> {
  try {
    const state = await validatePreconditions();
    if (!state.ok) return state;

    const pairPlan = planPairDraw(state.data.participants);
    if (!pairPlan.ok) return pairPlan;

    const teamPlan = planTeamDraw(pairPlan.data, state.data.teams);
    if (!teamPlan.ok) return teamPlan;

    const groupPlan = planGroupDistribution(pairPlan.data.length);
    if (!groupPlan.ok) return groupPlan;

    const result = await db.$transaction(async (tx) => {
      const tournament =
        (await tx.tournament.findFirst({ orderBy: { createdAt: "asc" } })) ??
        (await tx.tournament.create({
          data: {
            name: "FIFA FRIENDS CUP",
            description: "Torneo amistoso de parejas.",
            status: TournamentStatus.SETUP,
          },
        }));

      const existingPairs = await tx.pair.count({ where: { tournamentId: tournament.id } });
      const existingMatches = await tx.match.count({ where: { tournamentId: tournament.id } });
      if (existingPairs > 0 || existingMatches > 0) {
        throw new AlreadyDrawnError();
      }

      const groups: Array<{ id: string; name: string }> = [];
      for (const groupStep of groupPlan.data) {
        const created = await tx.group.create({
          data: { name: groupStep.name, tournamentId: tournament.id },
          select: { id: true, name: true },
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
            groupId: groupIdByName.get(groupName),
          },
          select: { id: true },
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
                  directPairId: homePairId,
                },
                {
                  position: SlotPosition.AWAY,
                  type: MatchSlotType.GROUP_DIRECT,
                  directPairId: awayPairId,
                },
              ],
            },
          },
        });
      }

      if (tournament.status === TournamentStatus.SETUP) {
        await tx.tournament.update({
          where: { id: tournament.id },
          data: { status: TournamentStatus.GROUP_STAGE },
        });
      }

      return {
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        pairs: drawnPairs,
        groups: groupPlan.data,
        matches,
      } satisfies DrawResult;
    });

    return ok(result);
  } catch (error) {
    if (error instanceof AlreadyDrawnError) {
      return fail("El sorteo ya fue realizado.", "ALREADY_DRAWN");
    }
    return mapDbError(error, "No se pudo ejecutar el sorteo. Intente nuevamente.");
  }
}