import { test } from "node:test";
import assert from "node:assert/strict";

import {
  nextPendingMatch,
  orderGroupMatches,
} from "@/lib/services/match-order";
import type { MatchWithSlots } from "@/lib/services/matches";
import { MatchStage, MatchStatus } from "@/prisma/generated/prisma/enums";

function groupMatch(
  id: string,
  groupName: string,
  status: string = MatchStatus.SCHEDULED,
): MatchWithSlots {
  return {
    id,
    groupId: `g${groupName}`,
    groupName,
    stage: MatchStage.GROUP,
    status,
    homeGoals: 0,
    awayGoals: 0,
    penaltiesHomeGoals: null,
    penaltiesAwayGoals: null,
    playedAt: null,
    home: null,
    away: null,
  };
}

function knockoutMatch(id: string, status: string = MatchStatus.SCHEDULED): MatchWithSlots {
  return {
    id,
    groupId: null,
    groupName: null,
    stage: MatchStage.SEMIFINAL,
    status,
    homeGoals: 0,
    awayGoals: 0,
    penaltiesHomeGoals: null,
    penaltiesAwayGoals: null,
    playedAt: null,
    home: null,
    away: null,
  };
}

/** Fixture completo en el orden de creación de buildFixture: A1, A2, A3, B1, B2, B3. */
function creationOrderFixture(): MatchWithSlots[] {
  return [
    groupMatch("A1", "A"),
    groupMatch("A2", "A"),
    groupMatch("A3", "A"),
    groupMatch("B1", "B"),
    groupMatch("B2", "B"),
    groupMatch("B3", "B"),
  ];
}

function markCompleted(matches: MatchWithSlots[], ids: string[]): void {
  for (const match of matches) {
    if (ids.includes(match.id)) match.status = MatchStatus.COMPLETED;
  }
}

test("El orden de fixtures es estrictamente A1, B1, A2, B2, A3, B3", () => {
  const ordered = orderGroupMatches(creationOrderFixture());

  assert.deepEqual(
    ordered.map((match) => match.id),
    ["A1", "B1", "A2", "B2", "A3", "B3"],
  );
});

test("1. A1 completado y B1 pendiente → próximo = B1", () => {
  const matches = creationOrderFixture();
  markCompleted(matches, ["A1"]);

  const next = nextPendingMatch(orderGroupMatches(matches));

  assert.equal(next?.id, "B1");
});

test("2. A1 y B1 completados y A2 pendiente → próximo = A2", () => {
  const matches = creationOrderFixture();
  markCompleted(matches, ["A1", "B1"]);

  const next = nextPendingMatch(orderGroupMatches(matches));

  assert.equal(next?.id, "A2");
});

test("3. A1, B1 y A2 completados y B2 pendiente → próximo = B2", () => {
  const matches = creationOrderFixture();
  markCompleted(matches, ["A1", "B1", "A2"]);

  const next = nextPendingMatch(orderGroupMatches(matches));

  assert.equal(next?.id, "B2");
});

test("4. Después de guardar A1, el próximo partido es B1 y no A2", () => {
  const matches = creationOrderFixture();
  markCompleted(matches, ["A1"]);

  const next = nextPendingMatch(orderGroupMatches(matches));

  assert.ok(next);
  assert.notEqual(next.id, "A2");
  assert.notEqual(next.id, "A3");
  assert.equal(next.id, "B1");
});

test("8. Completar B3 permite continuar con la lógica existente de knockout", () => {
  const group = creationOrderFixture();
  const semifinal = knockoutMatch("SF1");
  const full = [...group, semifinal];
  markCompleted(full, ["A1", "B1", "A2", "B2", "A3"]);

  const beforeB3 = nextPendingMatch(orderGroupMatches(full));
  assert.equal(beforeB3?.id, "B3", "con B3 pendiente no debe saltar a semifinal");

  markCompleted(full, ["B3"]);
  const afterB3 = nextPendingMatch(orderGroupMatches(full));
  assert.equal(afterB3?.id, "SF1", "con B3 completado pasa a la fase de eliminación");
});
