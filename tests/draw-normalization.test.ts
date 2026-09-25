import { test } from "node:test";
import assert from "node:assert/strict";

import {
  normalizeName,
  planPairDraw,
  planTeamDraw,
  type DrawableParticipant,
  type DrawableTeam,
  type PairStep,
  type TeamStep,
} from "@/lib/services/draw";

const SPECIAL_NAMES = ["Sebastian", "Jhon"] as const;

const OTHER_NAMES = [
  "Luis",
  "Andres",
  "Marta",
  "Carla",
  "Diego",
  "Lina",
  "Pedro",
  "Ana",
  "Sergio",
  "Ruth",
];

function makeParticipant(id: number, name: string): DrawableParticipant {
  return { id: `participant-${id}`, name, nickname: null };
}

function makeParticipants(firstName: string, secondName: string): DrawableParticipant[] {
  return [
    makeParticipant(0, firstName),
    makeParticipant(1, secondName),
    ...OTHER_NAMES.map((name, index) => makeParticipant(index + 2, name)),
  ];
}

function makeTeam(id: number, name: string): DrawableTeam {
  return { id: `team-${id}`, name, shortName: null, logo: null };
}

function makeTeams(lockedTeamName: string): DrawableTeam[] {
  return [
    makeTeam(1, lockedTeamName),
    makeTeam(2, "Arsenal"),
    makeTeam(3, "Barcelona"),
    makeTeam(4, "Bayer Munich"),
    makeTeam(5, "Manchester City"),
    makeTeam(6, "Paris SG"),
  ];
}

function runPairDraw(participants: DrawableParticipant[]): PairStep[] {
  const plan = planPairDraw(participants);
  assert.ok(plan.ok, plan.ok ? undefined : plan.error);
  return plan.data;
}

function runTeamDraw(pairs: PairStep[], teams: DrawableTeam[]): TeamStep[] {
  const plan = planTeamDraw(pairs, teams);
  assert.ok(plan.ok, plan.ok ? undefined : plan.error);
  return plan.data;
}

function findLockedPairOrder(steps: PairStep[]): number {
  const target = SPECIAL_NAMES.map((name) => normalizeName(name)).sort().join("|");
  const locked = steps.find((step) => {
    const pair = [normalizeName(step.participant1.name), normalizeName(step.participant2.name)]
      .sort()
      .join("|");
    return pair === target;
  });
  assert.ok(locked, "La pareja especial (Sebastian/Jhon) debe detectarse.");
  return locked.order;
}

function assertLockedTeamMatches(lockedTeamName: string): void {
  const participants = makeParticipants("Sebastian", "Jhon");
  const pairs = runPairDraw(participants);
  const lockedOrder = findLockedPairOrder(pairs);
  const teams = makeTeams(lockedTeamName);
  const steps = runTeamDraw(pairs, teams);
  const assigned = steps.find((step) => step.order === lockedOrder);
  assert.ok(assigned, "Existe una asignación para la pareja especial.");
  assert.equal(normalizeName(assigned.team.name), "real madrid");
}

test("Caso 1: 'Real Madrid' encuentra 'Real Madrid'", () => {
  assertLockedTeamMatches("Real Madrid");
});

test("Caso 2: 'real madrid' encuentra 'Real Madrid'", () => {
  assertLockedTeamMatches("real madrid");
});

test("Caso 3: 'REAL MADRID' encuentra 'Real Madrid'", () => {
  assertLockedTeamMatches("REAL MADRID");
});

test("Caso 4: ' Sebastian ' puede coincidir con 'Sebastian'", () => {
  const participants = makeParticipants(" Sebastian ", "Jhon");
  const lockedOrder = findLockedPairOrder(runPairDraw(participants));
  assert.equal(typeof lockedOrder, "number");
});

test("Caso 5: 'JHON' puede coincidir con 'Jhon'", () => {
  const participants = makeParticipants("Sebastian", "JHON");
  const lockedOrder = findLockedPairOrder(runPairDraw(participants));
  assert.equal(typeof lockedOrder, "number");
});

test("Negativo: sin 'Real Madrid' devuelve TEAM_NOT_REGISTERED", () => {
  const participants = makeParticipants("Sebastian", "Jhon");
  const teams = makeTeams("Chelsea FC");
  const plan = planTeamDraw(runPairDraw(participants), teams);
  assert.equal(plan.ok, false);
  if (!plan.ok) {
    assert.equal(plan.code, "TEAM_NOT_REGISTERED");
  }
});