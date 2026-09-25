"use server";

import { assertAdminSession } from "@/lib/auth";
import { runDraw, type DrawResult } from "@/lib/services/draw-run";
import type { ServiceResult } from "@/lib/services/result";

export async function executeDrawAction(): Promise<ServiceResult<DrawResult>> {
  await assertAdminSession();
  return runDraw();
}