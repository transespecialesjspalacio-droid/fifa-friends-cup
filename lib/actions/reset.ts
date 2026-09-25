"use server";

import { revalidatePath } from "next/cache";
import { assertAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resetTournament, type ResetDeps, type ResetResult } from "@/lib/services/reset";
import type { ServiceResult } from "@/lib/services/result";

export async function resetTournamentAction(): Promise<ServiceResult<ResetResult>> {
  await assertAdminSession();

  const result = await resetTournament({
    db: db as unknown as ResetDeps["db"],
    authorize: () => assertAdminSession(),
  });

  if (result.ok) {
    revalidatePath("/admin");
    revalidatePath("/admin/sorteo");
    revalidatePath("/admin/resultados");
    revalidatePath("/fase-final");
    revalidatePath("/torneo");
    revalidatePath("/");
  }

  return result;
}