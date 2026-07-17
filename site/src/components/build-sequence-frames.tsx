// The signature motif's three labeled stages, drawn as SVG cross-sections of
// a Construction-method sukkah (frame -> nailed wood walls -> s'chach roof).
// This doubles as the prefers-reduced-motion / no-WebGL fallback per
// UserInterface.md §5 — it isn't throwaway work ahead of a future 3D model,
// it's the required accessibility fallback built first.

const WOOD = "var(--method-construction)";
const WOOD_LIGHT = "var(--method-modular)";
const INK = "var(--foreground)";
const MUTED = "var(--muted-foreground)";

type FrameProps = { className?: string; style?: React.CSSProperties };

function Ground() {
  return <line x1="30" y1="230" x2="370" y2="230" stroke={MUTED} strokeWidth="1.5" opacity="0.5" />;
}

function Posts() {
  return (
    <g stroke={WOOD} strokeWidth="10" strokeLinecap="round">
      <line x1="70" y1="230" x2="70" y2="90" />
      <line x1="330" y1="230" x2="330" y2="90" />
      <line x1="200" y1="230" x2="200" y2="80" opacity="0.55" />
    </g>
  );
}

function TopBeams() {
  return (
    <g stroke={WOOD} strokeWidth="8" strokeLinecap="round">
      <line x1="65" y1="90" x2="335" y2="90" />
      <line x1="65" y1="88" x2="200" y2="78" opacity="0.55" />
      <line x1="200" y1="78" x2="335" y2="88" opacity="0.55" />
    </g>
  );
}

export function FrameStart({ className, style }: FrameProps) {
  return (
    <svg viewBox="0 0 400 260" className={className} style={style} role="img" aria-label="Bare wooden frame, first stage of the Construction build">
      <Ground />
      <Posts />
      <TopBeams />
    </svg>
  );
}

export function FrameMidBuild({ className, style }: FrameProps) {
  return (
    <svg viewBox="0 0 400 260" className={className} style={style} role="img" aria-label="Wood wall panels nailed to the frame, second stage of the Construction build">
      <Ground />
      <rect x="72" y="94" width="122" height="128" fill={WOOD_LIGHT} opacity="0.85" />
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="72" y1={102 + i * 24} x2="194" y2={102 + i * 24} stroke={INK} strokeWidth="1" opacity="0.12" />
      ))}
      <Posts />
      <TopBeams />
    </svg>
  );
}

export function FrameComplete({ className, style }: FrameProps) {
  return (
    <svg viewBox="0 0 400 260" className={className} style={style} role="img" aria-label="Fully assembled sukkah with walls and s'chach roof, complete Construction build">
      <Ground />
      <rect x="72" y="94" width="256" height="128" fill={WOOD_LIGHT} opacity="0.85" />
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="72" y1={102 + i * 24} x2="328" y2={102 + i * 24} stroke={INK} strokeWidth="1" opacity="0.1" />
      ))}
      <Posts />
      <TopBeams />
      {/* s'chach: loose palm-frond covering laid across the roof */}
      <g stroke={WOOD} strokeWidth="3" strokeLinecap="round" opacity="0.75">
        {Array.from({ length: 14 }).map((_, i) => {
          const x = 60 + i * 21;
          return <line key={i} x1={x} y1="72" x2={x - 6} y2="94" />;
        })}
      </g>
    </svg>
  );
}

export const BUILD_STAGES = [
  { key: "start", label: "Frame", Frame: FrameStart },
  { key: "mid", label: "Walls", Frame: FrameMidBuild },
  { key: "complete", label: "S'chach roof", Frame: FrameComplete },
] as const;

export type BuildStageKey = (typeof BUILD_STAGES)[number]["key"];
