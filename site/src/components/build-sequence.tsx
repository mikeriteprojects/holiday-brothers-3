"use client";

import { useEffect, useRef, useState } from "react";
import { BUILD_STAGES } from "./build-sequence-frames";
import { SukkahScene, type SukkahType } from "./sukkah-3d";

// The one reused build-sequence asset (UserInterface.md §3/§5) — a real 3D
// holographic sukkah, scroll-paced on the homepage, state-driven by the
// active booking step (and live sukkah_type) on /booking. Perf budget: a
// single passive, rAF-throttled scroll listener drives a plain number prop
// (no per-frame React re-render of the tree above the canvas); the 3D scene
// itself is dynamically imported client-only. prefers-reduced-motion swaps
// to the static SVG three-frame row entirely, skipping WebGL altogether.
type Props =
  | { mode: "scroll" }
  | { mode: "step"; step: 0 | 1 | 2; sukkahType?: SukkahType };

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function StaticFrameRow() {
  return (
    <div className="grid grid-cols-3 gap-4 rounded-2xl border border-border bg-card p-6">
      {BUILD_STAGES.map(({ key, label, Frame }) => (
        <figure key={key} className="flex flex-col items-center gap-2">
          <Frame className="h-auto w-full text-foreground" />
          <figcaption className="text-eyebrow">{label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function ScrollBuildSequence() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let ticking = false;

    function update() {
      ticking = false;
      const rect = wrapper!.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      setStage(progress * 2);
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    // Shorter on narrow viewports so the same swipe distance finishes the
    // build before it starts to feel like dragging. The sticky offset
    // (top-28) is set to roughly match this section's natural resting
    // position right below the nav, so there's no visible pre-pin drift —
    // it reads as pinned from the first frame of scroll, not "settling"
    // into place. top-28 also doubles as breathing room above the model.
    <div ref={wrapperRef} className="h-[130vh] sm:h-[160vh] lg:h-[200vh]">
      <div className="sticky top-28 mx-auto flex h-[55vh] max-w-2xl flex-col items-center justify-center sm:h-[60vh]">
        <SukkahScene stage={stage} sukkahType="Construction" className="h-full w-full" />
        <p className="text-eyebrow mt-4">Construction, built beat by beat as you scroll</p>
      </div>
    </div>
  );
}

function StepBuildSequence({ step, sukkahType }: { step: 0 | 1 | 2; sukkahType: SukkahType }) {
  return (
    <div className="aspect-[400/260] w-full max-w-md">
      <SukkahScene stage={step} sukkahType={sukkahType} className="h-full w-full" />
    </div>
  );
}

export function BuildSequence(props: Props) {
  const reduced = useReducedMotion();

  if (reduced) return <StaticFrameRow />;
  if (props.mode === "step") return <StepBuildSequence step={props.step} sukkahType={props.sukkahType || "Construction"} />;
  return <ScrollBuildSequence />;
}
