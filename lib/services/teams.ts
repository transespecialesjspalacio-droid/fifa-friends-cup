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
import type { Team } from "@/prisma/generated/prisma/client";

export interface TeamCreateInput {
  name: string;
  shortName?: string | null;
  logo?: string | null;
}

export interface TeamUpdateInput {
  name?: string;
  shortName?: string | null;
  logo?: string | null;
}

function validateId(id: string): ValidationError | null {
  if (typeof id !== "string" || id.trim().length === 0) {
    return { field: "id", message: "ID inválido." };
  }
  return null;
}

export async function createTeam(input: TeamCreateInput): Promise<ServiceResult<Team>> {
  const name = normalizeRequiredString(input.name, "name", limits.name, "Nombre");
  if (!name.ok) return validationFailure([name.error]);

  const shortName = normalizeOptionalString(
    input.shortName,
    "shortName",
    limits.shortName,
    "Abreviatura",
  );
  if (!shortName.ok) return validationFailure([shortName.error]);

  const logo = normalizeOptionalString(input.logo, "logo", limits.logo, "Logo");
  if (!logo.ok) return validationFailure([logo.error]);

  try {
    const duplicate = await db.team.findFirst({
      where: { name: { equals: name.value, mode: "insensitive" } },
      select: { id: true },
    });
    if (duplicate) {
      return fail("Ya existe un equipo con ese nombre.", "DUPLICATE");
    }

    const team = await db.team.create({
      data: { name: name.value, shortName: shortName.value, logo: logo.value },
    });
    return ok(team);
  } catch (e) {
    return mapDbError(e, "No se pudo crear el equipo.");
  }
}

export async function listTeams(): Promise<ServiceResult<Team[]>> {
  try {
    const teams = await db.team.findMany({
      orderBy: { name: "asc" },
    });
    return ok(teams);
  } catch (e) {
    return mapDbError(e, "No se pudieron listar los equipos.");
  }
}

export async function getTeamById(id: string): Promise<ServiceResult<Team>> {
  const idError = validateId(id);
  if (idError) return validationFailure([idError]);

  try {
    const team = await db.team.findUnique({ where: { id } });
    if (!team) {
      return fail("Equipo no encontrado.", "NOT_FOUND");
    }
    return ok(team);
  } catch (e) {
    return mapDbError(e, "No se pudo obtener el equipo.");
  }
}

export async function updateTeam(
  id: string,
  input: TeamUpdateInput,
): Promise<ServiceResult<Team>> {
  const idError = validateId(id);
  if (idError) return validationFailure([idError]);

  try {
    const existing = await db.team.findUnique({ where: { id } });
    if (!existing) {
      return fail("Equipo no encontrado.", "NOT_FOUND");
    }

    const data: { name?: string; shortName?: string | null; logo?: string | null } = {};

    if (input.name !== undefined) {
      const name = normalizeRequiredString(input.name, "name", limits.name, "Nombre");
      if (!name.ok) return validationFailure([name.error]);

      if (name.value !== existing.name) {
        const duplicate = await db.team.findFirst({
          where: { name: { equals: name.value, mode: "insensitive" }, id: { not: id } },
          select: { id: true },
        });
        if (duplicate) {
          return fail("Ya existe un equipo con ese nombre.", "DUPLICATE");
        }
      }
      data.name = name.value;
    }

    if (input.shortName !== undefined) {
      const shortName = normalizeOptionalString(
        input.shortName,
        "shortName",
        limits.shortName,
        "Abreviatura",
      );
      if (!shortName.ok) return validationFailure([shortName.error]);
      data.shortName = shortName.value;
    }

    if (input.logo !== undefined) {
      const logo = normalizeOptionalString(
        input.logo,
        "logo",
        limits.logo,
        "Logo",
      );
      if (!logo.ok) return validationFailure([logo.error]);
      data.logo = logo.value;
    }

    if (Object.keys(data).length === 0) {
      return fail("No hay campos para actualizar.", "VALIDATION");
    }

    const team = await db.team.update({ where: { id }, data });
    return ok(team);
  } catch (e) {
    return mapDbError(e, "No se pudo actualizar el equipo.");
  }
}

export async function deleteTeam(id: string): Promise<ServiceResult<{ id: string }>> {
  const idError = validateId(id);
  if (idError) return validationFailure([idError]);

  try {
    const existing = await db.team.findUnique({ where: { id } });
    if (!existing) {
      return fail("Equipo no encontrado.", "NOT_FOUND");
    }

    const pairsCount = await db.pair.count({
      where: { teamId: id },
    });
    if (pairsCount > 0) {
      return fail(
        `No se puede eliminar: el equipo está asignado a ${pairsCount} pareja(s).`,
        "IN_USE",
      );
    }

    await db.team.delete({ where: { id } });
    return ok({ id });
  } catch (e) {
    return mapDbError(e, "No se pudo eliminar el equipo.");
  }
}

export interface TeamWithUsage extends Team {
  assigned: boolean;
}

export async function listTeamsWithUsage(): Promise<ServiceResult<TeamWithUsage[]>> {
  try {
    const rows = await db.team.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { pairs: true } },
      },
    });
    return ok(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        shortName: row.shortName,
        logo: row.logo,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        assigned: row._count.pairs > 0,
      })),
    );
  } catch (e) {
    return mapDbError(e, "No se pudieron listar los equipos.");
  }
}