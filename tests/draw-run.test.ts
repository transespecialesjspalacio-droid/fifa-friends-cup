import { test } from "node:test";
import assert from "node:assert/strict";

import {
  runNewDraw,
  type DrawDeps,
  type DrawResult,
  type DrawRunTx,
} from "@/lib/services/draw-run";
import {
  MatchStage,
  MatchStatus,
  TournamentStatus,
} from "@/prisma/generated/prisma/enums";

interface StoredTournament {
  id: string;
  name: string;
  status: TournamentStatus;
  drawRunCount: number;
}

interface StoredParticipant {
  id: string;
  name: string;
  nickname: string | null;
}

interface StoredTeam {
  id: string;
  name: string;
  shortName: string | null;
  logo: string | null;
}

interface StoredPair {
  id: string;
  tournamentId: string;
  participant1Id: string;
  participant2Id: string;
  teamId: string;
  groupId: string;
}

interface StoredGroup {
  id: string;
  name: string;
  tournamentId: string;
}

interface StoredMatch {
  id: string;
  tournamentId: string;
  groupId: string | null;
  stage: string;
  status: string;
  homeGoals: number;
  awayGoals: number;
}

interface StoredSlot {
  id: string;
  matchId: string;
}

class FakeStore {
  tournaments: StoredTournament[] = [];
  participants: StoredParticipant[] = [];
  teams: StoredTeam[] = [];
  pairs: StoredPair[] = [];
  groups: StoredGroup[] = [];
  matches: StoredMatch[] = [];
  slots: StoredSlot[] = [];
  deletes: string[] = [];
  transactionsStarted = 0;
  transactionsCommitted = 0;
  tournamentsCreated = 0;
  createdDrawRunCounts: number[] = [];

  deepCopyArr<T>(arr: T[]): T[] {
    return JSON.parse(JSON.stringify(arr)) as T[];
  }

  clone(): FakeStore {
    const copy = new FakeStore();
    copy.tournaments = this.deepCopyArr(this.tournaments);
    copy.participants = this.deepCopyArr(this.participants);
    copy.teams = this.deepCopyArr(this.teams);
    copy.pairs = this.deepCopyArr(this.pairs);
    copy.groups = this.deepCopyArr(this.groups);
    copy.matches = this.deepCopyArr(this.matches);
    copy.slots = this.deepCopyArr(this.slots);
    copy.deletes = [...this.deletes];
    copy.transactionsStarted = this.transactionsStarted;
    copy.transactionsCommitted = this.transactionsCommitted;
    copy.tournamentsCreated = this.tournamentsCreated;
    copy.createdDrawRunCounts = [...this.createdDrawRunCounts];
    return copy;
  }

  restore(snapshot: FakeStore): void {
    this.tournaments = snapshot.tournaments;
    this.participants = snapshot.participants;
    this.teams = snapshot.teams;
    this.pairs = snapshot.pairs;
    this.groups = snapshot.groups;
    this.matches = snapshot.matches;
    this.slots = snapshot.slots;
    this.deletes = [...snapshot.deletes];
    this.transactionsStarted = snapshot.transactionsStarted;
    this.transactionsCommitted = snapshot.transactionsCommitted;
    this.tournamentsCreated = snapshot.tournamentsCreated;
    this.createdDrawRunCounts = [...snapshot.createdDrawRunCounts];
  }
}

function makeParticipant(id: string, name: string): StoredParticipant {
  return { id, name, nickname: null };
}

function makeTeam(id: string, name: string): StoredTeam {
  return { id, name, shortName: null, logo: null };
}

function seedParticipants(): StoredParticipant[] {
  return [
    makeParticipant("p-palacio", "Palacio"),
    makeParticipant("p-jhon", "Jhon"),
    ...["Luis", "Andres", "Marta", "Carla", "Diego", "Lina", "Pedro", "Ana", "Sergio", "Ruth"].map(
      (name, index) => makeParticipant(`p-extra-${index}`, name),
    ),
  ];
}

function seedTeams(): StoredTeam[] {
  return [
    makeTeam("t-real", "Real Madrid"),
    makeTeam("t-arsenal", "Arsenal"),
    makeTeam("t-barca", "Barcelona"),
    makeTeam("t-bayer", "Bayer Munich"),
    makeTeam("t-city", "Manchester City"),
    makeTeam("t-psg", "Paris SG"),
  ];
}

function seedBaseStore(): FakeStore {
  const store = new FakeStore();
  store.participants = seedParticipants();
  store.teams = seedTeams();
  return store;
}

