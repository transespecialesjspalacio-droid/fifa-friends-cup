import { Badge } from "@/components/admin/ui";
import type { PairWithRelations } from "@/lib/services/pairs";

function pairNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

function PairMember({ name, nickname }: { name: string; nickname: string | null }) {
  return (
    <div className="flex-1 text-center">
      <p className="text-lg font-bold text-foreground">{name}</p>
      {nickname && <p className="mt-0.5 text-xs text-muted/60">{nickname}</p>}
    </div>
  );
}

function PairCard({ pair, index }: { pair: PairWithRelations; index: number }) {
  const number = pairNumber(index);

  return (
    <div className="flex flex-col rounded-2xl border border-surface/50 bg-surface transition-colors hover:border-primary">
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums text-muted/60">{number}</span>
          <h3 className="text-sm font-medium uppercase tracking-wider text-foreground">
            Pareja {number}
          </h3>
        </div>
        {pair.group ? (
          <Badge variant="primary">Grupo {pair.group.name}</Badge>
        ) : (
          <Badge variant="default">Sin grupo</Badge>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 px-4 py-4">
        <PairMember name={pair.participant1.name} nickname={pair.participant1.nickname} />
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary"
        >
          +
        </span>
        <PairMember name={pair.participant2.name} nickname={pair.participant2.nickname} />
      </div>

      <div className="mt-auto border-t border-surface/50 px-4 py-3">
        <p className="mb-1 text-[11px] uppercase tracking-wider text-muted/60">Equipo</p>
        {pair.team ? (
          <div className="flex items-center gap-2">
            {pair.team.logo && (
              <span
                className="h-5 w-5 rounded bg-cover bg-center"
                style={{ backgroundImage: `url(${pair.team.logo})` }}
                role="img"
                aria-label={pair.team.name}
              />
            )}
            <span className="font-medium text-primary">
              {pair.team.shortName ?? pair.team.name}
            </span>
          </div>
        ) : (
          <Badge variant="default">Sin asignar</Badge>
        )}
      </div>
    </div>
  );
}

export function PairGrid({ pairs }: { pairs: PairWithRelations[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {pairs.map((pair, index) => (
        <PairCard key={pair.id} pair={pair} index={index} />
      ))}
    </div>
  );
}