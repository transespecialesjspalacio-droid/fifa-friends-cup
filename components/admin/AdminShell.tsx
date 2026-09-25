"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/lib/actions/auth";

const ADMIN_NAV = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/participantes", label: "Participantes" },
  { href: "/admin/equipos", label: "Equipos" },
  { href: "/admin/sorteo", label: "Sorteo" },
  { href: "/fase-final", label: "Fase Final" },
  { href: "/admin/resultados", label: "Resultados" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navItemClass(active: boolean): string {
  return `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    active ? "bg-primary/10 text-primary" : "text-muted hover:bg-primary/5 hover:text-primary"
  }`;
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-surface/50 bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-lg font-bold text-primary">FIFA FRIENDS CUP</span>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-primary">
              Admin
            </span>
          </Link>

<nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Navegación administrativa"
          >
            {ADMIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navItemClass(isActive(pathname, item.href))}
              >
                {item.label}
              </Link>
            ))}
<Link
              href="/torneo"
              className="ml-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-primary"
            >
              Ver torneo
            </Link>
            <form action={logoutAction} className="ml-3">
              <button
                type="submit"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-destructive"
              >
                Cerrar sesión
              </button>
            </form>
          </nav>

          <button
            type="button"
            className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-secondary hover:text-foreground md:hidden"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "x" : "="}
          </button>
        </div>

        {menuOpen && (
<nav
            className="border-t border-surface/50 bg-surface px-4 py-2 md:hidden"
            aria-label="Navegación administrativa"
          >
            <div className="flex flex-col gap-1">
              {ADMIN_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={navItemClass(isActive(pathname, item.href))}
                >
                  {item.label}
                </Link>
              ))}
<Link
                href="/torneo"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-primary"
              >
                Ver torneo
              </Link>
              <form action={logoutAction} className="mt-1">
                <button
                  type="submit"
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-muted transition-colors hover:text-destructive"
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
