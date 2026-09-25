import { test } from "node:test";
import assert from "node:assert/strict";

import {
  resetTournament,
  type ResetDeps,
  type ResetResult,
  type ResetTx,
} from "@/lib/services/reset";
import {
  MatchStage,
  MatchStatus,
  TournamentStatus,
} from "@/prisma/generated/prisma/enums";

interface StoredTournament {
  id: string;
  name: string;
  status: string;
}

interface StoredParticipant {
  id: string;
  name: string;
}

interface StoredTeam {
  id: string;
  name: string;
}

interface StoredPair {
  id: string;
  tournamentId: string;
  teamId: string | null;
  groupId: string | null;
}

interface StoredGroup {
  id: string;
  name: string;
  tournamentId: string;
}

interface StoredMatch {
  id: string;
  tournamentId: string;
  stage: string;
  status: string;
  homeGoals: number;
  awayGoals: number;
  penaltiesHomeGoals: number | null;
  penaltiesAwayGoals: number | null;
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
  }
}

function buildFakeTx(store: FakeStore, failOn: string | null): ResetTx {
  return {
    matchSlot: {
      deleteMany: async () => {
        store.deletes.push("matchSlot");
        if (failOn === "matchSlot") throw new Error("fallo simulado en matchSlot");
        const count = store.slots.length;
        store.slots = [];
        return { count };
      },
    },
    match: {
      deleteMany: async () => {
        store.deletes.push("match");
        if (failOn === "match") throw new Error("fallo simulado en match");
        const count = store.matches.length;
        store.matches = [];
        return { count };
      },
    },
    pair: {
      deleteMany: async () => {
        store.deletes.push("pair");
        if (failOn === "pair") throw new Error("fallo simulado en pair");
        const count = store.pairs.length;
        store.pairs = [];
        return { count };
      },
    },
    group: {
      deleteMany: async () => {
        store.deletes.push("group");
        if (failOn === "group") throw new Error("fallo simulado en group");
        const count = store.groups.length;
        store.groups = [];
        return { count };
      },
    },
    tournament: {
      findFirst: async () => store.tournaments[0] ?? null,
      update: async (args) => {
        const tournament = store.tournaments.find((item) => item.id === args.where.id);
        if (tournament) tournament.status = args.data.status;
        return { id: args.where.id };
      },
    },
  };
}

