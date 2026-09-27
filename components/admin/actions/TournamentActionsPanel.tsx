"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { runNewDrawAction } from "@/lib/actions/draw";
import { resetTournamentAction } from "@/lib/actions/reset";
import type { DrawResult } from "@/lib/services/draw-run";
import { TournamentStatus } from "@/prisma/generated/prisma/enums";
import { Modal } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";

interface TournamentActionsPanelProps {
  tournamentStatus: TournamentStatus | null;
  drawRunCount: number;
  onNewDrawComplete?: (result: DrawResult) => void;
}

export default function TournamentActionsPanel({
  tournamentStatus,
  drawRunCount,
  onNewDrawComplete,
}: TournamentActionsPanelProps) {
  const router = useRouter();
  const canDrawNow = tournamentStatus === TournamentStatus.SETUP;
  const [drawOpen, setDrawOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [pending, setPending] = useState<"draw" | "reset" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  async function handleNewDraw() {
    if (pending) return;
    setPending("draw");
    setActionError(null);
    setActionMessage(null);
    try {
      const result = await runNewDrawAction();
      if (result.ok) {
        setActionMessage("Nuevo sorteo realizado correctamente.");
        setDrawOpen(false);
        if (onNewDrawComplete && result.data) {
          onNewDrawComplete(result.data);
        }
        router.refresh();
      } else {
        setActionError(result.error);
        setDrawOpen(false);
      }
    } catch {
      setActionError("Ocurrió un error inesperado. Intente nuevamente.");
      setDrawOpen(false);
    } finally {
      setPending(null);
    }
  }

  async function handleReset() {
    if (pending) return;
    setPending("reset");
    setActionError(null);
    setActionMessage(null);
    try {
      const result = await resetTournamentAction();
      if (result.ok) {
        setActionMessage("El torneo fue reiniciado correctamente.");
        setResetOpen(false);
        router.refresh();
      } else {
        setActionError(result.error);
        setResetOpen(false);
      }
    } catch {
      setActionError("Ocurrió un error inesperado. Intente nuevamente.");
      setResetOpen(false);
    } finally {
      setPending(null);
    }
  }

  const busy = pending !== null;

  return (
    <section className="rounded-2xl border border-surface/50 bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
          Acciones del torneo
        </h2>
        <span className="text-sm text-muted">Sorteos realizados: {drawRunCount}</span>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 rounded-xl border border-surface/50 bg-surface-secondary/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="text-lg leading-6">
              🎲
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">Nuevo sorteo</p>
              <p className="mt-1 text-sm text-muted">
                Genera nuevas parejas, equipos y grupos.
              </p>
              {!canDrawNow && (
                <p className="mt-1 text-xs text-warning">
                  Solo disponible cuando el torneo está en estado SETUP.
                </p>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="shrink-0"
            disabled={!canDrawNow || busy}
            onClick={() => setDrawOpen(true)}
          >
            Nuevo sorteo
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-surface/50 bg-surface-secondary/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="text-lg leading-6">
              🔄
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">Reiniciar torneo</p>
              <p className="mt-1 text-sm text-muted">
                Elimina parejas, grupos, partidos y resultados. Mantiene participantes y equipos.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="shrink-0 border border-error/30 text-error hover:bg-error/10"
            disabled={busy}
            onClick={() => setResetOpen(true)}
          >
            Reiniciar torneo
          </Button>
        </div>
      </div>

      {actionError && (
        <p className="mt-3 rounded-lg border border-error/30 bg-error/10 px-4 py-2 text-sm text-error">
          {actionError}
        </p>
      )}
      {actionMessage && (
        <p className="mt-3 rounded-lg border border-success/30 bg-success/10 px-4 py-2 text-sm text-success">
          {actionMessage}
        </p>
      )}

      <Modal
        open={drawOpen}
        onClose={() => { if (!busy) setDrawOpen(false) }}
        title="¿Realizar nuevo sorteo?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Se generarán nuevas parejas, equipos y grupos y se reemplazará el sorteo actual.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setDrawOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-error text-background hover:bg-error/90"
              disabled={busy}
              onClick={() => void handleNewDraw()}
            >
              {pending === "draw" ? "Sorteando..." : "Realizar sorteo"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={resetOpen}
        onClose={() => { if (!busy) setResetOpen(false) }}
        title="¿Reiniciar torneo?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Esta acción eliminará el sorteo y todos los partidos/resultados actuales. Los
            participantes y equipos permanecerán registrados.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setResetOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-error text-background hover:bg-error/90"
              disabled={busy}
              onClick={() => void handleReset()}
            >
              {pending === "reset" ? "Reiniciando..." : "Sí, reiniciar torneo"}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}