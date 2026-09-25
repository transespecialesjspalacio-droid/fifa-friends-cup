"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  createParticipantAction,
  deleteParticipantAction,
  updateParticipantAction,
} from "@/lib/actions/participants";
import type { ParticipantWithUsage } from "@/lib/services/participants";
import { Badge, EmptyState, Modal, SearchInput, TextField } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";

interface ParticipantsManagerProps {
  participants: ParticipantWithUsage[];
  initialError?: string;
}

interface FormState {
  name: string;
  nickname: string;
}

const emptyForm: FormState = { name: "", nickname: "" };

const MAX_NAME = 60;
const MAX_NICKNAME = 30;

function participantLabel(participant: ParticipantWithUsage): string {
  return participant.nickname
    ? `${participant.name} (${participant.nickname})`
    : participant.name;
}

export default function ParticipantsManager({
  participants,
  initialError,
}: ParticipantsManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ParticipantWithUsage | null>(null);
  const [deleting, setDeleting] = useState<ParticipantWithUsage | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return participants;
    return participants.filter((participant) =>
      participantLabel(participant).toLocaleLowerCase().includes(query),
    );
  }, [participants, search]);

  function openCreate() {
    setForm(emptyForm);
    setFormError(null);
    setCreating(true);
  }

  function openEdit(participant: ParticipantWithUsage) {
    setForm({ name: participant.name, nickname: participant.nickname ?? "" });
    setFormError(null);
    setEditing(participant);
  }

  function closeModal() {
    setCreating(false);
    setEditing(null);
  }

  async function runAction(
    action: () => Promise<{ ok: boolean; error?: string }>,
    onSuccessMessage: string,
  ) {
    setPending(true);
    setFeedback(null);
    setFormError(null);
    try {
      const result = await action();
      if (result.ok) {
        closeModal();
        setFeedback(onSuccessMessage);
        router.refresh();
      } else {
        if (creating || editing) {
          setFormError(result.error ?? "Ocurrió un error.");
        } else {
          setFeedback(result.error ?? "Ocurrió un error.");
        }
      }
    } catch {
      setFeedback("Ocurrió un error inesperado. Intenta nuevamente.");
    } finally {
      setPending(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    const name = form.name.trim();
    if (!name) {
      setFormError("El nombre es obligatorio.");
      return;
    }
    const nickname = form.nickname.trim() || null;
    if (editing) {
      void runAction(
        () =>
          updateParticipantAction(editing.id, { name, nickname }),
        "Participante actualizado.",
      );
    } else {
      void runAction(() => createParticipantAction({ name, nickname }), "Participante creado.");
    }
  }

  function handleDelete(participant: ParticipantWithUsage) {
    void runAction(() => deleteParticipantAction(participant.id), "Participante eliminado.");
    setDeleting(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {feedback && (
        <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-2 text-sm text-success">
          {feedback}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar participante..."
          />
        </div>
        <Button type="button" onClick={openCreate}>
          + Nuevo participante
        </Button>
      </div>

      {initialError ? (
        <EmptyState
          icon="!"
          title="No se pudieron cargar los participantes"
          description={initialError}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="?"
          title={search ? "Sin resultados" : "Aún no hay participantes"}
          description={
            search
              ? "Ningún participante coincide con la búsqueda."
              : "Registra participantes para armar las parejas."
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-surface/50 bg-surface p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{participant.name}</p>
                {participant.nickname && (
                  <p className="truncate text-sm text-muted">{participant.nickname}</p>
                )}
                <div className="mt-2">
                  {participant.inPair ? (
                    <Badge variant="primary">En pareja</Badge>
                  ) : (
                    <Badge variant="default">Disponible</Badge>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(participant)}
                >
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="hover:bg-error/10 hover:text-error"
                  onClick={() => setDeleting(participant)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={creating || editing !== null}
        onClose={closeModal}
        title={editing ? "Editar participante" : "Nuevo participante"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            id="participant-name"
            label="Nombre"
            value={form.name}
            onChange={(name) => setForm((f) => ({ ...f, name }))}
            maxLength={MAX_NAME}
            placeholder="Nombre completo"
            autoFocus
          />
          <TextField
            id="participant-nickname"
            label="Apodo (opcional)"
            value={form.nickname}
            onChange={(nickname) => setForm((f) => ({ ...f, nickname }))}
            maxLength={MAX_NICKNAME}
            placeholder="Apodo"
          />
          {formError && <p className="text-sm text-error">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeModal} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : editing ? "Guardar cambios" : "Crear participante"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Eliminar participante">
        {deleting && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted">
              ¿Eliminar a{" "}
              <span className="font-medium text-foreground">{participantLabel(deleting)}</span>?
              {deleting.inPair && (
                <span className="mt-1 block text-error">
                  Está en una pareja: para eliminarlo, primero quita esa pareja.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDeleting(null)} disabled={pending}>
                Cancelar
              </Button>
              <Button
                type="button"
                className="bg-error text-background hover:bg-error/90"
                disabled={pending || deleting.inPair}
                onClick={() => handleDelete(deleting)}
              >
                {pending ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}