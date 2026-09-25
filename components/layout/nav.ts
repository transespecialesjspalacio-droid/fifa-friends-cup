export const NAV_ITEMS = [
  { label: "Inicio", href: "/" },
  { label: "Torneo", href: "/torneo" },
  { label: "Fase Final", href: "/fase-final" },
  { label: "Resultados", href: "/torneo?tab=resultados" },
] as const;

export function isActive(pathname: string, search: URLSearchParams, href: string): boolean {
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