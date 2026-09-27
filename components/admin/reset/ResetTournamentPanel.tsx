"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetTournamentAction } from "@/lib/actions/reset";
import { Modal } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";

export default function ResetTournamentPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleConfirm() {
    if (pending) return;
    setPending(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await resetTournamentAction();
      if (result.ok) {
        setSuccess(true);
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
        setOpen(false);
      }
    } catch {
      setError("Ocurrió un error inesperado. Intente nuevamente.");
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-surface/50 bg-surface p-6">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
        Acciones de configuración
      </h2>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Reiniciar torneo</p>
          <p className="mt-1 text-sm text-muted">
            Elimina parejas, grupos, partidos y resultados. Mantiene participantes y equipos.
          </p>
        </div>
        <Button
          type="button"
          variant="default"
          size="sm"
          className="shrink-0 border border-error/30 text-error hover:bg-error/10"
          onClick={() => setOpen(true)}
        >
          Reiniciar torneo
        </Button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-error/30 bg-error/10 px-4 py-2 text-sm text-error">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 rounded-lg border border-success/30 bg-success/10 px-4 py-2 text-sm text-success">
          El torneo fue reiniciado correctamente. Los participantes y equipos están listos para
          realizar un nuevo sorteo.
        </p>
      )}

      <Modal open={open} onClose={() => { if (!pending) setOpen(false) }} title="¿Reiniciar torneo?">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Esta acción eliminará el sorteo y todos los partidos/resultados actuales. Los
            participantes y equipos permanecerán registrados.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-error text-background hover:bg-error/90"
              disabled={pending}
              onClick={() => void handleConfirm()}
            >
              {pending ? "Reiniciando..." : "Sí, reiniciar torneo"}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}