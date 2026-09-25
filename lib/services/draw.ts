import { fail, ok, type ServiceResult } from "@/lib/services/result";

export const DRAW_TARGETS = {
  participants: 12,
  pairs: 6,
  groups: 2,
  pairsPerGroup: 3,
  lockedPairSlots: [3, 4, 5],
} as const;

const LOCKED_PAIR_NAMES = ["Sebastian", "Jhon"];
const LOCKED_TEAM_NAMES = ["Real Madrid"];

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
): ServiceResult<PairStep[]> {
  if (participants.length !== DRAW_TARGETS.participants) {
    return fail(
      `El sorteo de parejas requiere exactamente ${DRAW_TARGETS.participants} participantes.`,
      "NOT_READY",
    );
  }

  const firstName = LOCKED_PAIR_NAMES[0];
  const secondName = LOCKED_PAIR_NAMES[1];
  const first = participants.find((participant) => matchesName(participant, firstName));
  const second = participants.find((participant) => matchesName(participant, secondName));

  const lockedPair: PairStep | null =
    first && second
      ? { order: 0, participant1: first, participant2: second }
      : null;

  const lockedIds = new Set(
    lockedPair ? [lockedPair.participant1.id, lockedPair.participant2.id] : [],
  );
  const remaining = shuffle(participants.filter((p) => !lockedIds.has(p.id)));

  const unordered: PairStep[] = [];
  if (lockedPair) unordered.push(lockedPair);
  for (let i = 0; i < remaining.length; i += 2) {
    unordered.push({
      order: 0,
      participant1: remaining[i],
      participant2: remaining[i + 1],
    });
  }

  const others = shuffle(unordered.filter((step) => step !== lockedPair));

  const ordered: PairStep[] = [];
  if (lockedPair) {
    const slot = randomInt(
      DRAW_TARGETS.lockedPairSlots[0],
      DRAW_TARGETS.lockedPairSlots[1],
    );
    for (let i = 1; i <= DRAW_TARGETS.pairs; i++) {
      ordered.push(i === slot ? lockedPair : (others.shift() as PairStep));
    }
  } else {
    ordered.push(...others);
  }

  return ok(ordered.map((step, index) => ({ ...step, order: index + 1 })));
}

export function planTeamDraw(
  pairs: PairStep[],
  teams: DrawableTeam[],
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

  const lockedTeam = teams.find(
    (team) => normalizeName(team.name) === normalizeName(LOCKED_TEAM_NAMES[0]),
  );
  if (!lockedTeam) {
    return fail(
      "Equipo requerido no registrado: no se puede completar el sorteo de equipos.",
      "TEAM_NOT_REGISTERED",
    );
  }

  const lockedPair =
    pairs.find(
      (pair) =>
        (matchesName(pair.participant1, LOCKED_PAIR_NAMES[0]) &&
          matchesName(pair.participant2, LOCKED_PAIR_NAMES[1])) ||
        (matchesName(pair.participant1, LOCKED_PAIR_NAMES[1]) &&
          matchesName(pair.participant2, LOCKED_PAIR_NAMES[0])),
    ) ?? null;

  let assignments: DrawableTeam[] = [];
  if (lockedPair) {
    assignments = new Array<DrawableTeam>(pairs.length);
    assignments[pairs.findIndex((pair) => pair.order === lockedPair.order)] = lockedTeam;
    const pool = shuffle(teams.filter((team) => team.id !== lockedTeam.id));
    for (let i = 0; i < assignments.length; i++) {
      if (!assignments[i]) assignments[i] = pool.pop() as DrawableTeam;
    }
  } else {
    assignments = shuffle(teams);
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