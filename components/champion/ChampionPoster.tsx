"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";

export interface ChampionPosterProps {
  pairName: string;
  teamName: string | null;
  edition?: string;
  className?: string;
}

const CONFETTI: { left: string; top: string; size: number; rot: number; color: string; delay: number }[] = [
  { left: "6%", top: "14%", size: 6, rot: 14, color: "#FFD700", delay: 0 },
  { left: "16%", top: "38%", size: 5, rot: -24, color: "#00E5FF", delay: 0.4 },
  { left: "26%", top: "10%", size: 5, rot: 32, color: "#FFF7D6", delay: 0.9 },
  { left: "38%", top: "44%", size: 6, rot: -8, color: "#FFD700", delay: 1.3 },
  { left: "48%", top: "7%", size: 5, rot: 46, color: "#B8860B", delay: 0.2 },
  { left: "58%", top: "40%", size: 6, rot: -32, color: "#00E5FF", delay: 1.6 },
  { left: "68%", top: "12%", size: 5, rot: 18, color: "#FFD700", delay: 0.7 },
  { left: "78%", top: "36%", size: 5, rot: -16, color: "#FFF7D6", delay: 1.1 },
  { left: "88%", top: "16%", size: 6, rot: 26, color: "#FFD700", delay: 0.5 },
  { left: "10%", top: "62%", size: 5, rot: -40, color: "#B8860B", delay: 1.8 },
  { left: "22%", top: "84%", size: 6, rot: 22, color: "#FFD700", delay: 0.3 },
  { left: "34%", top: "72%", size: 5, rot: -12, color: "#00E5FF", delay: 1.4 },
  { left: "46%", top: "88%", size: 6, rot: 38, color: "#FFF7D6", delay: 0.8 },
  { left: "58%", top: "78%", size: 5, rot: -28, color: "#FFD700", delay: 2 },
  { left: "70%", top: "90%", size: 5, rot: 14, color: "#B8860B", delay: 1 },
  { left: "82%", top: "68%", size: 6, rot: -20, color: "#FFD700", delay: 0.6 },
  { left: "92%", top: "82%", size: 5, rot: 30, color: "#00E5FF", delay: 1.7 },
  { left: "4%", top: "30%", size: 5, rot: 12, color: "#FFF7D6", delay: 2.2 },
  { left: "84%", top: "24%", size: 5, rot: -34, color: "#B8860B", delay: 0.1 },
  { left: "64%", top: "58%", size: 5, rot: 24, color: "#FFF7D6", delay: 2.4 },
];

const SPARKLES: { left: string; top: string; size: number; delay: number }[] = [
  { left: "12%", top: "22%", size: 3, delay: 0 },
  { left: "32%", top: "16%", size: 2, delay: 0.5 },
  { left: "72%", top: "20%", size: 3, delay: 1 },
  { left: "88%", top: "42%", size: 2, delay: 0.3 },
  { left: "8%", top: "52%", size: 2, delay: 1.4 },
  { left: "52%", top: "28%", size: 3, delay: 0.8 },
  { left: "24%", top: "48%", size: 2, delay: 1.8 },
  { left: "78%", top: "56%", size: 3, delay: 2 },
  { left: "44%", top: "12%", size: 2, delay: 0.2 },
  { left: "94%", top: "64%", size: 2, delay: 1.1 },
];

