"use server";

import { assertAdminSession } from "@/lib/auth";
import type { ServiceResult } from "@/lib/services/result";
import {
  createTeam,
  deleteTeam,
  updateTeam,
  type TeamCreateInput,
  type TeamUpdateInput,
} from "@/lib/services/teams";

export async function createTeamAction(
  input: TeamCreateInput,
): Promise<ServiceResult<unknown>> {
  await assertAdminSession();
  return createTeam(input);
}

export async function updateTeamAction(
  id: string,
  input: TeamUpdateInput,
): Promise<ServiceResult<unknown>> {
  await assertAdminSession();
  return updateTeam(id, input);
}

export async function deleteTeamAction(
  id: string,
): Promise<ServiceResult<{ id: string }>> {
  await assertAdminSession();
  return deleteTeam(id);
}