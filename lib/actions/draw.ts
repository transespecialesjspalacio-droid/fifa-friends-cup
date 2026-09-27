"use server";

import { revalidatePath } from "next/cache";
import { assertAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { runNewDraw, type DrawDeps, type DrawResult } from "@/lib/services/draw-run";
import type { ServiceResult } from "@/lib/services/result";

export async function runNewDrawAction(): Promise<ServiceResult<DrawResult>> {
  await assertAdminSession();

  const result = await runNewDraw({
    db: db as unknown as DrawDeps["db"],
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