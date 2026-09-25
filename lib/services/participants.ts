import { db } from "@/lib/db";
import { mapDbError } from "@/lib/services/db-errors";
import { fail, ok, type ServiceResult } from "@/lib/services/result";
import {
  limits,
  normalizeOptionalString,
  normalizeRequiredString,
  validationFailure,
  type ValidationError,
} from "@/lib/services/validation";
import type { Participant } from "@/prisma/generated/prisma/client";

export interface ParticipantCreateInput {
  name: string;
  nickname?: string | null;
}

export interface ParticipantUpdateInput {
  name?: string;
  nickname?: string | null;
}

function validateId(id: string): ValidationError | null {
  if (typeof id !== "string" || id.trim().length === 0) {
    return { field: "id", message: "ID inválido." };
  }
  return null;
}

export async function createParticipant(
  input: ParticipantCreateInput,
): Promise<ServiceResult<Participant>> {
  const name = normalizeRequiredString(input.name, "name", limits.name, "Nombre");
  if (!name.ok) return validationFailure([name.error]);

  const nickname = normalizeOptionalString(
    input.nickname,
    "nickname",
    limits.nickname,
    "Apodo",
  );
  if (!nickname.ok) return validationFailure([nickname.error]);

  try {
    const duplicate = await db.participant.findFirst({
      where: { name: { equals: name.value, mode: "insensitive" } },
      select: { id: true },
    });
    if (duplicate) {
      return fail("Ya existe un participante con ese nombre.", "DUPLICATE");
    }

    const participant = await db.participant.create({
      data: { name: name.value, nickname: nickname.value },
    });
    return ok(participant);
  } catch (e) {
    return mapDbError(e, "No se pudo crear el participante.");
  }
}

export async function listParticipants(): Promise<ServiceResult<Participant[]>> {
  try {
    const participants = await db.participant.findMany({
      orderBy: { name: "asc" },
    });
    return ok(participants);
  } catch (e) {
    return mapDbError(e, "No se pudieron listar los participantes.");
  }
}

export async function getParticipantById(
  id: string,
): Promise<ServiceResult<Participant>> {
  const idError = validateId(id);
  if (idError) return validationFailure([idError]);

  try {
    const participant = await db.participant.findUnique({ where: { id } });
    if (!participant) {
      return fail("Participante no encontrado.", "NOT_FOUND");
    }
    return ok(participant);
  } catch (e) {
    return mapDbError(e, "No se pudo obtener el participante.");
  }
}

export async function updateParticipant(
  id: string,
  input: ParticipantUpdateInput,
): Promise<ServiceResult<Participant>> {
  const idError = validateId(id);
  if (idError) return validationFailure([idError]);

  try {
    const existing = await db.participant.findUnique({ where: { id } });
    if (!existing) {
      return fail("Participante no encontrado.", "NOT_FOUND");
    }

    const data: { name?: string; nickname?: string | null } = {};

    if (input.name !== undefined) {
      const name = normalizeRequiredString(input.name, "name", limits.name, "Nombre");
      if (!name.ok) return validationFailure([name.error]);

      if (name.value !== existing.name) {
        const duplicate = await db.participant.findFirst({
          where: { name: { equals: name.value, mode: "insensitive" }, id: { not: id } },
          select: { id: true },
        });
        if (duplicate) {
          return fail("Ya existe un participante con ese nombre.", "DUPLICATE");
        }
      }
      data.name = name.value;
    }

    if (input.nickname !== undefined) {
      const nickname = normalizeOptionalString(
        input.nickname,
        "nickname",
        limits.nickname,
        "Apodo",
      );
      if (!nickname.ok) return validationFailure([nickname.error]);
      data.nickname = nickname.value;
    }

    if (Object.keys(data).length === 0) {
      return fail("No hay campos para actualizar.", "VALIDATION");
    }

    const participant = await db.participant.update({ where: { id }, data });
    return ok(participant);
  } catch (e) {
    return mapDbError(e, "No se pudo actualizar el participante.");
  }
}

export async function deleteParticipant(
  id: string,
): Promise<ServiceResult<{ id: string }>> {
  const idError = validateId(id);
  if (idError) return validationFailure([idError]);

  try {
    const existing = await db.participant.findUnique({ where: { id } });
    if (!existing) {
      return fail("Participante no encontrado.", "NOT_FOUND");
    }

    const pairsCount = await db.pair.count({
      where: { OR: [{ participant1Id: id }, { participant2Id: id }] },
    });
    if (pairsCount > 0) {
      return fail(
        `No se puede eliminar: el participante está asignado a ${pairsCount} pareja(s).`,
        "IN_USE",
      );
    }

    await db.participant.delete({ where: { id } });
    return ok({ id });
  } catch (e) {
    return mapDbError(e, "No se pudo eliminar el participante.");
  }
}

export interface ParticipantWithUsage extends Participant {
  inPair: boolean;
}

export async function listParticipantsWithUsage(): Promise<
  ServiceResult<ParticipantWithUsage[]>
> {
  try {
    const rows = await db.participant.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { pairsAsFirst: true, pairsAsSecond: true } },
      },
    });
    return ok(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        nickname: row.nickname,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        inPair: row._count.pairsAsFirst + row._count.pairsAsSecond > 0,
      })),
    );
  } catch (e) {
    return mapDbError(e, "No se pudieron listar los participantes.");
  }
}