function makeFakeDb(store: FakeStore, failOn: string | null = null): ResetDeps["db"] {
  return {
    $transaction: async <T>(fn: (tx: ResetTx) => Promise<T>): Promise<T> => {
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

const passthroughAuthorize = async () => {};

function seedFullStore(): FakeStore {
  const store = new FakeStore();
  store.tournaments.push({
    id: "t1",
    name: "FIFA FRIENDS CUP",
    status: TournamentStatus.GROUP_STAGE,
  });
  for (let i = 0; i < 12; i += 1) {
    store.participants.push({ id: `p${i + 1}`, name: `Participante ${i + 1}` });
  }
  for (let i = 0; i < 6; i += 1) {
    store.teams.push({ id: `team${i + 1}`, name: `Equipo ${i + 1}` });
  }
  for (let i = 0; i < 6; i += 1) {
    store.pairs.push({
      id: `pair${i + 1}`,
      tournamentId: "t1",
      teamId: `team${i + 1}`,
      groupId: `g${(i % 2) + 1}`,
    });
  }
  store.groups.push({ id: "g1", name: "A", tournamentId: "t1" });
  store.groups.push({ id: "g2", name: "B", tournamentId: "t1" });
  for (let i = 0; i < 3; i += 1) {
    store.matches.push({
      id: `m${i + 1}`,
      tournamentId: "t1",
      stage: MatchStage.GROUP,
      status: MatchStatus.COMPLETED,
      homeGoals: 2,
      awayGoals: 1,
      penaltiesHomeGoals: null,
      penaltiesAwayGoals: null,
    });
  }
  for (let i = 0; i < 6; i += 1) {
    store.slots.push({ id: `s${i + 1}`, matchId: `m${(i % 3) + 1}` });
  }
  return store;
}

function delegates(result: Awaited<ReturnType<typeof resetTournament>>): ResultDelegate {
  return {
    data: result.ok ? result.data : null,
    ok: result.ok,
    error: result.ok ? null : result.error,
    code: result.ok ? null : result.code ?? null,
  };
}

interface ResultDelegate {
  data: ResetResult | null;
  ok: boolean;
  error: string | null;
  code: string | null;
}

test("1. Reiniciar elimina parejas, grupos, partidos, slots y resultados", async () => {
  const store = seedFullStore();
  const result = delegates(await resetTournament({ db: makeFakeDb(store), authorize: passthroughAuthorize }));

  assert.equal(result.ok, true);
  assert.ok(result.data);
  assert.equal(result.data.deletedSlots, 6);
  assert.equal(result.data.deletedMatches, 3);
  assert.equal(result.data.deletedPairs, 6);
  assert.equal(result.data.deletedGroups, 2);
  assert.equal(result.data.tournamentId, "t1");
  assert.equal(store.slots.length, 0);
  assert.equal(store.matches.length, 0);
  assert.equal(store.pairs.length, 0);
  assert.equal(store.groups.length, 0);
});

test("2. Los participantes permanecen registrados", async () => {
  const store = seedFullStore();
  await resetTournament({ db: makeFakeDb(store), authorize: passthroughAuthorize });

  assert.equal(store.participants.length, 12);
  assert.ok(store.participants.some((participant) => participant.id === "p1"));
});

test("3. Los equipos permanecen registrados", async () => {
  const store = seedFullStore();
  await resetTournament({ db: makeFakeDb(store), authorize: passthroughAuthorize });

  assert.equal(store.teams.length, 6);
  assert.ok(store.teams.some((team) => team.id === "team1"));
});

test("4. La autenticación y los datos permanentes no se tocan", async () => {
  const store = seedFullStore();
  const result = delegates(await resetTournament({ db: makeFakeDb(store), authorize: passthroughAuthorize }));

  assert.equal(result.ok, true);
  assert.deepEqual(store.deletes, ["matchSlot", "match", "pair", "group"]);
  assert.ok(!store.deletes.includes("participant"));
  assert.ok(!store.deletes.includes("team"));
  assert.equal(store.participants.length, 12);
  assert.equal(store.teams.length, 6);
});

test("5. Un usuario no autenticado no puede ejecutar la acción", async () => {
  const store = seedFullStore();
  const db = makeFakeDb(store);

  await assert.rejects(
    resetTournament({
      db,
      authorize: async () => {
        throw new Error("no autorizado");
      },
    }),
  );

  assert.equal(store.transactionsStarted, 0);
  assert.equal(store.matches.length, 3);
  assert.equal(store.tournaments[0].status, TournamentStatus.GROUP_STAGE);
});

test("6. Si una operación falla, la transacción hace rollback completo", async () => {
  const store = seedFullStore();
  const result = delegates(await resetTournament({ db: makeFakeDb(store, "match"), authorize: passthroughAuthorize }));

  assert.equal(result.ok, false);
  assert.equal(result.code, "DATABASE");
  assert.equal(store.slots.length, 6);
  assert.equal(store.matches.length, 3);
  assert.equal(store.pairs.length, 6);
  assert.equal(store.groups.length, 2);
  assert.equal(store.participants.length, 12);
  assert.equal(store.teams.length, 6);
  assert.equal(store.tournaments[0].status, TournamentStatus.GROUP_STAGE);
});

test("7. Reiniciar un torneo ya limpio no falla", async () => {
  const store = new FakeStore();
  store.tournaments.push({ id: "t1", name: "FIFA FRIENDS CUP", status: TournamentStatus.SETUP });
  store.participants.push({ id: "p1", name: "Participante 1" });
  store.teams.push({ id: "team1", name: "Equipo 1" });

  const result = delegates(await resetTournament({ db: makeFakeDb(store), authorize: passthroughAuthorize }));

  assert.equal(result.ok, true);
  assert.ok(result.data);
  assert.equal(result.data.deletedSlots, 0);
  assert.equal(result.data.deletedMatches, 0);
  assert.equal(result.data.deletedPairs, 0);
  assert.equal(result.data.deletedGroups, 0);
  assert.equal(store.tournaments[0].status, TournamentStatus.SETUP);
  assert.equal(store.participants.length, 1);
  assert.equal(store.teams.length, 1);
});

test("8. Sin torneo creado la operación responde sin errores", async () => {
  const store = new FakeStore();
  const result = delegates(await resetTournament({ db: makeFakeDb(store), authorize: passthroughAuthorize }));

  assert.equal(result.ok, true);
  assert.ok(result.data);
  assert.equal(result.data.tournamentId, null);
  assert.equal(result.data.deletedPairs, 0);
  assert.equal(result.data.deletedGroups, 0);
});