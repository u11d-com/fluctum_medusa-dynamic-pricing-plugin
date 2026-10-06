"use client";

import { useEffect, useState } from "react";

type Candle = { o: number; c: number; h: number; l: number };

const W = 600;
const H = 340;
const N = 34;
const MIN = 50;
const MAX = 290;
const TICK_MS = 900;

const clamp = (v: number) => Math.max(MIN, Math.min(MAX, v));

// Deterministic PRNG so the statically exported HTML and the hydrated client
// render the same initial chart; live ticks use Math.random after mount.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function nextCandle(open: number, rand: () => number): Candle {
  const c = clamp(open + (rand() - 0.48) * 30);
  return {
    o: open,
    c,
    h: Math.min(open, c) - rand() * 18,
    l: Math.max(open, c) + rand() * 18,
  };
}

function initialCandles(): Candle[] {
  const rand = mulberry32(7);
  const out: Candle[] = [];
  let p = 170;
  for (let i = 0; i < N; i++) {
    const k = nextCandle(p, rand);
    out.push(k);
    p = k.c;
  }
  return out;
}

function tick(candles: Candle[]): Candle[] {
  const last = candles[candles.length - 1];
  if (Math.random() < 0.35) {
    return [...candles.slice(1), nextCandle(last.c, Math.random)];
  }
  const c = clamp(last.c + (Math.random() - 0.5) * 10);
  return [
    ...candles.slice(0, -1),
    { o: last.o, c, h: Math.min(last.h, c, last.o), l: Math.max(last.l, c, last.o) },
  ];
}

export default function CandleChart() {
  const [candles, setCandles] = useState(initialCandles);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const id = setInterval(() => {
      if (!cancelled) setCandles(tick);
    }, TICK_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Auto-scale the visible range to fill the panel (SVG y grows downward,
  // so a lower value means a higher price).
  const lo = Math.min(...candles.map((k) => k.h));
  const hi = Math.max(...candles.map((k) => k.l));
  const sy = (v: number) => 30 + ((v - lo) / Math.max(1, hi - lo)) * (H - 60);
  const view = candles.map((k) => ({ o: sy(k.o), c: sy(k.c), h: sy(k.h), l: sy(k.l) }));

  const step = W / N;
  const bw = step * 0.55;
  const movingAvg = view
    .map((_, i) => {
      const s = view.slice(Math.max(0, i - 5), i + 1);
      const y = s.reduce((a, b) => a + b.c, 0) / s.length;
      return `${i ? "L" : "M"}${(i * step + step / 2).toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const lastY = view[view.length - 1].c;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      {[40, 100, 160, 220, 280].map((y) => (
        <line key={y} x1={0} x2={W} y1={y} y2={y} strokeDasharray="2 6" style={{ stroke: "var(--line)" }} />
      ))}
      <path d={movingAvg} fill="none" strokeWidth={1.5} opacity={0.8} style={{ stroke: "var(--acc)" }} />
      {view.map((k, i) => {
        const x = i * step + step / 2;
        const color = k.c < k.o ? "var(--up)" : "var(--down)";
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={k.h} y2={k.l} strokeWidth={1} style={{ stroke: color }} />
            <rect
              x={x - bw / 2}
              y={Math.min(k.o, k.c)}
              width={bw}
              height={Math.max(2, Math.abs(k.c - k.o))}
              style={{ fill: color }}
            />
          </g>
        );
      })}
      <line
        x1={0}
        x2={W}
        y1={lastY}
        y2={lastY}
        strokeWidth={1}
        strokeDasharray="4 4"
        opacity={0.7}
        style={{ stroke: "var(--acc)" }}
      />
    </svg>
  );
}
