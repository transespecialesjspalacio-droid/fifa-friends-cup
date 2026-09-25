"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdminSession } from "@/lib/auth";
import { ensureKnockoutStage } from "@/lib/services/knockout";
import { saveMatchResult } from "@/lib/services/results";
import { RESULT_SAVED_DESTINATION } from "@/lib/navigation";

export interface MatchResultActionState {
  error?: string;
}

function parseGoals(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  return Number(raw);
}

export async function saveMatchResultAction(
  _prevState: MatchResultActionState,
  formData: FormData,
): Promise<MatchResultActionState> {
  await assertAdminSession();

  const matchId = String(formData.get("matchId") ?? "").trim();
  const homeGoals = parseGoals(String(formData.get("homeGoals") ?? "").trim());
  const awayGoals = parseGoals(String(formData.get("awayGoals") ?? "").trim());

  if (!matchId) return { error: "No se identificó el partido." };
  if (homeGoals === null || awayGoals === null) {
    return { error: "Ambos marcadores son obligatorios y deben ser números enteros no negativos." };
  }

  const rawHomePenalties = String(formData.get("penaltiesHomeGoals") ?? "").trim();
  const rawAwayPenalties = String(formData.get("penaltiesAwayGoals") ?? "").trim();
  const penaltiesHomeGoals = rawHomePenalties === "" ? null : parseGoals(rawHomePenalties);
  const penaltiesAwayGoals = rawAwayPenalties === "" ? null : parseGoals(rawAwayPenalties);
  if (
    (rawHomePenalties !== "" && penaltiesHomeGoals === null) ||
    (rawAwayPenalties !== "" && penaltiesAwayGoals === null)
  ) {
    return { error: "Los penales deben ser números enteros no negativos." };
  }

  const result = await saveMatchResult(
    matchId,
    homeGoals,
    awayGoals,
    penaltiesHomeGoals,
    penaltiesAwayGoals,
  );
  if (!result.ok) return { error: result.error };

  await ensureKnockoutStage();

  revalidatePath("/admin/resultados");
  revalidatePath("/torneo");
  revalidatePath("/fase-final");
  revalidatePath("/admin");
  revalidatePath("/");

  redirect(RESULT_SAVED_DESTINATION);
}