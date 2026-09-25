import { test } from "node:test";
import assert from "node:assert/strict";

import { computeStandings } from "@/lib/services/standings-core";
import { loserOf, winnerOf } from "@/lib/services/resolution";
import { MatchStage, MatchStatus } from "@/prisma/generated/prisma/enums";

interface PairLike {
  id: string;
  groupId: string | null;
  groupName: string | null;
  label: string;
  teamName: string | null;
}

interface MatchLike {
  id: string;
  stage: string;
  status: string;
  homePairId: string | null;
  homeGoals: number;
  awayPairId: string | null;
  awayGoals: number;
}

function pair(id: string, label: string): PairLike {
  return { id, groupId: "gA", groupName: "A", label, teamName: null };
}

function groupMatch(
  id: string,
  homePairId: string,
  homeGoals: number,
  awayPairId: string,
  awayGoals: number,
  status: string = MatchStatus.COMPLETED,
): MatchLike {
  return {
    id,
    stage: MatchStage.GROUP,
    status,
    homePairId,
    homeGoals,
    awayPairId,
    awayGoals,
  };
}

test("Ejemplo del enunciado: victoria 3-1 y empate 2-2 acumulan correctamente", () => {
  const pairs = [pair("p1", "A + B"), pair("p2", "C + D"), pair("p3", "E + F")];
  const matches = [
    groupMatch("m1", "p1", 3, "p2", 1),
    groupMatch("m2", "p1", 2, "p3", 2),
    groupMatch("m3", "p2", 1, "p3", 0),
  ];

  const [group] = computeStandings(pairs, matches);

  const row = (label: string) => group.rows.find((item) => item.label === label);
  const a = row("A + B") as NonNullable<ReturnType<typeof row>>;
  const c = row("C + D") as NonNullable<ReturnType<typeof row>>;
  const e = row("E + F") as NonNullable<ReturnType<typeof row>>;

  assert.equal(a.pts, 4);
  assert.equal(a.pg, 1);
  assert.equal(a.pe, 1);
  assert.equal(a.pp, 0);
  assert.equal(a.gf, 5);
  assert.equal(a.gc, 3);
  assert.equal(a.dg, 2);

  assert.equal(c.pts, 3);
  assert.equal(c.pp, 1);
  assert.equal(c.gf, 2);
  assert.equal(c.gc, 3);
  assert.equal(c.dg, -1);

  assert.equal(e.pts, 1);
  assert.equal(e.pe, 1);

  assert.deepEqual(group.rows.map((item) => item.pts), [4, 3, 1]);
});

test("Enfrentamiento directo desempata cuando puntos, DG y GF son iguales", () => {
  const pairs = [pair("a1", "Equipo 1"), pair("a2", "Equipo 2"), pair("a3", "Equipo 3")];
  const matches = [
    groupMatch("m1", "a1", 3, "a2", 2),
    groupMatch("m2", "a1", 1, "a3", 2),
    groupMatch("m3", "a2", 2, "a3", 1),
  ];

  const [group] = computeStandings(pairs, matches);

  const pts = group.rows.map((item) => item.pts);
  assert.deepEqual(pts, [3, 3, 3]);

  const dg = group.rows.map((item) => item.dg);
  assert.deepEqual(dg, [0, 0, 0]);

  assert.equal(group.rows[0].pairId, "a1");
  assert.equal(group.rows[1].pairId, "a2");
  assert.equal(group.rows[2].pairId, "a3");
});

test("Partidos pendientes no aportan datos a la clasificación", () => {
  const pairs = [pair("p1", "A"), pair("p2", "B"), pair("p3", "C")];
  const matches = [groupMatch("m1", "p1", 5, "p2", 0, MatchStatus.SCHEDULED)];

  const [group] = computeStandings(pairs, matches);

  assert.equal(group.rows.length, 3);
  for (const row of group.rows) {
    assert.equal(row.pj, 0);
    assert.equal(row.gf, 0);
    assert.equal(row.pts, 0);
  }
});

test("Solo partidos de fase de grupos cuentan para la clasificación", () => {
  const pairs = [pair("p1", "A"), pair("p2", "B")];
  const matches = [
    {
      id: "sf",
      stage: MatchStage.SEMIFINAL,
      status: MatchStatus.COMPLETED,
      homePairId: "p1",
      homeGoals: 4,
      awayPairId: "p2",
      awayGoals: 3,
    },
  ];

  const [group] = computeStandings(pairs, matches);

  assert.equal(group.rows[0].pj, 0);
  assert.equal(group.rows[0].pts, 0);
});

test("Parejas sin partidos jugados aparecen con posición determinista", () => {
  const pairs = [pair("p1", "Zeta"), pair("p2", "Alfa"), pair("p3", "Beta")];
  const [group] = computeStandings(pairs, []);

  assert.deepEqual(
    group.rows.map((item) => item.label),
    ["Alfa", "Beta", "Zeta"],
  );
  assert.deepEqual(
    group.rows.map((item) => item.position),
    [1, 2, 3],
  );
});

test("winnerOf/loserOf: marca ganador, perdedor y empate en eliminación", () => {
  const home = { pairId: "h", participant1: { id: "p", name: "Ana", nickname: null }, participant2: { id: "q", name: "Luis", nickname: null }, teamName: "Real Madrid" };
  const away = { pairId: "a", participant1: { id: "r", name: "Marta", nickname: null }, participant2: { id: "s", name: "Diego", nickname: null }, teamName: "Barcelona" };

  assert.equal(winnerOf(home, away, 3, 1, MatchStatus.COMPLETED)?.pairId, "h");
  assert.equal(loserOf(home, away, 3, 1, MatchStatus.COMPLETED)?.pairId, "a");
  assert.equal(winnerOf(home, away, 2, 2, MatchStatus.COMPLETED), null);
  assert.equal(loserOf(home, away, 2, 2, MatchStatus.COMPLETED), null);
  assert.equal(winnerOf(home, away, 3, 1, MatchStatus.SCHEDULED), null);
});