function seedStoreWithDraw(runCount: number): FakeStore {
  const store = seedBaseStore();
  store.tournaments.push({
    id: "t1",
    name: "FIFA FRIENDS CUP",
    status: TournamentStatus.SETUP,
    drawRunCount: runCount,
  });
  const pairIds = ["pair-1", "pair-2", "pair-3", "pair-4", "pair-5", "pair-6"];
  pairIds.forEach((id, index) => {
    store.pairs.push({
      id,
      tournamentId: "t1",
      participant1Id: `old-p-${index * 2}`,
      participant2Id: `old-p-${index * 2 + 1}`,
      teamId: `team-${index + 1}`,
      groupId: index < 3 ? "g1" : "g2",
    });
  });
  store.groups.push({ id: "g1", name: "A", tournamentId: "t1" });
  store.groups.push({ id: "g2", name: "B", tournamentId: "t1" });
  for (let i = 0; i < 6; i += 1) {
    store.matches.push({
      id: `m-${i + 1}`,
      tournamentId: "t1",
      groupId: i < 3 ? "g1" : "g2",
      stage: MatchStage.GROUP,
      status: MatchStatus.SCHEDULED,
      homeGoals: 0,
      awayGoals: 0,
    });
  }
  for (let i = 0; i < 12; i += 1) {
    store.slots.push({ id: `s-${i + 1}`, matchId: `m-${Math.floor(i / 2) + 1}` });
  }
  return store;
}

function buildFakeTx(store: FakeStore, failOn: string | null): DrawRunTx {
  let idCounter = 0;

  return {
    participant: {
      findMany: async () => store.deepCopyArr(store.participants),
    },
    team: {
      findMany: async () => store.deepCopyArr(store.teams),
    },
    tournament: {
      findFirst: async () => {
        const entry = store.tournaments[0];
        if (!entry) return null;
        return {
          id: entry.id,
          name: entry.name,
          status: entry.status,
          drawRunCount: entry.drawRunCount,
        };
      },
      create: async (args) => {
        store.tournamentsCreated += 1;
        const created: StoredTournament = {
          id: "t-new",
          name: args.data.name,
          status: args.data.status,
          drawRunCount: 0,
        };
        store.tournaments.push(created);
        store.createdDrawRunCounts.push(created.drawRunCount);
        return { ...created };
      },
      update: async (args) => {
        const entry = store.tournaments.find((item) => item.id === args.where.id);
        if (entry) entry.drawRunCount = args.data.drawRunCount;
        return { id: args.where.id };
      },
    },
    matchSlot: {
      deleteMany: async (args) => {
        store.deletes.push("matchSlot");
        if (failOn === "matchSlot") throw new Error("fallo simulado en matchSlot");
        const matchIds = new Set(
          store.matches
            .filter((match) => match.tournamentId === args.where.match.tournamentId)
            .map((match) => match.id),
        );
        const remaining = store.slots.filter((slot) => !matchIds.has(slot.matchId));
        const count = store.slots.length - remaining.length;
        store.slots = remaining;
        return { count };
      },
    },
    match: {
      deleteMany: async (args) => {
        store.deletes.push("match");
        if (failOn === "match") throw new Error("fallo simulado en match");
        const remaining = store.matches.filter(
          (match) => match.tournamentId !== args.where.tournamentId,
        );
        const count = store.matches.length - remaining.length;
        store.matches = remaining;
        return { count };
      },
      create: async (args) => {
        idCounter += 1;
        const matchId = `m-${idCounter}`;
        store.matches.push({
          id: matchId,
          tournamentId: args.data.tournamentId,
          groupId: args.data.groupId ?? null,
          stage: args.data.stage,
          status: args.data.status,
          homeGoals: 0,
          awayGoals: 0,
        });
        for (let index = 0; index < args.data.slots.create.length; index += 1) {
          store.slots.push({ id: `s-${idCounter}-${index}`, matchId });
        }
        return { id: matchId };
      },
    },
    pair: {
      deleteMany: async (args) => {
        store.deletes.push("pair");
        if (failOn === "pairDelete") throw new Error("fallo simulado en pairDelete");
        const remaining = store.pairs.filter(
          (pair) => pair.tournamentId !== args.where.tournamentId,
        );
        const count = store.pairs.length - remaining.length;
        store.pairs = remaining;
        return { count };
      },
      create: async (args) => {
        if (failOn === "pairCreate") throw new Error("fallo simulado en pairCreate");
        idCounter += 1;
        store.pairs.push({
          id: `pair-${idCounter}`,
          tournamentId: args.data.tournamentId,
          participant1Id: args.data.participant1Id,
          participant2Id: args.data.participant2Id,
          teamId: args.data.teamId,
          groupId: args.data.groupId,
        });
        return { id: `pair-${idCounter}` };
      },
    },
    group: {
      deleteMany: async (args) => {
        store.deletes.push("group");
        if (failOn === "group") throw new Error("fallo simulado en group");
        const remaining = store.groups.filter(
          (group) => group.tournamentId !== args.where.tournamentId,
        );
        const count = store.groups.length - remaining.length;
        store.groups = remaining;
        return { count };
      },
      create: async (args) => {
        idCounter += 1;
        store.groups.push({
          id: `g-${idCounter}`,
          name: args.data.name,
          tournamentId: args.data.tournamentId,
        });
        return { id: `g-${idCounter}`, name: args.data.name };
      },
    },
  };
}

