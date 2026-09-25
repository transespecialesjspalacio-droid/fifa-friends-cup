import { db } from "@/lib/db";
import { TournamentStatus } from "@/prisma/generated/prisma/enums";

interface StatusPill {
  label: string;
  tone: string;
  dot: string;
  pulse: boolean;
}

function statusPill(status: TournamentStatus | null): StatusPill | null {
  if (status === TournamentStatus.GROUP_STAGE || status === TournamentStatus.KNOCKOUT) {
    return {
      label: "TORNEO EN CURSO",
      tone: "border-primary/30 bg-primary/10 text-primary",
      dot: "bg-primary",
      pulse: true,
    };
  }
  if (status === TournamentStatus.FINISHED) {
    return {
      label: "TORNEO FINALIZADO",
      tone: "border-success/30 bg-success/10 text-success",
      dot: "bg-success",
      pulse: false,
    };
  }
  return null;
}

export default async function Header() {
  const tournament = await db.tournament.findFirst({
    select: { status: true },
  });
  const pill = statusPill(tournament?.status ?? null);

  return (
    <header
      className="bg-surface border-b border-surface/50 backdrop-blur-sm sticky top-0 left-0 right-0 z-50 transition-colors"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-primary">FIFA FRIENDS CUP</span>
          <span className="text-base text-muted uppercase tracking-wider">Torneo EA FC</span>
        </div>

        {pill && (
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${pill.tone}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${pill.dot} ${pill.pulse ? "animate-pulse" : ""}`}
            />
            {pill.label}
          </span>
        )}
      </div>
    </header>
  );
}