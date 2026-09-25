"use client";

import { Button } from "@/components/ui/Button";

export type WelcomeStatus = "por-iniciar" | "en-curso" | "fase-final" | "finalizado";

export interface WelcomeHeroProps {
  status: WelcomeStatus;
  participantCount: number;
  pairCount: number;
  groupCount: number;
  onEnter: () => void;
}

const STATUS_LABELS: Record<WelcomeStatus, string> = {
  "por-iniciar": "TORNEO POR INICIAR",
  "en-curso": "TORNEO EN CURSO",
  "fase-final": "FASE FINAL EN CURSO",
  finalizado: "TORNEO FINALIZADO",
};

const STATUS_TONES: Record<WelcomeStatus, { pill: string; dot: string; pulse: boolean }> = {
  "por-iniciar": { pill: "border-muted/30 bg-surface-secondary text-muted", dot: "bg-muted", pulse: false },
  "en-curso": { pill: "border-primary/30 bg-primary/10 text-primary", dot: "bg-primary", pulse: true },
  "fase-final": { pill: "border-secondary/40 bg-secondary/10 text-secondary", dot: "bg-secondary", pulse: true },
  finalizado: { pill: "border-success/30 bg-success/10 text-success", dot: "bg-success", pulse: false },
};

function HeroStat({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xl font-bold tabular-nums text-primary">{count}</span>
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted/70">{label}</span>
    </div>
  );
}

export default function WelcomeHero({
  status,
  participantCount,
  pairCount,
  groupCount,
  onEnter,
}: WelcomeHeroProps) {
  const tone = STATUS_TONES[status];

  return (
    <section className="relative mb-6 flex flex-col items-center overflow-hidden px-2 pt-8 text-center sm:pt-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 left-[8%] h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[6%] top-8 h-40 w-40 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute left-1/2 top-[-3rem] h-44 w-44 -translate-x-1/2 rounded-full border border-primary/10" />
        <div className="absolute left-1/2 top-1/3 h-px w-[72%] -translate-x-1/2 border-t border-white/5" />
      </div>

      <p className="text-[11px] uppercase tracking-[0.4em] text-muted">Bienvenido a</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-5xl">
        FIFA <span className="text-primary">FRIENDS</span> CUP
      </h1>
      <p className="mt-2 text-xs uppercase tracking-[0.4em] text-muted sm:text-sm sm:tracking-[0.5em]">
        Torneo EA FC
      </p>
      <p className="mt-4 text-sm text-muted/70">La copa está por comenzar</p>

      <div className="mt-7 w-full max-w-lg rounded-2xl border border-surface/50 bg-surface/80 px-4 py-6 sm:px-6 shadow-[0_0_50px_-18px_rgba(0,229,255,0.35)] backdrop-blur-sm">
        <div className="text-4xl">🏆</div>
        <h2 className="mt-2 text-lg font-bold tracking-wide text-foreground">
          FIFA FRIENDS CUP
        </h2>
        <p className="mt-1 text-[11px] uppercase tracking-[0.45em] text-muted">FC 27</p>

        <div className="mx-auto my-4 h-px w-2/3 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${tone.pill}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${tone.dot} ${tone.pulse ? "animate-pulse" : ""}`}
          />
          {STATUS_LABELS[status]}
        </span>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <HeroStat count={participantCount} label="PARTICIPANTES" />
          <HeroStat count={pairCount} label="PAREJAS" />
          <HeroStat count={groupCount} label="GRUPOS" />
        </div>

        <Button
          type="button"
          size="lg"
          className="mt-6 w-full rounded-full uppercase tracking-[0.2em]"
          onClick={onEnter}
        >
          Ingresar
        </Button>
      </div>
    </section>
  );
}