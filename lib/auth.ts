import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  createSessionToken,
  getSessionTtlSeconds,
  getSessionCookieOptions,
  verifySessionToken,
  type SessionCookieOptions,
} from "@/lib/session-core";

export { getSessionCookieOptions };
export type { SessionCookieOptions };

export function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD no está configurado.");
  return password;
}

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) throw new Error("AUTH_SECRET no está configurado.");
  return secret;
}

export function startAdminSession(): string {
  const secret = getAuthSecret();
  const ttl = getSessionTtlSeconds();
  const { token } = createSessionToken(secret, ttl);
  return token;
}

export async function assertAdminSession(): Promise<void> {
  const secret = process.env.AUTH_SECRET?.trim();
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (secret && session && verifySessionToken(session, secret)) return;
  redirect("/login");
}