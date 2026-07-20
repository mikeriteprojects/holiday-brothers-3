"use client";

import { useEffect, useState } from "react";
import { SukkahScene } from "@/components/sukkah-3d";
import { FrameComplete } from "@/components/build-sequence-frames";
import { TransitionLink } from "@/components/page-transition-links";

// Its own smaller visual moment — the same 3D asset, at rest, fully
// assembled — rather than a plain form. No cart/payment language anywhere.
// The whole card is the link (glow-hover signals that), not just the pill.
export function ClosingCta() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <TransitionLink
        href="/booking"
        kind="esrog"
        className="glow-hover block rounded-3xl border border-border bg-card px-8 py-12 text-center"
      >
        {reduced ? (
          <FrameComplete className="mx-auto h-32 w-auto text-foreground" />
        ) : (
          <SukkahScene stage={2} sukkahType="Construction" className="mx-auto h-40 w-full max-w-sm" />
        )}
        <h2 className="text-display-lg mt-6 text-foreground">Ready to lock in your sukkah?</h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Guest or full account, either way you walk away with a booking code and a real quote —
          no payment collected online.
        </p>
        <span className="hover-wiggle mt-6 inline-block rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground">
          Start a booking
        </span>
      </TransitionLink>
    </section>
  );
}
