"use server";

import { assertAdminSession } from "@/lib/auth";
import {
  createParticipant,
  deleteParticipant,
  updateParticipant,
  type ParticipantCreateInput,
  type ParticipantUpdateInput,
} from "@/lib/services/participants";
import type { ServiceResult } from "@/lib/services/result";

export async function createParticipantAction(
  input: ParticipantCreateInput,
): Promise<ServiceResult<unknown>> {
  await assertAdminSession();
  return createParticipant(input);
}

export async function updateParticipantAction(
  id: string,
  input: ParticipantUpdateInput,
): Promise<ServiceResult<unknown>> {
  await assertAdminSession();
  return updateParticipant(id, input);
}

export async function deleteParticipantAction(
  id: string,
): Promise<ServiceResult<{ id: string }>> {
  await assertAdminSession();
  return deleteParticipant(id);
}