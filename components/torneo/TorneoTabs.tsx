"use client";

import { useState, type ReactNode } from "react";

export interface TorneoPanel {
  id: string;
  label: string;
  content: ReactNode;
}

export default function TorneoTabs({
  panels,
  initialTabId,
}: {
  panels: TorneoPanel[];
  initialTabId?: string;
}) {
  const hasInitial = initialTabId && panels.some((panel) => panel.id === initialTabId);
  const [activeId, setActiveId] = useState(hasInitial ? (initialTabId as string) : (panels[0]?.id ?? ""));

  const active = panels.find((panel) => panel.id === activeId) ?? null;

  return (
    <div className="rounded-2xl border border-surface/50 bg-surface/60">
      <div className="flex flex-wrap gap-1 border-b border-surface/50 px-4 pt-3">
        {panels.map((panel) => (
          <button
            key={panel.id}
            type="button"
            role="tab"
            aria-selected={activeId === panel.id}
            onClick={() => setActiveId(panel.id)}
            className={`-mb-px rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeId === panel.id
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-primary"
            }`}
          >
            {panel.label}
          </button>
        ))}
      </div>
      <div className="p-4">{active?.content}</div>
    </div>
  );
}