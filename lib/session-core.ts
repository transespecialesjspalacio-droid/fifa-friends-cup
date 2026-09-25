import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "ffc_admin_session";
export const DEFAULT_SESSION_HOURS = 168;

export interface SessionCookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  maxAge: number;
}

const MAC_PREFIX = "ffc-session-v1";

const ADMIN_SESSION_HOURS_ENV = "ADMIN_SESSION_HOURS";

export function getSessionTtlSeconds(): number {
  const raw = process.env[ADMIN_SESSION_HOURS_ENV];
  if (!raw) return DEFAULT_SESSION_HOURS * 60 * 60;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_SESSION_HOURS * 60 * 60;
  return Math.round(parsed * 60 * 60);
}

export function getSessionCookieOptions(
  ttlSeconds: number,
  isProduction: boolean = process.env.NODE_ENV === "production",
): SessionCookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: ttlSeconds,
  };
}

export function createSessionToken(
  secret: string,
  ttlSeconds: number,
  nowMs: number = Date.now(),
): { token: string; expiresAt: number } {
  const expiresSeconds = Math.floor(nowMs / 1000) + ttlSeconds;
  const signature = sign(secret, expiresSeconds);
  return {
    token: `${expiresSeconds}.${signature}`,
    expiresAt: expiresSeconds * 1000,
  };
}

export function verifySessionToken(
  token: string | undefined,
  secret: string,
  nowMs: number = Date.now(),
): boolean {
  if (!token) return false;
  const [expiryRaw, signature] = token.split(".");
  if (!expiryRaw || !signature || token.indexOf(".") !== token.lastIndexOf(".")) return false;
  const expiry = Number(expiryRaw);
  if (!Number.isFinite(expiry)) return false;
  if (expiry <= Math.floor(nowMs / 1000)) return false;
  return safeEqualHex(signature, sign(secret, expiry));
}

export function constantTimeEqual(a: string, b: string): boolean {
  return safeEqualHex(sha256(a), sha256(b));
}

function sign(secret: string, expiresSeconds: number): string {
  return createHmac("sha256", secret)
    .update(`${MAC_PREFIX}.${expiresSeconds}`, "utf8")
    .digest("hex");
}

function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "hex");
  const bufferB = Buffer.from(b, "hex");
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}