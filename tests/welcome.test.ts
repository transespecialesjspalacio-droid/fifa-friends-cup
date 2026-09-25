import { test } from "node:test";
import assert from "node:assert/strict";

import { RESULT_SAVED_DESTINATION } from "@/lib/navigation";
import {
  hasSessionMark,
  HOME_ENTERED_SESSION_KEY,
  HOME_ENTERED_SESSION_VALUE,
  setSessionMark,
  shouldShowWelcome,
} from "@/lib/welcome";

class FakeSessionStorage {
  readonly map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key) ?? null : null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

test("1. Sin marca de sesión: se muestra la Welcome Screen", () => {
  const storage = new FakeSessionStorage();
  assert.equal(hasSessionMark(storage), false);
  assert.equal(shouldShowWelcome(hasSessionMark(storage)), true);
});

test("2. Después de INGRESAR: queda la marca en sessionStorage", () => {
  const storage = new FakeSessionStorage();
  setSessionMark(storage);
  assert.equal(storage.getItem(HOME_ENTERED_SESSION_KEY), HOME_ENTERED_SESSION_VALUE);
  assert.equal(hasSessionMark(storage), true);
});

test("3. Con marca de sesión: se muestra el Dashboard (sin bienvenida)", () => {
  const storage = new FakeSessionStorage();
  setSessionMark(storage);
  assert.equal(shouldShowWelcome(hasSessionMark(storage)), false);
});

test("4. Refresh con marca (sessionStorage persiste): se mantiene en el Dashboard", () => {
  const storage = new FakeSessionStorage();
  setSessionMark(storage);
  // El refresh reutiliza el mismo sessionStorage de la pestaña.
  assert.equal(hasSessionMark(storage), true);
  assert.equal(shouldShowWelcome(hasSessionMark(storage)), false);
});

test("5. Guardar resultado → '/' → Dashboard (la sesión ya fue iniciada)", () => {
  const storage = new FakeSessionStorage();
  setSessionMark(storage);
  assert.equal(RESULT_SAVED_DESTINATION, "/");
  assert.equal(shouldShowWelcome(hasSessionMark(storage)), false);
});

test("6. Nueva sesión del navegador (sessionStorage vacío): Welcome Screen nuevamente", () => {
  const freshStorage = new FakeSessionStorage();
  assert.equal(hasSessionMark(freshStorage), false);
  assert.equal(shouldShowWelcome(hasSessionMark(freshStorage)), true);
});