"use client";

import { useEffect, useSyncExternalStore, useState } from "react";
import WelcomeHero, { type WelcomeStatus } from "@/components/dashboard/WelcomeHero";
import { setSessionMark, hasSessionMark } from "@/lib/welcome";

const FADE_MS = 500;

let sessionMark: boolean | null = null;
let resolved = false;
const listeners = new Set<() => void>();

function sessionStorageOrNull(): Storage | null {
  if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") {
    return null;
  }
  return window.sessionStorage;
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

function getSnapshot(): boolean {
  if (sessionMark !== null) return sessionMark;
  // Durante la hidratación devuelve false para coincidir con el SSR (bienvenida visible).
  return false;
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function resolveSessionMark(): void {
  if (resolved) return;
  resolved = true;
  sessionMark = hasSessionMark(sessionStorageOrNull());
  if (sessionMark) emit();
}

function markEntered(): void {
  resolved = true;
  setSessionMark(sessionStorageOrNull());
  if (sessionMark !== true) {
    sessionMark = true;
    emit();
  }
}

export interface HomeEntryProps {
  status: WelcomeStatus;
  participantCount: number;
  pairCount: number;
  groupCount: number;
  children: React.ReactNode;
}

export default function HomeEntry({
  status,
  participantCount,
  pairCount,
  groupCount,
  children,
}: HomeEntryProps) {
  const entered = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [welcomeGone, setWelcomeGone] = useState(false);

  useEffect(() => {
    resolveSessionMark();
  }, []);

  useEffect(() => {
    if (!entered) return;
    const id = window.setTimeout(() => setWelcomeGone(true), FADE_MS);
    return () => window.clearTimeout(id);
  }, [entered]);

  function handleEnter() {
    markEntered();
  }

  const showOverlay = !welcomeGone;

  return (
    <>
      {showOverlay && (
        <div
          aria-hidden={entered}
          className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-background transition-opacity duration-500 ease-out ${
            entered ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <WelcomeHero
            status={status}
            participantCount={participantCount}
            pairCount={pairCount}
            groupCount={groupCount}
            onEnter={handleEnter}
          />
        </div>
      )}

      {entered && <div className="animate-entry-in">{children}</div>}
    </>
  );
}