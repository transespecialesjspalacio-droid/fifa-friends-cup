import { fail, type ServiceResult } from "@/lib/services/result";

export interface ValidationError {
  field: string;
  message: string;
}

export const limits = {
  name: 100,
  nickname: 100,
  shortName: 20,
  logo: 2048,
} as const;

export function normalizeRequiredString(
  value: unknown,
  field: string,
  maxLength: number,
  label: string,
): { ok: true; value: string } | { ok: false; error: ValidationError } {
  if (typeof value !== "string") {
    return { ok: false, error: { field, message: `${label} es obligatorio.` } };
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: { field, message: `${label} no puede estar vacío.` } };
  }
  if (trimmed.length > maxLength) {
    return {
      ok: false,
      error: { field, message: `${label} no puede superar ${maxLength} caracteres.` },
    };
  }
  return { ok: true, value: trimmed };
}

export function normalizeOptionalString(
  value: unknown,
  field: string,
  maxLength: number,
  label: string,
): { ok: true; value: string | null } | { ok: false; error: ValidationError } {
  if (value === undefined) {
    return { ok: true, value: null };
  }
  if (value === null) {
    return { ok: true, value: null };
  }
  if (typeof value !== "string") {
    return { ok: false, error: { field, message: `${label} debe ser texto.` } };
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { ok: true, value: null };
  }
  if (trimmed.length > maxLength) {
    return {
      ok: false,
      error: { field, message: `${label} no puede superar ${maxLength} caracteres.` },
    };
  }
  return { ok: true, value: trimmed };
}

export function validationFailure(errors: ValidationError[]): ServiceResult<never> {
  return fail(
    errors.map((error) => error.message).join(" "),
    "VALIDATION",
  );
}