function makeFakeDb(store: FakeStore, failOn: string | null = null): DrawDeps["db"] {
  return {
    $transaction: async <T>(fn: (tx: DrawRunTx) => Promise<T>): Promise<T> => {
      store.transactionsStarted += 1;
      const snapshot = store.clone();
      try {
        const result = await fn(buildFakeTx(store, failOn));
        store.transactionsCommitted += 1;
        return result;
      } catch (error) {
        store.restore(snapshot);
        throw error;
      }
    },
  };
}

interface ResultDelegate {
  data: DrawResult | null;
  ok: boolean;
  error: string | null;
  code: string | null;
}

function delegates(result: Awaited<ReturnType<typeof runNewDraw>>): ResultDelegate {
  return {
    data: result.ok ? result.data : null,
    ok: result.ok,
    error: result.ok ? null : result.error,
    code: result.ok ? null : (result.code ?? null),
  };
}

function assertValidDraw(result: DrawResult): void {
  assert.equal(result.pairs.length, 6, "Deben generarse 6 parejas.");
  assert.deepEqual(
    result.pairs.map((pair) => pair.order).sort((a, b) => a - b),
    [1, 2, 3, 4, 5, 6],
    "Los órdenes de pareja deben cubrir 1..6.",
  );
  const ids = result.pairs.flatMap((pair) => [pair.participant1.id, pair.participant2.id]);
  assert.equal(new Set(ids).size, 12, "Cada participante debe estar en una sola pareja.");
  assert.equal(result.groups.length, 2, "Deben generarse 2 grupos.");
  assert.equal(result.matches.length, 6, "Deben generarse 6 partidos.");
}

function findSpecialPair(result: DrawResult): { order: number } | undefined {
  return result.pairs.find(
    (pair) =>
      (pair.participant1.name === "Palacio" || pair.participant2.name === "Palacio") &&
      (pair.participant1.name === "Jhon" || pair.participant2.name === "Jhon"),
  );
}

