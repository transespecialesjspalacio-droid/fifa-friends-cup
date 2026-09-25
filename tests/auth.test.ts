import assert from "node:assert/strict";
import { test } from "node:test";
import {
  constantTimeEqual,
  createSessionToken,
  getSessionCookieOptions,
  getSessionTtlSeconds,
  verifySessionToken,
} from "@/lib/session-core";

const SECRET = "a-strong-secret-for-tests-0123456789";

test("Un token recién creado se verifica como sesión válida", () => {
  const { token } = createSessionToken(SECRET, 3600);
  assert.equal(verifySessionToken(token, SECRET), true);
});

test("Un token con la firma alterada se rechaza", () => {
  const { token } = createSessionToken(SECRET, 3600);
  const tampered = `${token.slice(0, -2)}aa`;
  assert.equal(verifySessionToken(tampered, SECRET), false);
});

test("Un token con otra clave secreta se rechaza", () => {
  const { token } = createSessionToken(SECRET, 3600);
  assert.equal(verifySessionToken(token, "otra-clave-diferente"), false);
});

test("Un token expirado se rechaza incluso con firma válida", () => {
  const now = Date.now();
  const { token } = createSessionToken(SECRET, 60, now - 3600_000);
  assert.equal(verifySessionToken(token, SECRET, now), false);
});

test("Tokens malformados o vacíos se rechazan", () => {
  assert.equal(verifySessionToken(undefined, SECRET), false);
  assert.equal(verifySessionToken("", SECRET), false);
  assert.equal(verifySessionToken("solo.texto.invalido", SECRET), false);
  assert.equal(verifySessionToken("abc.def.ghi", SECRET), false);
  assert.equal(verifySessionToken("not-a-valid-expiry.garbage", SECRET), false);
});

test("constantTimeEqual compara contraseñas sin filtrar longitud", () => {
  assert.equal(constantTimeEqual("secreto", "secreto"), true);
  assert.equal(constantTimeEqual("secreto", "secreto2"), false);
  assert.equal(constantTimeEqual("corta", "una-contraseña-mucho-más-larga"), false);
  assert.equal(constantTimeEqual("", "algo"), false);
  assert.equal(constantTimeEqual("", ""), true);
});

test("getSessionTtlSeconds usa el default cuando no hay entorno", () => {
  const previous = process.env.ADMIN_SESSION_HOURS;
  delete process.env.ADMIN_SESSION_HOURS;
  try {
    assert.equal(getSessionTtlSeconds(), 168 * 60 * 60);
  } finally {
    if (previous === undefined) {
      delete process.env.ADMIN_SESSION_HOURS;
    } else {
      process.env.ADMIN_SESSION_HOURS = previous;
    }
  }
});

test("getSessionTtlSeconds respeta ADMIN_SESSION_HOURS", () => {
  const previous = process.env.ADMIN_SESSION_HOURS;
  process.env.ADMIN_SESSION_HOURS = "2";
  try {
    assert.equal(getSessionTtlSeconds(), 2 * 60 * 60);
  } finally {
    if (previous === undefined) {
      delete process.env.ADMIN_SESSION_HOURS;
    } else {
      process.env.ADMIN_SESSION_HOURS = previous;
    }
  }
});

test("La cookie de sesión es HttpOnly, SameSite lax y con expiración en desarrollo", () => {
  const options = getSessionCookieOptions(3600, false);
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.path, "/");
  assert.equal(options.maxAge, 3600);
  assert.equal(options.secure, false);
});

test("La cookie de sesión es Secure en producción", () => {
  const options = getSessionCookieOptions(3600, true);
  assert.equal(options.secure, true);
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, "lax");
});