"use client";

// Clicking any /booking entry point plays an esrog rolling across the
// screen, growing as it passes, before the destination mounts underneath.
// Clicking any /join-crew entry point drops a giant lulav from the top that
// opens as it lands. Dispatches a window event the TransitionOverlay (see
// transition-overlay.tsx, mounted once in layout.tsx) picks up — kept as a
// plain event rather than React context so any link anywhere can trigger it
// without prop-drilling a provider.
export function TransitionLink({
  href,
  kind,
  className,
  children,
}: {
  href: string;
  kind: "esrog" | "lulav";
  className?: string;
  children: React.ReactNode;
}) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // let cmd/ctrl-click open in new tab normally
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("hb-transition", { detail: { kind, href } }));
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
