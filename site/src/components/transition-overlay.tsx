"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Kind = "esrog" | "lulav";
type TriggerDetail = { kind: Kind; href: string; originX: number; originY: number };

function EsrogShape() {
  return (
    <svg viewBox="0 0 140 220" className="h-40 w-24 drop-shadow-2xl sm:h-56 sm:w-36" aria-hidden>
      <defs>
        <radialGradient id="esrogGrad" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#f5e98a" />
          <stop offset="55%" stopColor="#e8c93a" />
          <stop offset="100%" stopColor="#c9a520" />
        </radialGradient>
      </defs>
      <ellipse cx="70" cy="120" rx="52" ry="75" fill="url(#esrogGrad)" />
      {/* pitam — the small pointed tip */}
      <path d="M70 45 Q64 20 70 6 Q76 20 70 45 Z" fill="#8a9b3f" />
      {/* subtle bumpy texture */}
      {Array.from({ length: 14 }).map((_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const cx = 70 + Math.cos(angle) * 34;
        const cy = 120 + Math.sin(angle) * 52;
        return <circle key={i} cx={cx} cy={cy} r="2.6" fill="#c9a520" opacity="0.45" />;
      })}
    </svg>
  );
}

// A single tall, tapered frond silhouette (not a rickety spine-and-twigs
// assembly) — reads clearly as a lulav even at speed, with a bound base
// like the reference photo.
function LulavShape() {
  return (
    <svg viewBox="0 0 200 520" className="h-[36vh] w-auto drop-shadow-2xl sm:h-[46vh]" aria-hidden>
      <defs>
        <linearGradient id="lulavBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2f5424" />
          <stop offset="45%" stopColor="#5a9c4a" />
          <stop offset="55%" stopColor="#5a9c4a" />
          <stop offset="100%" stopColor="#2f5424" />
        </linearGradient>
      </defs>
      {/* main frond body — one clean tapered blade */}
      <path
        d="M100 8
           C 130 90, 148 220, 128 420
           C 122 460, 112 486, 100 508
           C 88 486, 78 460, 72 420
           C 52 220, 70 90, 100 8 Z"
        fill="url(#lulavBody)"
      />
      {/* center rib */}
      <path d="M100 20 L100 500" stroke="#1f3d18" strokeWidth="4" opacity="0.55" />
      {/* fine texture strokes fanning off the rib */}
      {Array.from({ length: 18 }).map((_, i) => {
        const y = 60 + i * 24;
        const side = i % 2 === 0 ? -1 : 1;
        return (
          <line
            key={i}
            x1={100}
            y1={y}
            x2={100 + side * 26}
            y2={y + 16}
            stroke="#1f3d18"
            strokeWidth="1.5"
            opacity="0.35"
          />
        );
      })}
      {/* woven binding wrap near the base */}
      <rect x="76" y="430" width="48" height="34" rx="6" fill="#8a5a34" />
      <rect x="76" y="452" width="48" height="8" rx="3" fill="#6d4527" />
    </svg>
  );
}

export function TransitionOverlay() {
  const router = useRouter();
  const [active, setActive] = useState<TriggerDetail | null>(null);
  const timeouts = useRef<number[]>([]);

  useEffect(() => {
    function onTrigger(e: Event) {
      const detail = (e as CustomEvent<TriggerDetail>).detail;
      setActive(detail);
      const navDelay = detail.kind === "esrog" ? 750 : 700;
      const clearDelay = detail.kind === "esrog" ? 1150 : 1000;
      const navTimer = window.setTimeout(() => router.push(detail.href), navDelay);
      const clearTimer = window.setTimeout(() => setActive(null), clearDelay);
      timeouts.current.push(navTimer, clearTimer);
    }
    window.addEventListener("hb-transition", onTrigger);
    return () => window.removeEventListener("hb-transition", onTrigger);
  }, [router]);

  useEffect(() => {
    const captured = timeouts.current;
    return () => captured.forEach((t) => window.clearTimeout(t));
  }, []);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" style={{ perspective: "800px" }}>
      {active.kind === "esrog" ? (
        <div
          className="esrog-anim absolute"
          style={{ left: active.originX, top: active.originY, transform: "translate(-50%, -50%)" }}
        >
          <EsrogShape />
        </div>
      ) : (
        <div className="lulav-anim absolute left-1/2 top-0">
          <LulavShape />
        </div>
      )}
    </div>
  );
}
