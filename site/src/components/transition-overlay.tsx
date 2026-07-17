"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Kind = "esrog" | "lulav";

function EsrogShape() {
  return (
    <svg viewBox="0 0 140 220" className="esrog-anim h-56 w-36 drop-shadow-2xl" aria-hidden>
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

function LulavShape() {
  return (
    <svg viewBox="0 0 160 420" className="lulav-anim h-[70vh] w-auto drop-shadow-2xl" aria-hidden>
      <defs>
        <linearGradient id="lulavSpine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4d8a3f" />
          <stop offset="100%" stopColor="#3a6b2f" />
        </linearGradient>
      </defs>
      {/* central spine */}
      <rect x="74" y="10" width="12" height="360" rx="4" fill="url(#lulavSpine)" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x="66" y={60 + i * 55} width="28" height="6" rx="3" fill="#2f5424" />
      ))}
      {/* fanning leaflets, alternating sides */}
      {Array.from({ length: 16 }).map((_, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const y = 40 + Math.floor(i / 2) * 42;
        const len = 60 - Math.floor(i / 2) * 3;
        return (
          <path
            key={i}
            d={`M80 ${y} Q${80 + side * len * 0.6} ${y + 10} ${80 + side * len} ${y + 30}`}
            stroke="#5a9c4a"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
        );
      })}
      {/* binding at the base */}
      <rect x="64" y="360" width="32" height="26" rx="4" fill="#7a5a34" />
    </svg>
  );
}

export function TransitionOverlay() {
  const router = useRouter();
  const [active, setActive] = useState<{ kind: Kind } | null>(null);
  const timeouts = useRef<number[]>([]);

  useEffect(() => {
    function onTrigger(e: Event) {
      const detail = (e as CustomEvent<{ kind: Kind; href: string }>).detail;
      setActive({ kind: detail.kind });
      const navDelay = detail.kind === "esrog" ? 550 : 600;
      const clearDelay = detail.kind === "esrog" ? 950 : 950;
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
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {active.kind === "esrog" ? (
        <div className="absolute left-0 top-1/2 -translate-y-1/2">
          <EsrogShape />
        </div>
      ) : (
        <div className="absolute left-1/2 top-0 -translate-x-1/2">
          <LulavShape />
        </div>
      )}
    </div>
  );
}
