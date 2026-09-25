import type { GroupStandings } from "@/lib/services/standings";

const HEADERS = ["POS", "PAREJA", "PJ", "PG", "PE", "PP", "GF", "GC", "DG", "PTS"] as const;

export function StandingsTable({ standings }: { standings: GroupStandings[] }) {
  if (standings.length === 0) {
    return (
      <p className="text-sm text-muted/60">
        Aún no hay clasificación: se genera con los resultados de la fase de grupos.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {standings.map((group) => (
        <section key={group.groupId ?? group.groupName}>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-primary">
            Grupo {group.groupName}
          </h3>
          <div className="overflow-x-auto rounded-xl border border-surface/50 bg-surface">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-surface/50 text-[11px] uppercase tracking-wider text-muted">
                  {HEADERS.map((header) => (
                    <th
                      key={header}
                      className={`px-3 py-2 font-medium ${
                        header === "PAREJA" ? "text-left" : "text-center"
                      }`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row) => (
                  <tr
                    key={row.pairId}
                    className={`border-b border-surface/30 last:border-0 ${
                      row.position <= 2 ? "bg-primary/5" : ""
                    }`}
                  >
                    <td
                      className={`px-3 py-2 text-center font-bold ${
                        row.position <= 2 ? "text-primary" : "text-muted"
                      }`}
                    >
                      {row.position}
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-medium text-foreground">{row.label}</p>
                      {row.teamName && (
                        <p className="text-xs text-muted/60">{row.teamName}</p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center tabular-nums text-muted">{row.pj}</td>
                    <td className="px-3 py-2 text-center tabular-nums text-muted">{row.pg}</td>
                    <td className="px-3 py-2 text-center tabular-nums text-muted">{row.pe}</td>
                    <td className="px-3 py-2 text-center tabular-nums text-muted">{row.pp}</td>
                    <td className="px-3 py-2 text-center tabular-nums text-muted">{row.gf}</td>
                    <td className="px-3 py-2 text-center tabular-nums text-muted">{row.gc}</td>
                    <td
                      className={`px-3 py-2 text-center tabular-nums ${
                        row.dg > 0 ? "text-success" : row.dg < 0 ? "text-error" : "text-muted"
                      }`}
                    >
                      {row.dg > 0 ? `+${row.dg}` : row.dg}
                    </td>
                    <td className="px-3 py-2 text-center font-bold tabular-nums text-primary">
                      {row.pts}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}