test("A. Sin torneo previo: se crea el torneo con drawRunCount=0 y el primer sorteo lo deja en 1", async () => {
  const store = seedBaseStore();
  const result = delegates(await runNewDraw({ db: makeFakeDb(store) }));

  assert.equal(result.ok, true);
  assert.ok(result.data);
  assert.equal(store.tournamentsCreated, 1);
  assert.deepEqual(store.createdDrawRunCounts, [0]);
  assert.equal(store.tournaments[0].drawRunCount, 1);
});

  test("B. Primer Nuevo sorteo con contador 0: drawRunCount=1 y fuerza la pareja Palacio+Jhon", async () => {
    const store = seedStoreWithDraw(0);
    const result = delegates(await runNewDraw({ db: makeFakeDb(store) }));

    assert.equal(result.ok, true);
    assert.ok(result.data);
    assert.equal(store.tournaments[0].drawRunCount, 1);
    assertValidDraw(result.data);
    assert.ok(findSpecialPair(result.data), "En la ejecución 1 Palacio y Jhon deben quedar juntos.");
  });

  test("C. Segundo Nuevo sorteo: drawRunCount=2 y fuerza la pareja Palacio+Jhon", async () => {
    const store = seedStoreWithDraw(1);
    const result = delegates(await runNewDraw({ db: makeFakeDb(store) }));

    assert.equal(result.ok, true);
    assert.ok(result.data);
    assert.equal(store.tournaments[0].drawRunCount, 2);
    assertValidDraw(result.data);
    assert.ok(findSpecialPair(result.data), "En la ejecución 2 Palacio y Jhon deben quedar juntos.");
  });

  test("D. Tercer Nuevo sorteo: drawRunCount=3 y sin garantía de pareja (aleatorio real)", async () => {
    const store = seedStoreWithDraw(2);
    let together = 0;
    let apart = 0;
    for (let i = 0; i < 250; i += 1) {
      const snapshot = store.clone();
      const result = delegates(await runNewDraw({ db: makeFakeDb(store) }));
      assert.equal(result.ok, true);
      assert.ok(result.data);
      assert.equal(store.tournaments[0].drawRunCount, 3);
      assertValidDraw(result.data);
      if (findSpecialPair(result.data)) together += 1;
      else apart += 1;
      store.restore(snapshot);
    }
    assert.ok(together > 0, "Con aleatoriedad puede ocurrir que Palacio y Jhon queden juntos.");
    assert.ok(apart > 0, "En la ejecución 3 no hay garantía: debe haber sorteos sin Palacio+Jhon.");
  });

  test("E. Cuarto Nuevo sorteo: drawRunCount=4 y vuelve a forzar la pareja Palacio+Jhon", async () => {
    const store = seedStoreWithDraw(3);
    const result = delegates(await runNewDraw({ db: makeFakeDb(store) }));

    assert.equal(result.ok, true);
    assert.ok(result.data);
    assert.equal(store.tournaments[0].drawRunCount, 4);
    assertValidDraw(result.data);
    assert.ok(findSpecialPair(result.data), "En la ejecución 4 Palacio y Jhon deben quedar juntos.");
  });

  test("F. Quinto Nuevo sorteo: drawRunCount=5 con comportamiento aleatorio normal", async () => {
    const store = seedStoreWithDraw(4);
    const result = delegates(await runNewDraw({ db: makeFakeDb(store) }));

    assert.equal(result.ok, true);
    assert.ok(result.data);
    assert.equal(store.tournaments[0].drawRunCount, 5);
    assertValidDraw(result.data);
  });

  test("G1. Si falla por precondiciones, drawRunCount NO aumenta y no quedan datos parciales", async () => {
    const store = seedStoreWithDraw(3);
    store.participants = store.participants.filter((participant) => participant.id !== "p-extra-9");

    const result = delegates(await runNewDraw({ db: makeFakeDb(store) }));

    assert.equal(result.ok, false);
    assert.equal(result.code, "NOT_READY");
    assert.equal(store.tournaments[0].drawRunCount, 3);
    assert.deepEqual(store.deletes, []);
    assert.equal(store.pairs.length, 6);
    assert.equal(store.groups.length, 2);
    assert.equal(store.matches.length, 6);
    assert.equal(store.slots.length, 12);
  });

  test("G2. Si falla durante la creación, la transacción hace rollback completo sin incrementar", async () => {
    const store = seedStoreWithDraw(1);
    const result = delegates(await runNewDraw({ db: makeFakeDb(store, "pairCreate") }));

    assert.equal(result.ok, false);
    assert.equal(result.code, "DATABASE");
    assert.equal(store.tournaments[0].drawRunCount, 1);
    assert.equal(store.pairs.length, 6);
    assert.equal(store.groups.length, 2);
    assert.equal(store.matches.length, 6);
    assert.equal(store.slots.length, 12);
  });

  test("I. Un nuevo sorteo reemplaza el sorteo anterior sin duplicar datos", async () => {
    const store = seedStoreWithDraw(2);
    const result = delegates(await runNewDraw({ db: makeFakeDb(store) }));

    assert.equal(result.ok, true);
    assert.ok(result.data);
    assert.equal(store.tournaments[0].drawRunCount, 3);
    assert.equal(store.pairs.length, 6);
    assert.equal(store.groups.length, 2);
    assert.equal(store.matches.length, 6);
    assert.equal(store.slots.length, 12);
    assert.deepEqual(store.deletes, ["matchSlot", "match", "pair", "group"]);
  });

  test("K. Nuevo sorteo NO está permitido en GROUP_STAGE, KNOCKOUT ni FINISHED", async () => {
    for (const status of [
      TournamentStatus.GROUP_STAGE,
      TournamentStatus.KNOCKOUT,
      TournamentStatus.FINISHED,
    ]) {
      const store = seedStoreWithDraw(2);
      store.tournaments[0].status = status;
      const result = delegates(await runNewDraw({ db: makeFakeDb(store) }));

      assert.equal(result.ok, false, `Debe fallar en ${status}`);
      assert.equal(result.code, "DRAW_NOT_ALLOWED");
      assert.equal(store.tournaments[0].drawRunCount, 2);
      assert.deepEqual(store.deletes, []);
      assert.equal(store.pairs.length, 6);
      assert.equal(store.groups.length, 2);
    }
  });

  test("L. Nuevo sorteo sí está permitido en SETUP", async () => {
    const store = seedStoreWithDraw(0);
    const result = delegates(await runNewDraw({ db: makeFakeDb(store) }));

    assert.equal(result.ok, true);
    assert.ok(result.data);
    assert.equal(store.tournaments[0].drawRunCount, 1);
    assert.equal(store.tournaments[0].status, TournamentStatus.SETUP);
  });
