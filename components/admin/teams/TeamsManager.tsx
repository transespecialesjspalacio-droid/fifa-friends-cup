"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createTeamAction, deleteTeamAction, updateTeamAction } from "@/lib/actions/teams";
import type { TeamWithUsage } from "@/lib/services/teams";
import { Badge, EmptyState, Modal, SearchInput, TextField } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";

interface TeamsManagerProps {
  teams: TeamWithUsage[];
  initialError?: string;
}

interface FormState {
  name: string;
  shortName: string;
  logo: string;
}

const emptyForm: FormState = { name: "", shortName: "", logo: "" };

const MAX_NAME = 60;
const MAX_SHORT_NAME = 10;
const MAX_LOGO = 500;

function teamLabel(team: TeamWithUsage): string {
  return team.shortName ? `${team.name} (${team.shortName})` : team.name;
}

function TeamLogoMark({ logo, name }: { logo: string | null; name: string }) {
  if (!logo) {
    return (
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary"
        aria-label={name}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <div
      className="h-10 w-10 shrink-0 rounded-lg bg-cover bg-center"
      style={{ backgroundImage: `url(${logo})` }}
      role="img"
      aria-label={name}
    />
  );
}

export default function TeamsManager({ teams, initialError }: TeamsManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TeamWithUsage | null>(null);
  const [deleting, setDeleting] = useState<TeamWithUsage | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return teams;
    return teams.filter((team) => teamLabel(team).toLocaleLowerCase().includes(query));
  }, [teams, search]);

  function openCreate() {
    setForm(emptyForm);
    setFormError(null);
    setCreating(true);
  }

  function openEdit(team: TeamWithUsage) {
    setForm({
      name: team.name,
      shortName: team.shortName ?? "",
      logo: team.logo ?? "",
    });
    setFormError(null);
    setEditing(team);
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
    const shortName = form.shortName.trim() || null;
    const logo = form.logo.trim() || null;
    if (editing) {
      void runAction(
        () => updateTeamAction(editing.id, { name, shortName, logo }),
        "Equipo actualizado.",
      );
    } else {
      void runAction(() => createTeamAction({ name, shortName, logo }), "Equipo creado.");
    }
  }

  function handleDelete(team: TeamWithUsage) {
    void runAction(() => deleteTeamAction(team.id), "Equipo eliminado.");
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
            placeholder="Buscar equipo..."
          />
        </div>
        <Button type="button" onClick={openCreate}>
          + Nuevo equipo
        </Button>
      </div>

      {initialError ? (
        <EmptyState
          icon="!"
          title="No se pudieron cargar los equipos"
          description={initialError}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="?"
          title={search ? "Sin resultados" : "Aún no hay equipos"}
          description={
            search
              ? "Ningún equipo coincide con la búsqueda."
              : "Registra equipos para asignar a las parejas."
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((team) => (
            <div
              key={team.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-surface/50 bg-surface p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <TeamLogoMark logo={team.logo} name={team.name} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{team.name}</p>
                  <div className="mt-2">
                    {team.assigned ? (
                      <Badge variant="primary">Asignado</Badge>
                    ) : (
                      <Badge variant="default">Disponible</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(team)}
                >
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="hover:bg-error/10 hover:text-error"
                  onClick={() => setDeleting(team)}
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
        title={editing ? "Editar equipo" : "Nuevo equipo"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            id="team-name"
            label="Nombre"
            value={form.name}
            onChange={(name) => setForm((f) => ({ ...f, name }))}
            maxLength={MAX_NAME}
            placeholder="Nombre del equipo"
            autoFocus
          />
          <TextField
            id="team-shortname"
            label="Abreviatura (opcional)"
            value={form.shortName}
            onChange={(shortName) => setForm((f) => ({ ...f, shortName }))}
            maxLength={MAX_SHORT_NAME}
            placeholder="Ej: RMA"
          />
          <TextField
            id="team-logo"
            label="Logo (opcional)"
            value={form.logo}
            onChange={(logo) => setForm((f) => ({ ...f, logo }))}
            maxLength={MAX_LOGO}
            placeholder="URL de imagen del logo"
          />
          {formError && <p className="text-sm text-error">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeModal} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : editing ? "Guardar cambios" : "Crear equipo"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Eliminar equipo">
        {deleting && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted">
              ¿Eliminar a{" "}
              <span className="font-medium text-foreground">{teamLabel(deleting)}</span>?
              {deleting.assigned && (
                <span className="mt-1 block text-error">
                  Está asignado a una pareja: para eliminarlo, primero quita esa asignación.
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
                disabled={pending || deleting.assigned}
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