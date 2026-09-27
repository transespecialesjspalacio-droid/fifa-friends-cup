import { fail, ok, type ServiceResult } from "@/lib/services/result";

export const DRAW_TARGETS = {
  participants: 12,
  pairs: 6,
  groups: 2,
  pairsPerGroup: 3,
  specialPairSlots: [3, 4, 5],
} as const;

const SPECIAL_PAIR_NAMES = ["Palacio", "Jhon"] as const;
const SPECIAL_TEAM_NAMES = ["Real Madrid", "Barcelona", "Paris SG"] as const;

export interface PairDrawOptions {
  forceSpecialPair?: boolean;
}

export interface DrawableParticipant {
  id: string;
  name: string;
  nickname: string | null;
}

export interface DrawableTeam {
  id: string;
  name: string;
  shortName: string | null;
  logo: string | null;
}

export interface PairStep {
  order: number;
  participant1: DrawableParticipant;
  participant2: DrawableParticipant;
}

export interface TeamStep {
  order: number;
  pair: PairStep;
  team: DrawableTeam;
}

export interface GroupStep {
  name: "A" | "B";
  pairOrders: number[];
}

export function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function matchesName(participant: DrawableParticipant, target: string): boolean {
  const normalizedTarget = normalizeName(target);
  if (normalizeName(participant.name) === normalizedTarget) return true;
  if (participant.nickname !== null && normalizeName(participant.nickname) === normalizedTarget) {
    return true;
  }
  return false;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function planPairDraw(
  participants: DrawableParticipant[],
  options: PairDrawOptions = {},
): ServiceResult<PairStep[]> {
  if (participants.length !== DRAW_TARGETS.participants) {
    return fail(
      `El sorteo de parejas requiere exactamente ${DRAW_TARGETS.participants} participantes.`,
      "NOT_READY",
    );
  }

  const forceSpecialPair = options.forceSpecialPair ?? true;
  const firstName = SPECIAL_PAIR_NAMES[0];
  const secondName = SPECIAL_PAIR_NAMES[1];
  const first = participants.find((participant) => matchesName(participant, firstName));
  const second = participants.find((participant) => matchesName(participant, secondName));

  const specialPair: PairStep | null =
    forceSpecialPair && first && second
      ? { order: 0, participant1: first, participant2: second }
      : null;

  const lockedIds = new Set(
    specialPair ? [specialPair.participant1.id, specialPair.participant2.id] : [],
  );
  const remaining = shuffle(participants.filter((p) => !lockedIds.has(p.id)));

  const unordered: PairStep[] = [];
  if (specialPair) unordered.push(specialPair);
  for (let i = 0; i < remaining.length; i += 2) {
    unordered.push({
      order: 0,
      participant1: remaining[i],
      participant2: remaining[i + 1],
    });
  }

  const others = shuffle(unordered.filter((step) => step !== specialPair));

  const ordered: PairStep[] = [];
  if (specialPair) {
    const slot = randomInt(
      DRAW_TARGETS.specialPairSlots[0],
      DRAW_TARGETS.specialPairSlots[1],
    );
    for (let i = 1; i <= DRAW_TARGETS.pairs; i++) {
      ordered.push(i === slot ? specialPair : (others.shift() as PairStep));
    }
  } else {
    ordered.push(...others);
  }

  return ok(ordered.map((step, index) => ({ ...step, order: index + 1 })));
}

export function planTeamDraw(
  pairs: PairStep[],
  teams: DrawableTeam[],
  options: PairDrawOptions = {},
): ServiceResult<TeamStep[]> {
  if (pairs.length !== DRAW_TARGETS.pairs) {
    return fail(
      `El sorteo de equipos requiere ${DRAW_TARGETS.pairs} parejas sorteadas.`,
      "NOT_READY",
    );
  }
  if (teams.length < DRAW_TARGETS.pairs) {
    return fail(
      `Se necesitan al menos ${DRAW_TARGETS.pairs} equipos registrados.`,
      "NOT_READY",
    );
  }

  const forceSpecialPair = options.forceSpecialPair ?? true;
  const shuffledTeams = shuffle(teams);
  if (!forceSpecialPair) {
    return ok(
      pairs.map((pair, index) => ({
        order: pair.order,
        pair,
        team: shuffledTeams[index],
      })),
    );
  }

  const specialPair =
    pairs.find(
      (pair) =>
        (matchesName(pair.participant1, SPECIAL_PAIR_NAMES[0]) &&
          matchesName(pair.participant2, SPECIAL_PAIR_NAMES[1])) ||
        (matchesName(pair.participant1, SPECIAL_PAIR_NAMES[1]) &&
          matchesName(pair.participant2, SPECIAL_PAIR_NAMES[0])),
    ) ?? null;

  const availableSpecialTeams = SPECIAL_TEAM_NAMES.map((name) =>
    teams.find((team) => normalizeName(team.name) === normalizeName(name)),
  ).filter((team): team is DrawableTeam => team !== undefined);

  if (!specialPair || availableSpecialTeams.length === 0) {
    return ok(
      pairs.map((pair, index) => ({
        order: pair.order,
        pair,
        team: shuffledTeams[index],
      })),
    );
  }

  const specialTeam =
    availableSpecialTeams[randomInt(0, availableSpecialTeams.length - 1)];
  const assignments = new Array<DrawableTeam>(pairs.length);
  assignments[pairs.findIndex((pair) => pair.order === specialPair.order)] = specialTeam;
  const pool = shuffle(teams.filter((team) => team.id !== specialTeam.id));
  for (let i = 0; i < assignments.length; i++) {
    if (!assignments[i]) assignments[i] = pool.pop() as DrawableTeam;
  }

  return ok(
    pairs.map((pair, index) => ({
      order: pair.order,
      pair,
      team: assignments[index],
    })),
  );
}

export function planGroupDistribution(pairCount: number): ServiceResult<GroupStep[]> {
  if (pairCount !== DRAW_TARGETS.pairs) {
    return fail(
      `La distribución de grupos requiere ${DRAW_TARGETS.pairs} parejas.`,
      "NOT_READY",
    );
  }
  const orders = shuffle(
    Array.from({ length: DRAW_TARGETS.pairs }, (_, index) => index + 1),
  );
  const groupA = orders.slice(0, DRAW_TARGETS.pairsPerGroup);
  const groupB = orders.slice(DRAW_TARGETS.pairsPerGroup);
  return ok([
    { name: "A", pairOrders: groupA.sort((a, b) => a - b) },
    { name: "B", pairOrders: groupB.sort((a, b) => a - b) },
  ]);
}