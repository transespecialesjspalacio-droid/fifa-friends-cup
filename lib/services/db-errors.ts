import { fail, type ServiceResult } from "@/lib/services/result";

function isKnownRequestError(e: unknown): e is { code: string } {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    typeof (e as { code?: unknown }).code === "string"
  );
}

export function mapDbError(e: unknown, fallback: string): ServiceResult<never> {
  if (isKnownRequestError(e) && e.code === "P2002") {
    return fail("Ya existe un registro con esos datos.", "DUPLICATE");
  }
  return fail(fallback, "DATABASE");
}