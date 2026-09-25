import { MatchStage } from "@/prisma/generated/prisma/enums";
import { fail, ok, type ServiceResult } from "@/lib/services/result";

export const allowsPenalties = (stage: string): boolean =>
  stage === MatchStage.SEMIFINAL || stage === MatchStage.FINAL;

export interface ValidateResultInput {
  stage: string;
  homeGoals: number;
  awayGoals: number;
  penaltiesHomeGoals: number | null | undefined;
  penaltiesAwayGoals: number | null | undefined;
}

const isNonNegativeInteger = (value: number): boolean =>
  Number.isInteger(value) && value >= 0;

export function validateResultOutcome(
  input: ValidateResultInput,
): ServiceResult<{ usesPenalties: boolean }> {
  const { stage, homeGoals, awayGoals } = input;
  const penaltiesHomeGoals = input.penaltiesHomeGoals ?? null;
  const penaltiesAwayGoals = input.penaltiesAwayGoals ?? null;

  if (!isNonNegativeInteger(homeGoals) || !isNonNegativeInteger(awayGoals)) {
    return fail("Los marcadores deben ser números enteros no negativos.", "INVALID_GOALS");
  }

  const hasPenalties = penaltiesHomeGoals !== null || penaltiesAwayGoals !== null;

  if (hasPenalties && !allowsPenalties(stage)) {
    return fail("No se permiten penales en esta fase.", "PENALTIES_NOT_ALLOWED");
  }

  if (hasPenalties) {
    if (penaltiesHomeGoals === null || penaltiesAwayGoals === null) {
      return fail("Ambos resultados de penales son obligatorios.", "INVALID_PENALTIES");
    }
    if (
      !isNonNegativeInteger(penaltiesHomeGoals) ||
      !isNonNegativeInteger(penaltiesAwayGoals)
    ) {
      return fail("Los penales deben ser números enteros no negativos.", "INVALID_PENALTIES");
    }
    if (penaltiesHomeGoals === penaltiesAwayGoals) {
      return fail("La tanda de penales no puede terminar empatada.", "PENALTIES_TIE");
    }
  }

  const isTie = homeGoals === awayGoals;

  if (isTie) {
    if (allowsPenalties(stage)) {
      if (!hasPenalties) {
        return fail(
          "En semifinales y final, el empate en goles se resuelve por penales: cargá los resultados de la tanda.",
          "KNOCKOUT_DRAW",
        );
      }
      return ok({ usesPenalties: true });
    }
    if (stage === MatchStage.THIRD_PLACE) {
      return fail(
        "El partido por el tercer puesto no puede terminar empatado: aún no se definió un mecanismo de desempate.",
        "KNOCKOUT_DRAW",
      );
    }
    if (stage === MatchStage.GROUP) {
      return ok({ usesPenalties: false });
    }
    return fail("En fase eliminatoria el partido no puede terminar empatado.", "KNOCKOUT_DRAW");
  }

  if (hasPenalties) {
    return fail("Con goles diferentes no se registran penales.", "PENALTIES_NOT_REQUIRED");
  }

  return ok({ usesPenalties: false });
}