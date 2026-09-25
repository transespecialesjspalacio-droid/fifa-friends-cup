"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const ITEMS = [
  { label: "Inicio", href: "/" },
  { label: "Torneo", href: "/torneo" },
  { label: "Fase Final", href: "/fase-final" },
  { label: "Resultados", href: "/torneo?tab=resultados" },
] as const;

function isActive(pathname: string, search: URLSearchParams, href: string): boolean {
  const [path, query = ""] = href.split("?");
  if (path === "/") return pathname === "/";
  if (pathname !== path && !pathname.startsWith(`${path}/`)) return false;
  const required = new URLSearchParams(query);
  for (const [key, value] of required) {
    if (search.get(key) !== value) return false;
  }
  if (required.size === 0 && search.get("tab") === "resultados") return false;
  return true;
}

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-surface-secondary border-r border-surface/50 flex-shrink-0 p-4 pt-6 space-y-2 transition-all duration-200">
      <div className="flex h-12 items-center justify-between mb-8">
        <span className="text-xs uppercase tracking-wider text-muted">FIFA FRIENDS CUP</span>
        <span className="text-xs font-medium text-primary">2026</span>
      </div>

      <nav aria-label="Navegación principal" className="space-y-1">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(pathname, searchParams, item.href) ? "page" : undefined}
            className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive(pathname, searchParams, item.href)
                ? "bg-primary/10 text-primary"
                : "text-muted hover:text-primary hover:bg-primary/5"
            }`}
          >
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-4 border-t border-surface/50 pt-3">
        <Link
          href="/admin"
          className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-primary hover:bg-primary/5"
        >
          <span>Admin</span>
        </Link>
      </div>

      <div className="mt-auto pt-4 border-t border-surface/50">
        <span className="text-xs uppercase tracking-wider text-muted">Versión 0.2</span>
      </div>
    </nav>
  );
}