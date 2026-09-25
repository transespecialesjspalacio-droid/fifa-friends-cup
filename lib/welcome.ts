export const HOME_ENTERED_SESSION_KEY = "ffc_home_entered_session";
export const HOME_ENTERED_SESSION_VALUE = "1";

export interface SessionMarkStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function hasSessionMark(storage: SessionMarkStorage | null | undefined): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(HOME_ENTERED_SESSION_KEY) === HOME_ENTERED_SESSION_VALUE;
  } catch {
    return false;
  }
}

export function setSessionMark(storage: SessionMarkStorage | null | undefined): void {
  if (!storage) return;
  try {
    storage.setItem(HOME_ENTERED_SESSION_KEY, HOME_ENTERED_SESSION_VALUE);
  } catch {
    // Almacenamiento no disponible: la bienvenida se seguirá mostrando.
  }
}

export function shouldShowWelcome(hasMark: boolean): boolean {
  return !hasMark;
}