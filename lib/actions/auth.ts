"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { assertAdminSession, getAdminPassword, getAuthSecret, getSessionCookieOptions, startAdminSession } from "@/lib/auth";
import { SESSION_COOKIE, constantTimeEqual, getSessionTtlSeconds } from "@/lib/session-core";

export interface LoginActionState {
  error?: string;
}

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const password = String(formData.get("password") ?? "");

  let expected: string;
  try {
    expected = getAdminPassword();
  } catch {
    return { error: "La autenticación aún no está configurada." };
  }
  if (!password || !constantTimeEqual(password, expected)) {
    return { error: "Contraseña incorrecta." };
  }

  try {
    getAuthSecret();
  } catch {
    return { error: "La autenticación aún no está configurada." };
  }

  const ttl = getSessionTtlSeconds();
  const token = startAdminSession();
  const store = await cookies();
  store.set(SESSION_COOKIE, token, getSessionCookieOptions(ttl));

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await assertAdminSession();
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}