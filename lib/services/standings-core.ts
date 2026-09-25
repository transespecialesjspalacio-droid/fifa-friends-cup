import { MatchStage, MatchStatus } from "@/prisma/generated/prisma/enums";

export interface StandingsInputPair {
  id: string;
  groupId: string | null;
  groupName: string | null;
  label: string;
  teamName: string | null;
}

export interface StandingsInputMatch {
  id: string;
  stage: string;
  status: string;
  homePairId: string | null;
  homeGoals: number;
  awayPairId: string | null;
  awayGoals: number;
}

export interface StandingRow {
  pairId: string;
  label: string;
  teamName: string | null;
  position: number;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
}

export interface GroupStandings {
  groupId: string | null;
  groupName: string;
  rows: StandingRow[];
}

interface Stats {
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  pts: number;
}

interface MiniRow {
  pairId: string;
  label: string;
  teamName: string | null;
  stats: Stats;
}

const ZERO_STATS: Stats = { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 };

function applyResult(stats: Stats, scored: number, conceded: number): void {
  stats.pj += 1;
  stats.gf += scored;
  stats.gc += conceded;
  if (scored > conceded) {
    stats.pg += 1;
    stats.pts += 3;
  } else if (scored < conceded) {
    stats.pp += 1;
  } else {
    stats.pe += 1;
    stats.pts += 1;
  }
}

function isCounted(match: StandingsInputMatch): boolean {
  return (
    match.stage === MatchStage.GROUP &&
    match.status === MatchStatus.COMPLETED &&
    match.homePairId !== null &&
    match.awayPairId !== null
  );
}

function isBetween(firstId: string, secondId: string, match: StandingsInputMatch): boolean {
  return (
    (match.homePairId === firstId && match.awayPairId === secondId) ||
    (match.homePairId === secondId && match.awayPairId === firstId)
  );
}

function miniScore(
  first: string,
  second: string,
  match: StandingsInputMatch,
): { firstGoals: number; secondGoals: number } | null {
  if (!isBetween(first, second, match)) return null;
  if (match.homePairId === first) {
    return { firstGoals: match.homeGoals, secondGoals: match.awayGoals };
  }
  return { firstGoals: match.awayGoals, secondGoals: match.homeGoals };
}

function comparePrimary(a: MiniRow, b: MiniRow): number {
  if (b.stats.pts !== a.stats.pts) return b.stats.pts - a.stats.pts;
  const dgA = a.stats.gf - a.stats.gc;
  const dgB = b.stats.gf - b.stats.gc;
  if (dgB !== dgA) return dgB - dgA;
  return b.stats.gf - a.stats.gf;
}

function orderGroup(pairs: StandingsInputPair[], matches: StandingsInputMatch[]): MiniRow[] {
  const statsById = new Map<string, Stats>();
  for (const pair of pairs) statsById.set(pair.id, { ...ZERO_STATS });

  const relevant = matches.filter(isCounted);
  for (const match of relevant) {
    if (match.homePairId && match.awayPairId) {
      if (statsById.has(match.homePairId) && statsById.has(match.awayPairId)) {
        const home = statsById.get(match.homePairId) as Stats;
        const away = statsById.get(match.awayPairId) as Stats;
        applyResult(home, match.homeGoals, match.awayGoals);
        applyResult(away, match.awayGoals, match.homeGoals);
      }
    }
  }

  const rows: MiniRow[] = pairs.map((pair) => ({
    pairId: pair.id,
    label: pair.label,
    teamName: pair.teamName,
    stats: statsById.get(pair.id) as Stats,
  }));

  rows.sort(comparePrimary);

  const miniStats = (bucket: MiniRow[]): Map<string, Stats> => {
    const map = new Map<string, Stats>();
    for (const row of bucket) map.set(row.pairId, { ...ZERO_STATS });
    for (const match of relevant) {
      if (match.homePairId && match.awayPairId) {
        for (let i = 0; i < bucket.length; i++) {
          for (let j = i + 1; j < bucket.length; j++) {
            const first = bucket[i].pairId;
            const second = bucket[j].pairId;
            const score = miniScore(first, second, match);
            if (score) {
              const firstStats = map.get(first) as Stats;
              const secondStats = map.get(second) as Stats;
              applyResult(firstStats, score.firstGoals, score.secondGoals);
              applyResult(secondStats, score.secondGoals, score.firstGoals);
            }
          }
        }
      }
    }
    return map;
  };

  const sorted: MiniRow[] = [];
  let index = 0;
  while (index < rows.length) {
    let end = index;
    while (
      end + 1 < rows.length &&
      comparePrimary(rows[index], rows[end + 1]) === 0
    ) {
      end += 1;
    }
    const bucket = rows.slice(index, end + 1);
    if (bucket.length > 1) {
      const h2h = miniStats(bucket);
      bucket.sort((a, b) => {
        const aStats = h2h.get(a.pairId) as Stats;
        const bStats = h2h.get(b.pairId) as Stats;
        const cmp =
          bStats.pts - aStats.pts ||
          (bStats.gf - bStats.gc) - (aStats.gf - aStats.gc) ||
          bStats.gf - aStats.gf;
        if (cmp !== 0) return cmp;
        return a.label.localeCompare(b.label);
      });
    }
    sorted.push(...bucket);
    index = end + 1;
  }

  return sorted;
}

export function computeStandings(
  pairs: StandingsInputPair[],
  matches: StandingsInputMatch[],
): GroupStandings[] {
  const groups = new Map<string, StandingsInputPair[]>();
  for (const pair of pairs) {
    const key = pair.groupId ?? "__none__";
    if (pair.groupId === null) continue;
    const list = groups.get(key) ?? [];
    list.push(pair);
    groups.set(key, list);
  }

  const result: GroupStandings[] = [];
  for (const [groupId, groupPairs] of groups) {
    const ordered = orderGroup(groupPairs, matches);
    result.push({
      groupId,
      groupName: groupPairs[0].groupName ?? "Sin grupo",
      rows: ordered.map((row, position) => ({
        pairId: row.pairId,
        label: row.label,
        teamName: row.teamName,
        position: position + 1,
        pj: row.stats.pj,
        pg: row.stats.pg,
        pe: row.stats.pe,
        pp: row.stats.pp,
        gf: row.stats.gf,
        gc: row.stats.gc,
        dg: row.stats.gf - row.stats.gc,
        pts: row.stats.pts,
      })),
    });
  }

  return result.sort((a, b) => a.groupName.localeCompare(b.groupName));
}