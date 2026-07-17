"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// On-brand "settle" transition — a short rise + fade, echoing the build
// motif's roof-settling beat, instead of a default instant swap or
// crossfade. Respects prefers-reduced-motion via the CSS rule in
// globals.css that collapses all transition/animation durations globally.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(10px)";
    // Force a reflow so the transition actually plays on each navigation.
    void el.offsetHeight;
    el.style.transition = "opacity 320ms ease-out, transform 320ms ease-out";
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  }, [pathname]);

  return (
    <div ref={ref} key={pathname}>
      {children}
    </div>
  );
}
