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

function Trophy() {
  return (
    <div aria-hidden="true" className="animate-champion-glow relative mx-auto h-[150px] w-[120px] shrink-0">
      <div className="absolute inset-2 rounded-full bg-[#FFD700]/20 blur-2xl" />
      <div className="absolute left-1/2 top-0 h-6 w-6 -translate-x-1/2 bg-gradient-to-b from-[#FFF3B0] to-[#E6B400] [clip-path:polygon(50%_0%,61%_35%,98%_35%,68%_57%,79%_91%,50%_70%,21%_91%,32%_57%,2%_35%,39%_35%)]" />
      <div className="absolute left-[26px] top-[26px] h-10 w-4 rounded-l-full border-[5px] border-[#E6B400] border-r-0" />
      <div className="absolute right-[26px] top-[26px] h-10 w-4 rounded-r-full border-[5px] border-[#E6B400] border-l-0" />
      <div className="absolute left-1/2 top-4 h-12 w-20 -translate-x-1/2 rounded-[40px_40px_12px_12px] bg-gradient-to-b from-[#FFF3B0] to-[#C98A00]" />
      <div className="absolute left-1/2 top-6 h-1.5 w-7 -translate-x-1/2 rounded-full bg-white/70 blur-[1px]" />
      <div className="absolute left-1/2 top-[60px] h-[5px] w-11 -translate-x-1/2 rounded-full bg-[#E6B400]" />
      <div className="absolute left-1/2 top-[63px] h-6 w-4 -translate-x-1/2 rounded-[2px] bg-gradient-to-b from-[#E6B400] to-[#B8860B]" />
      <div className="absolute left-1/2 top-[88px] h-3 w-6 -translate-x-1/2 rounded-full bg-[#D9A400]" />
      <div className="absolute left-1/2 top-[94px] h-5 w-16 -translate-x-1/2 rounded-[8px] bg-gradient-to-b from-[#FFD700] to-[#A87800]" />
      <div className="absolute left-1/2 top-[114px] h-4 w-24 -translate-x-1/2 rounded-[6px] bg-gradient-to-b from-[#E6B400] to-[#8A6500]" />
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
            <div className="absolute -left-14 -top-24 h-72 w-56 origin-top-left -rotate-[14deg] animate-champion-beam bg-gradient-to-b from-[#FFD700]/25 via-[#FFD700]/5 to-transparent [clip-path:polygon(30%_0%,70%_0%,100%_100%,0%_100%)]" />
            <div
              className="absolute -right-14 -top-24 h-72 w-56 origin-top-right rotate-[14deg] animate-champion-beam bg-gradient-to-b from-[#00E5FF]/20 via-[#00E5FF]/5 to-transparent [clip-path:polygon(30%_0%,70%_0%,100%_100%,0%_100%)]"
              style={{ animationDelay: "0.7s" }}
            />
            <div className="absolute -top-16 left-1/2 h-48 w-[130%] -translate-x-1/2 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(255,215,0,0.16),transparent_70%)]" />
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

          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6 py-8 text-center sm:px-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#9BE8FF] sm:text-xs">
              FIFA FRIENDS CUP
            </p>
            <p className="mt-1 text-[11px] font-black italic uppercase tracking-[0.4em] text-[#FFD700] sm:text-sm">
              {edition}
            </p>

            <div className="my-3 h-px w-44 bg-gradient-to-r from-transparent via-[#FFD700]/80 to-transparent" />

            <h2 className="gold-metallic-text text-4xl font-black italic uppercase leading-none tracking-[0.04em] sm:text-6xl">
              Campeones
            </h2>

            <Trophy />

            <p className="mt-3 max-w-full px-2 text-xl font-extrabold leading-snug text-white sm:text-2xl">
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

            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#FFD700]/60 bg-[#FFD700]/10 px-5 py-1.5 text-[10px] font-black uppercase tracking-[0.45em] text-[#FFE9A8] sm:text-[11px]">
              <span aria-hidden="true">★</span>
              Campeón
              <span aria-hidden="true">★</span>
            </div>

            <p className="mt-4 text-[9px] uppercase tracking-[0.5em] text-white/35 sm:text-[10px]">
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