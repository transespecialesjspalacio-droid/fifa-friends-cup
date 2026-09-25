import { test } from "node:test";
import assert from "node:assert/strict";

import { validateResultOutcome, allowsPenalties } from "@/lib/services/results-core";
import { loserOf, winnerOf } from "@/lib/services/resolution";
import { MatchStage, MatchStatus } from "@/prisma/generated/prisma/enums";

const home = {
  pairId: "h",
  participant1: { id: "p1", name: "Local 1", nickname: null },
  participant2: { id: "p2", name: "Local 2", nickname: null },
  teamName: null,
};

const away = {
  pairId: "a",
  participant1: { id: "p3", name: "Visitante 1", nickname: null },
  participant2: { id: "p4", name: "Visitante 2", nickname: null },
  teamName: null,
};

type PenaltyPair = [number, number] | null;

function outcome(
  stage: string,
  homeGoals: number,
  awayGoals: number,
  penalties: PenaltyPair = null,
) {
  return validateResultOutcome({
    stage,
    homeGoals,
    awayGoals,
    penaltiesHomeGoals: penalties ? penalties[0] : null,
    penaltiesAwayGoals: penalties ? penalties[1] : null,
  });
}

test("allowsPenalties solo en SEMIFINAL y FINAL", () => {
  assert.equal(allowsPenalties(MatchStage.SEMIFINAL), true);
  assert.equal(allowsPenalties(MatchStage.FINAL), true);
  assert.equal(allowsPenalties(MatchStage.GROUP), false);
  assert.equal(allowsPenalties(MatchStage.THIRD_PLACE), false);
  assert.equal(allowsPenalties(MatchStage.ROUND_OF_16), false);
  assert.equal(allowsPenalties(MatchStage.QUARTERFINAL), false);
});

test("1. Grupo 2-2 es válido sin penales", () => {
  const result = outcome(MatchStage.GROUP, 2, 2);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.data.usesPenalties, false);
});

test("2. Semifinal 2-1 gana el local por goles", () => {
  const result = outcome(MatchStage.SEMIFINAL, 2, 1);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.data.usesPenalties, false);
  assert.equal(winnerOf(home, away, 2, 1, MatchStatus.COMPLETED)?.pairId, "h");
});

test("3. Semifinal 2-2 con penales 4-3 gana el local por penales", () => {
  const result = outcome(MatchStage.SEMIFINAL, 2, 2, [4, 3]);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.data.usesPenalties, true);
  assert.equal(
    winnerOf(home, away, 2, 2, MatchStatus.COMPLETED, 4, 3)?.pairId,
    "h",
  );
});

test("4. Final 1-1 con penales 5-4 gana el local por penales", () => {
  const result = outcome(MatchStage.FINAL, 1, 1, [5, 4]);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.data.usesPenalties, true);
  assert.equal(
    winnerOf(home, away, 1, 1, MatchStatus.COMPLETED, 5, 4)?.pairId,
    "h",
  );
  assert.equal(
    loserOf(home, away, 1, 1, MatchStatus.COMPLETED, 5, 4)?.pairId,
    "a",
  );
});

test("5. Semifinal 2-2 sin penales es rechazada", () => {
  const result = outcome(MatchStage.SEMIFINAL, 2, 2);
  assert.equal(result.ok, false);
});

test("6. Final 1-1 sin penales es rechazada", () => {
  const result = outcome(MatchStage.FINAL, 1, 1);
  assert.equal(result.ok, false);
});

test("7. Tercer puesto 2-2 es rechazado", () => {
  const result = outcome(MatchStage.THIRD_PLACE, 2, 2);
  assert.equal(result.ok, false);
});

test("8. Tercer puesto con penales es rechazado", () => {
  const result = outcome(MatchStage.THIRD_PLACE, 0, 0, [4, 3]);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "PENALTIES_NOT_ALLOWED");
});

test("9. Grupo con penales es rechazado", () => {
  const result = outcome(MatchStage.GROUP, 2, 2, [4, 3]);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "PENALTIES_NOT_ALLOWED");
});

test("10. Penales empatados es rechazado", () => {
  const result = outcome(MatchStage.SEMIFINAL, 2, 2, [3, 3]);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "PENALTIES_TIE");
});

test("Penales negativos o decimales son rechazados", () => {
  assert.equal(outcome(MatchStage.SEMIFINAL, 2, 2, [-1, 3]).ok, false);
  assert.equal(outcome(MatchStage.SEMIFINAL, 2, 2, [4, 2.5]).ok, false);
});

test("Goles diferentes con penales cargados es rechazado", () => {
  const result = outcome(MatchStage.FINAL, 3, 1, [4, 3]);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "PENALTIES_NOT_REQUIRED");
});

test("11. winnerOf/loserOf resuelven correctamente mediante penales", () => {
  assert.equal(winnerOf(home, away, 2, 2, MatchStatus.COMPLETED, 3, 4)?.pairId, "a");
  assert.equal(loserOf(home, away, 2, 2, MatchStatus.COMPLETED, 3, 4)?.pairId, "h");
  assert.equal(winnerOf(home, away, 2, 2, MatchStatus.COMPLETED, 4, 3)?.pairId, "h");
  assert.equal(loserOf(home, away, 2, 2, MatchStatus.COMPLETED, 4, 3)?.pairId, "a");
  assert.equal(winnerOf(home, away, 2, 2, MatchStatus.COMPLETED), null);
  assert.equal(loserOf(home, away, 2, 2, MatchStatus.COMPLETED), null);
  assert.equal(winnerOf(home, away, 3, 1, MatchStatus.COMPLETED, 4, 3)?.pairId, "h");
  assert.equal(loserOf(home, away, 3, 1, MatchStatus.COMPLETED, 4, 3)?.pairId, "a");
  assert.equal(winnerOf(home, away, 2, 2, MatchStatus.SCHEDULED, 4, 3), null);
});