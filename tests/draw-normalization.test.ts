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

const SPECIAL_NAMES = ["Palacio", "Jhon"] as const;
const SPECIAL_TEAM_NAMES: readonly string[] = ["real madrid", "barcelona", "paris sg"];

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

const DEFAULT_TEAMS = [
  "Real Madrid",
  "Arsenal",
  "Barcelona",
  "Bayer Munich",
  "Manchester City",
  "Paris SG",
];

function makeParticipant(id: number, name: string, nickname: string | null = null): DrawableParticipant {
  return { id: `participant-${id}`, name, nickname };
}

function makeParticipants(firstName: string, secondName: string): DrawableParticipant[] {
  return [
    makeParticipant(0, firstName),
    makeParticipant(1, secondName),
    ...OTHER_NAMES.map((name, index) => makeParticipant(index + 2, name)),
  ];
}

function makeCustomParticipants(names: string[], nicknames: Array<string | null> = []): DrawableParticipant[] {
  return names.map((name, index) => makeParticipant(index, name, nicknames[index] ?? null));
}

function makeTeam(id: number, name: string): DrawableTeam {
  return { id: `team-${id}`, name, shortName: null, logo: null };
}

function makeTeams(teamNames: string[]): DrawableTeam[] {
  return teamNames.map((name, index) => makeTeam(index + 1, name));
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

function findSpecialPair(steps: PairStep[]): PairStep | undefined {
  const target = SPECIAL_NAMES.map((name) => normalizeName(name)).sort();
  return steps.find((step) => {
    const members = [
      normalizeName(step.participant1.name),
      normalizeName(step.participant2.name),
    ];
    if (step.participant1.nickname !== null && step.participant1.nickname.trim()) {
      members.push(normalizeName(step.participant1.nickname));
    }
    if (step.participant2.nickname !== null && step.participant2.nickname.trim()) {
      members.push(normalizeName(step.participant2.nickname));
    }
    const sorted = [...members].sort();
    return target.every((name) => sorted.includes(name));
  });
}

function findStepForOrder(steps: TeamStep[], order: number): TeamStep {
  const step = steps.find((s) => s.order === order);
  assert.ok(step, `Debe existir una asignación para el orden ${order}.`);
  return step;
}

function collectDistinct(participants: DrawableParticipant[]): void {
  const special = findSpecialPair(runPairDraw(participants));
  assert.equal(special, undefined, "No debe existir pareja especial si los dos no están presentes.");
}

const FORBIDDEN_FLAG_KEYS = ["isspecialpair", "isfixedpair", "specialteam", "forcedteam", "palaciojhon"];

function collectKeys(value: unknown, keys: Set<string>): void {
  if (value === null || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    keys.add(key.toLowerCase());
    collectKeys(child, keys);
  }
}

function assertNoFlagLeaks(pairs: PairStep[], teamSteps: TeamStep[]): void {
  const keys = new Set<string>();
  collectKeys(pairs, keys);
  collectKeys(teamSteps, keys);
  for (const forbidden of FORBIDDEN_FLAG_KEYS) {
    assert.equal(keys.has(forbidden), false, `No debe filtrarse la bandera "${forbidden}".`);
  }
}

// ---- A. Palacio + Jhon presentes ----

test("A1: Palacio + Jhon presentes quedan juntos", () => {
  const participants = makeParticipants("Palacio", "Jhon");
  const pairs = runPairDraw(participants);
  const special = findSpecialPair(pairs);
  assert.ok(special, "La pareja Palacio/Jhon debe quedar junta.");
  assert.equal(typeof special.order, "number");
});

test("A2: la pareja Palacio + Jhon recibe uno de los tres equipos presentes", () => {
  const participants = makeParticipants("Palacio", "Jhon");
  const pairs = runPairDraw(participants);
  const special = findSpecialPair(pairs);
  assert.ok(special);
  const steps = runTeamDraw(pairs, makeTeams(DEFAULT_TEAMS));
  const assigned = findStepForOrder(steps, special.order);
  assert.ok(
    SPECIAL_TEAM_NAMES.includes(normalizeName(assigned.team.name)),
    `El equipo asignado (${assigned.team.name}) debe ser uno de los tres permitidos.`,
  );
});

test("A3: Sebastian no tiene ningún tratamiento especial", () => {
  const participants = makeCustomParticipants(["Sebastian", "Jhon", ...OTHER_NAMES]);
  const partners = new Set<string>();
  const teamsForJhon = new Set<string>();
  for (let i = 0; i < 40; i++) {
    const pairs = runPairDraw(participants);
    const jhonPair = pairs.find(
      (pair) =>
        normalizeName(pair.participant1.name) === "jhon" ||
        normalizeName(pair.participant2.name) === "jhon",
    );
    assert.ok(jhonPair, "Jhon debe estar en una pareja.");
    const partner =
      normalizeName(jhonPair.participant1.name) === "jhon"
        ? jhonPair.participant2
        : jhonPair.participant1;
    partners.add(normalizeName(partner.name));
    const steps = runTeamDraw(pairs, makeTeams(DEFAULT_TEAMS));
    teamsForJhon.add(normalizeName(findStepForOrder(steps, jhonPair.order).team.name));
  }
  assert.ok(
    partners.size >= 2,
    "Jhon debe emparejarse con participantes variados (sin pareja forzada).",
  );
  assert.ok(
    teamsForJhon.size >= 2,
    "A la pareja de Jhon no debe asignársele siempre el mismo equipo.",
  );
});

// ---- B. Solo Palacio presente ----

test("B: solo Palacio presente: sin regla especial, sorteo normal", () => {
  const participants = makeParticipants("Palacio", "Lina");
  collectDistinct(participants);
  const pairs = runPairDraw(participants);
  const teams = makeTeams(["Chelsea FC", "Arsenal", "Bayer Munich", "Manchester City", "Atletico", "Inter"]);
  const steps = runTeamDraw(pairs, teams);
  assert.equal(steps.length, pairs.length);
  assertNoFlagLeaks(pairs, steps);
});

// ---- C. Solo Jhon presente ----

test("C: solo Jhon presente: sin regla especial, sorteo normal", () => {
  const participants = makeParticipants("Jhon", "Lina");
  collectDistinct(participants);
  const pairs = runPairDraw(participants);
  const teams = makeTeams(["Chelsea FC", "Arsenal", "Bayer Munich", "Manchester City", "Atletico", "Inter"]);
  const steps = runTeamDraw(pairs, teams);
  assert.equal(steps.length, pairs.length);
  assertNoFlagLeaks(pairs, steps);
});

// ---- D. Ninguno presente ----

test("D: ninguno de los dos presente: sorteo completamente normal", () => {
  const noSpecialNames = [...OTHER_NAMES, "Camilo", "Sofia"];
  const participants = makeCustomParticipants(noSpecialNames);
  collectDistinct(participants);
  const pairs = runPairDraw(participants);
  assert.equal(pairs.length, 6);
  const steps = runTeamDraw(pairs, makeTeams(DEFAULT_TEAMS));
  assert.equal(steps.length, pairs.length);
  assertNoFlagLeaks(pairs, steps);
});

// ---- E. Los tres equipos presentes ----

test("E: con los tres equipos, el equipo especial se elige aleatoriamente entre ellos", () => {
  const participants = makeParticipants("Palacio", "Jhon");
  const pairs = runPairDraw(participants);
  const special = findSpecialPair(pairs);
  assert.ok(special);
  const seen = new Set<string>();
  for (let i = 0; i < 40; i++) {
    const steps = runTeamDraw(pairs, makeTeams(DEFAULT_TEAMS));
    const assigned = findStepForOrder(steps, special.order);
    assert.ok(
      SPECIAL_TEAM_NAMES.includes(normalizeName(assigned.team.name)),
      `Solo deben usarse los tres equipos permitidos (${assigned.team.name}).`,
    );
    seen.add(normalizeName(assigned.team.name));
  }
  assert.ok(
    seen.size >= 2,
    "La elección entre los tres equipos debe ser aleatoria (se observaron varios equipos).",
  );
});

// ---- F. Solo algunos de los tres presentes ----

test("F1: un solo equipo de los tres presente: se elige ese", () => {
  const participants = makeParticipants("Palacio", "Jhon");
  const pairs = runPairDraw(participants);
  const special = findSpecialPair(pairs);
  assert.ok(special);
  const teams = makeTeams(["Real Madrid", "Arsenal", "Bayer Munich", "Manchester City", "Atletico", "Inter"]);
  const steps = runTeamDraw(pairs, teams);
  const assigned = findStepForOrder(steps, special.order);
  assert.equal(normalizeName(assigned.team.name), "real madrid");
});

test("F2: dos de los tres presentes: solo se elige entre los disponibles", () => {
  const participants = makeParticipants("Palacio", "Jhon");
  const pairs = runPairDraw(participants);
  const special = findSpecialPair(pairs);
  assert.ok(special);
  const teams = makeTeams(["Real Madrid", "Barcelona", "Bayer Munich", "Manchester City", "Atletico", "Inter"]);
  const seen = new Set<string>();
  for (let i = 0; i < 40; i++) {
    const steps = runTeamDraw(pairs, teams);
    const assigned = findStepForOrder(steps, special.order);
    assert.ok(
      ["real madrid", "barcelona"].includes(normalizeName(assigned.team.name)),
      `Solo deben usarse los equipos disponibles (${assigned.team.name}).`,
    );
    seen.add(normalizeName(assigned.team.name));
  }
  assert.ok(
    seen.size >= 2,
    "La elección entre los dos disponibles debe ser aleatoria.",
  );
});

// ---- G. Ninguno de los tres presente ----

test("G: ninguno de los tres equipos presente: no se fuerza ningún equipo", () => {
  const participants = makeParticipants("Palacio", "Jhon");
  const pairs = runPairDraw(participants);
  const special = findSpecialPair(pairs);
  assert.ok(special, "La pareja Palacio/Jhon sigue junta.");
  const teams = makeTeams(["Chelsea FC", "Arsenal", "Bayer Munich", "Manchester City", "Atletico", "Inter"]);
  const seen = new Set<string>();
  for (let i = 0; i < 40; i++) {
    const steps = runTeamDraw(pairs, teams);
    const assigned = findStepForOrder(steps, special.order);
    assert.ok(
      !SPECIAL_TEAM_NAMES.includes(normalizeName(assigned.team.name)),
      "No deben asignarse los tres equipos restringidos cuando no están registrados.",
    );
    seen.add(normalizeName(assigned.team.name));
  }
  assert.ok(seen.size >= 2, "El equipo debe asignarse aleatoriamente.");
});

// ---- H. Sin fugas de banderas especiales ----

test("H: no se filtra ninguna bandera de regla especial al modelo público", () => {
  const participants = makeParticipants("Palacio", "Jhon");
  const pairs = runPairDraw(participants);
  const steps = runTeamDraw(pairs, makeTeams(DEFAULT_TEAMS));
  const pairStep = pairs[0];
  const teamStep = steps[0];
  assert.ok(pairStep);
  assert.ok(teamStep);
  assert.deepEqual(
    Object.keys(pairStep).sort(),
    ["order", "participant1", "participant2"].sort(),
  );
  assert.deepEqual(
    Object.keys(teamStep).sort(),
    ["order", "pair", "team"].sort(),
  );
  assertNoFlagLeaks(pairs, steps);
});

// ---- Normalización (mecanismo existente) ----

test("Normalización: ' Palacio ' coincide con 'Palacio'", () => {
  const participants = makeCustomParticipants([" Palacio ", "Jhon", ...OTHER_NAMES]);
  assert.ok(findSpecialPair(runPairDraw(participants)), "Palacio con espacios debe detectarse.");
});

test("Normalización: 'JHON' coincide con 'Jhon'", () => {
  const participants = makeCustomParticipants(["Palacio", "JHON", ...OTHER_NAMES]);
  assert.ok(findSpecialPair(runPairDraw(participants)), "JHON debe detectarse como Jhon.");
});

test("Normalización: 'Palacio' detectado por apodo (nickname)", () => {
  const participants = makeCustomParticipants(
    ["Pepito", "Jhon", ...OTHER_NAMES],
    ["palacio", null],
  );
  const special = findSpecialPair(runPairDraw(participants));
  assert.ok(special, "El apodo 'palacio' debe identificar al participante Palacio.");
});

test("Normalización de equipos: 'real madrid' / 'REAL MADRID' coinciden con 'Real Madrid'", () => {
  for (const name of ["Real Madrid", "real madrid", "REAL MADRID"]) {
    const participants = makeParticipants("Palacio", "Jhon");
    const pairs = runPairDraw(participants);
    const special = findSpecialPair(pairs);
    assert.ok(special);
    const teams = makeTeams([name, "Arsenal", "Bayer Munich", "Manchester City", "Atletico", "Inter"]);
    const steps = runTeamDraw(pairs, teams);
    assert.equal(normalizeName(findStepForOrder(steps, special.order).team.name), "real madrid");
  }
});