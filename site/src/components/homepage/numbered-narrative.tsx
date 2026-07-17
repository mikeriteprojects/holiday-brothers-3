import { TiltCard } from "@/components/tilt-card";
import { TransitionLink } from "@/components/page-transition-links";

// The numbered narrative *is* the real booking sequence (UserJourney.md
// §2.2) for steps 1-7 — not a decorative summary, each links conceptually
// into /booking. Steps 8-9 extend the story past submission into the
// staff-driven status lifecycle (Scheduled, then the build itself) so the
// grid reads as a complete arc rather than stopping at a lopsided 7th card —
// they aren't additional /booking form steps, the booking flow itself stays
// the hardcoded 7 steps.
const STEPS = [
  {
    n: 1,
    title: "Supplies check",
    body: "Already have your own canvas, panels, or lumber? Say so and we skip straight past delivery — no unnecessary step.",
  },
  {
    n: 2,
    title: "Size",
    body: "Small, Medium, or Large — sized to your yard, not a one-size template.",
  },
  {
    n: 3,
    title: "Type",
    body: "Canvas up in a day, Modular panels for a middle ground, Construction built to last the season.",
    swatches: true,
  },
  {
    n: 4,
    title: "Speed tier",
    body: "Patient, Regular, or Express — the sooner you need it, the more it costs to prioritize.",
  },
  {
    n: 5,
    title: "Delivery",
    body: "Self-deliver or have the crew picked up, each with its own discount — skipped entirely if you already have supplies.",
  },
  {
    n: 6,
    title: "Address",
    body: "We service Rockland County, NY. Outside the area? You'll get a heads-up, not a hard stop.",
  },
  {
    n: 7,
    title: "Lock it in",
    body: "Full account or guest — either way, you walk away with a booking code.",
  },
  {
    n: 8,
    title: "Scheduled",
    body: "Once your quote is confirmed, we lock in a build date and the crew is appointed to the job.",
  },
  {
    n: 9,
    title: "Building",
    body: "Crew arrives, the sukkah goes up — frame, walls, s'chach — and you're notified the moment it's done.",
  },
] as const;

const SWATCHES = [
  { key: "canvas", label: "Canvas", token: "var(--method-canvas)" },
  { key: "modular", label: "Modular", token: "var(--method-modular)" },
  { key: "construction", label: "Construction", token: "var(--method-construction)" },
] as const;

export function NumberedNarrative() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-eyebrow">How a booking works</p>
      <h2 className="text-display-lg mt-2 max-w-2xl text-foreground">
        From the first question to the finished build.
      </h2>
      <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" style={{ perspective: "1200px" }}>
        {STEPS.map((step) => (
          <li key={step.n}>
            <TiltCard className="h-full rounded-2xl border border-border bg-card p-6">
              <span className="text-display-md font-display text-primary">
                {String(step.n).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              {"swatches" in step && step.swatches && (
                <div className="mt-4 flex gap-2">
                  {SWATCHES.map((s) => (
                    <span key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className="inline-block h-3 w-3 rounded-full border border-border"
                        style={{ backgroundColor: s.token }}
                      />
                      {s.label}
                    </span>
                  ))}
                </div>
              )}
            </TiltCard>
          </li>
        ))}
      </ol>
      <TransitionLink
        href="/booking"
        kind="esrog"
        className="hover-wiggle mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Start your booking
      </TransitionLink>
    </section>
  );
}