function ChampionTrophy() {
  return (
    <div aria-hidden="true" className="animate-champion-glow relative mx-auto w-40 shrink-0 sm:w-60">
      <svg
        viewBox="0 0 260 300"
        className="relative z-10 h-auto w-full"
        role="img"
        aria-label="Trofeo de campeones"
      >
        <defs>
          <linearGradient id="ct-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF3B0" />
            <stop offset="12%" stopColor="#FFE063" />
            <stop offset="45%" stopColor="#F5C33A" />
            <stop offset="75%" stopColor="#C9972A" />
            <stop offset="100%" stopColor="#8A6500" />
          </linearGradient>
          <linearGradient id="ct-goldLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFDEB" />
            <stop offset="50%" stopColor="#FFE9A8" />
            <stop offset="100%" stopColor="#D9A63C" />
          </linearGradient>
          <linearGradient id="ct-goldDeep" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8B93C" />
            <stop offset="60%" stopColor="#B8860B" />
            <stop offset="100%" stopColor="#6E5010" />
          </linearGradient>
          <linearGradient id="ct-inner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6B4A09" />
            <stop offset="100%" stopColor="#33250A" />
          </linearGradient>
          <linearGradient id="ct-baseDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#293146" />
            <stop offset="45%" stopColor="#121722" />
            <stop offset="100%" stopColor="#07090E" />
          </linearGradient>
          <radialGradient id="ct-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#FFD25A" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#FFB84D" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#FFB84D" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="130" cy="120" rx="104" ry="92" fill="url(#ct-glow)" />

        <path
          d="M 62 84 C 20 92, 22 152, 94 160"
          fill="none"
          stroke="#6E5010"
          strokeWidth="15"
          strokeLinecap="round"
        />
        <path
          d="M 62 84 C 20 92, 22 152, 94 160"
          fill="none"
          stroke="#E8B93C"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d="M 62 84 C 20 92, 22 152, 94 160"
          fill="none"
          stroke="#FFE9A8"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.55"
        />

        <path
          d="M 198 84 C 240 92, 238 152, 166 160"
          fill="none"
          stroke="#6E5010"
          strokeWidth="15"
          strokeLinecap="round"
        />
        <path
          d="M 198 84 C 240 92, 238 152, 166 160"
          fill="none"
          stroke="#E8B93C"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d="M 198 84 C 240 92, 238 152, 166 160"
          fill="none"
          stroke="#FFE9A8"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.55"
        />

        <rect x="64" y="66" width="132" height="94" rx="10" fill="url(#ct-gold)" />
        <path
          d="M 74 72 C 74 116, 92 152, 104 154"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.3"
        />
        <path
          d="M 186 72 C 186 116, 168 152, 156 154"
          fill="none"
          stroke="#6E5010"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.35"
        />
        <ellipse
          cx="152"
          cy="84"
          rx="9"
          ry="4"
          transform="rotate(-18 152 84)"
          fill="#FFFFFF"
          opacity="0.18"
        />

        <rect x="44" y="38" width="172" height="30" rx="13" fill="url(#ct-gold)" />
        <rect x="48" y="42" width="104" height="5" rx="2.5" fill="#FFFFFF" opacity="0.6" />
        <ellipse cx="130" cy="52" rx="64" ry="9" fill="url(#ct-inner)" />
        <ellipse cx="130" cy="60" rx="64" ry="3" fill="#33250A" opacity="0.8" />

        <path d="M 96 156 L 110 170 L 150 170 L 164 156 Z" fill="url(#ct-goldDeep)" />
        <rect x="100" y="166" width="60" height="9" rx="4.5" fill="url(#ct-goldLight)" />

        <path d="M 116 175 L 144 175 L 138 194 L 122 194 Z" fill="url(#ct-goldDeep)" />
        <path d="M 130 175 L 128 194" stroke="#FFF3B0" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        <rect x="106" y="192" width="48" height="10" rx="5" fill="url(#ct-gold)" />

        <rect x="96" y="202" width="68" height="16" rx="8" fill="url(#ct-goldLight)" />
        <rect x="84" y="218" width="92" height="18" rx="9" fill="url(#ct-gold)" />

        <rect x="66" y="236" width="128" height="32" rx="14" fill="url(#ct-baseDark)" />
        <rect x="72" y="238" width="116" height="5" rx="2.5" fill="url(#ct-goldLight)" />
        <path d="M 130 248 L 136 254 L 130 260 L 124 254 Z" fill="url(#ct-goldLight)" />
        <circle cx="86" cy="260" r="3" fill="#FFE9A8" opacity="0.8" />
        <circle cx="174" cy="260" r="3" fill="#FFE9A8" opacity="0.8" />
        <rect x="68" y="262" width="124" height="4" rx="2" fill="#FFD95B" opacity="0.35" />
      </svg>
    </div>
  );
}

