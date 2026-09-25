"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";
import { NAV_ITEMS, isActive } from "@/components/layout/nav";

function HamburgerIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" x2="6" y1="6" y2="18" />
      <line x1="6" x2="18" y1="6" y2="18" />
    </svg>
  );
}

function navLinkClass(active: boolean): string {
  return `flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
    active
      ? "bg-primary/10 text-primary"
      : "text-muted hover:bg-primary/5 hover:text-primary"
  }`;
}

export default function MobileNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-surface-secondary md:hidden"
        aria-label="Abrir menú"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen(true)}
      >
        <HamburgerIcon />
      </button>

      {open &&
        createPortal(
          <div
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex h-dvh w-screen flex-col overflow-y-auto bg-background md:hidden"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-surface/50 bg-surface px-4 py-3 sm:px-6">
              <span className="truncate text-lg font-bold text-primary">
                FIFA FRIENDS CUP
              </span>
              <button
                type="button"
                aria-label="Cerrar menú"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-surface-secondary"
                onClick={close}
              >
                <CloseIcon />
              </button>
            </div>

            <nav
              aria-label="Navegación principal"
              className="flex flex-1 flex-col gap-1 p-4 sm:p-6"
            >
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  aria-current={isActive(pathname, searchParams, item.href) ? "page" : undefined}
                  className={navLinkClass(isActive(pathname, searchParams, item.href))}
                >
                  {item.label}
                </Link>
              ))}

              <Link
                href="/admin"
                onClick={close}
                className="mt-2 flex items-center rounded-lg px-3 py-3 text-sm font-medium text-muted transition-colors hover:bg-primary/5 hover:text-primary"
              >
                Admin
              </Link>
            </nav>

            <div className="shrink-0 border-t border-surface/50 px-4 py-4 text-xs uppercase tracking-wider text-muted sm:px-6">
              Versión 0.2
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}