export function ChampionPoster({
  pairName,
  teamName,
  edition = "#1",
  className,
}: ChampionPosterProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!nodeRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(nodeRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: "#05070F",
      });
      const link = document.createElement("a");
      link.download = `fifa-friends-cup-${edition.replace("#", "")}-campeones.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section className={`flex flex-col items-center ${className ?? ""}`}>
      <div
        ref={nodeRef}
        className="relative aspect-[3/4] w-full max-w-[560px] overflow-hidden rounded-[30px] bg-gradient-to-b from-[#F7D878] via-[#8E6D23] to-[#F7D878] p-[3px] shadow-[0_0_70px_-22px_rgba(255,215,0,0.5)]"
      >
        <div className="relative h-full w-full overflow-hidden rounded-[27px] bg-[#05070F]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-14 -top-24 h-72 w-56 origin-top-left -rotate-[14deg] animate-champion-beam bg-gradient-to-b from-[#FFD700]/15 via-[#FFD700]/4 to-transparent [clip-path:polygon(30%_0%,70%_0%,100%_100%,0%_100%)]" />
            <div
              className="absolute -right-14 -top-24 h-72 w-56 origin-top-right rotate-[14deg] animate-champion-beam bg-gradient-to-b from-[#00E5FF]/12 via-[#00E5FF]/4 to-transparent [clip-path:polygon(30%_0%,70%_0%,100%_100%,0%_100%)]"
              style={{ animationDelay: "0.7s" }}
            />
            <div className="absolute -top-16 left-1/2 h-48 w-[130%] -translate-x-1/2 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(255,215,0,0.14),transparent_70%)]" />
            <div className="absolute left-1/2 top-[54%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,210,63,0.22),transparent_70%)]" />
            <div className="absolute left-1/2 top-4 flex -translate-x-1/2 gap-6">
              <span className="h-2 w-2 rounded-full bg-[#FFE9A8] shadow-[0_0_12px_2px_rgba(255,233,168,0.8)]" />
              <span className="h-2 w-2 rounded-full bg-[#FFE9A8] shadow-[0_0_12px_2px_rgba(255,233,168,0.8)]" />
              <span className="h-2 w-2 rounded-full bg-[#FFE9A8] shadow-[0_0_12px_2px_rgba(255,233,168,0.8)]" />
              <span className="h-2 w-2 rounded-full bg-[#FFE9A8] shadow-[0_0_12px_2px_rgba(255,233,168,0.8)]" />
              <span className="h-2 w-2 rounded-full bg-[#FFE9A8] shadow-[0_0_12px_2px_rgba(255,233,168,0.8)]" />
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_120%,rgba(0,40,90,0.6),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(140%_110%_at_50%_15%,transparent_45%,rgba(0,0,0,0.65)_100%)]" />
          </div>

          {CONFETTI.map((piece, index) => (
            <span
              key={index}
              aria-hidden="true"
              className="animate-champion-float absolute rounded-[1px] opacity-80"
              style={
                {
                  left: piece.left,
                  top: piece.top,
                  width: piece.size,
                  height: piece.size * 1.7,
                  background: piece.color,
                  "--rot": `${piece.rot}deg`,
                  animationDelay: `${piece.delay}s`,
                  animationDuration: `${2.6 + (index % 3) * 0.6}s`,
                } as React.CSSProperties
              }
            />
          ))}

          {SPARKLES.map((spark, index) => (
            <span
              key={index}
              aria-hidden="true"
              className="animate-champion-twinkle absolute rounded-full bg-[#FFF7D6] shadow-[0_0_6px_1px_rgba(255,247,214,0.8)]"
              style={{
                left: spark.left,
                top: spark.top,
                width: spark.size,
                height: spark.size,
                animationDelay: `${spark.delay}s`,
              }}
            />
          ))}

          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6 py-5 text-center sm:px-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#9BE8FF] sm:text-xs">
              FIFA FRIENDS CUP
            </p>
            <p className="mt-1 text-[11px] font-black italic uppercase tracking-[0.4em] text-[#FFD700] sm:text-sm">
              {edition}
            </p>

            <div className="my-2 h-px w-44 bg-gradient-to-r from-transparent via-[#FFD700]/80 to-transparent" />

            <h2 className="gold-metallic-text text-4xl font-black italic uppercase leading-none tracking-[0.04em] sm:text-6xl">
              Campeones
            </h2>

            <div className="mt-2">
              <ChampionTrophy />
            </div>

            <p className="mt-2 max-w-full px-2 text-xl font-extrabold leading-snug text-white sm:text-2xl">
              {pairName}
            </p>

            {teamName && (
              <div className="mt-1 flex items-center gap-3">
                <span className="h-px w-6 bg-[#FFD700]/60" />
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#FFD700] sm:text-base">
                  {teamName}
                </p>
                <span className="h-px w-6 bg-[#FFD700]/60" />
              </div>
            )}

            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#FFD700]/60 bg-[#FFD700]/10 px-5 py-1.5 text-[10px] font-black uppercase tracking-[0.45em] text-[#FFE9A8] sm:text-[11px]">
              <span aria-hidden="true">★</span>
              Campeón
              <span aria-hidden="true">★</span>
            </div>

            <p className="mt-3 text-[9px] uppercase tracking-[0.5em] text-white/35 sm:text-[10px]">
              FIFA FRIENDS CUP {edition} · Campeones
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FFD700] to-[#E6B400] px-8 py-3 text-sm font-black uppercase tracking-[0.25em] text-[#1A1200] shadow-[0_0_28px_-10px_rgba(255,215,0,0.8)] transition-opacity hover:opacity-90 focus-visible:outline-none disabled:opacity-60"
      >
        {downloading ? "Generando..." : "Descargar imagen"}
      </button>
    </section>
  );
}