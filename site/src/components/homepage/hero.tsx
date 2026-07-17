import { BuildSequence } from "@/components/build-sequence";
import { contentValue } from "./content-defaults";
import type { ContentRow } from "@/lib/backend";
import Link from "next/link";
import { TransitionLink } from "@/components/page-transition-links";

export function Hero({ contentRows }: { contentRows: ContentRow[] }) {
  const eyebrow = contentValue(contentRows, "homepage_eyebrow");
  const title = contentValue(contentRows, "homepage_hero_title");
  const subtitle = contentValue(contentRows, "homepage_hero_subtitle");

  return (
    <section className="mx-auto max-w-6xl px-6 pt-16 pb-8">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <p className="text-eyebrow">{eyebrow}</p>
          <h1 className="text-display-xl mt-3 text-foreground">{title}</h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">{subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <TransitionLink
              href="/booking"
              kind="esrog"
              className="hover-wiggle rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Start a booking
            </TransitionLink>
            <Link
              href="/booking/track"
              className="hover-wiggle rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary"
            >
              Track my booking
            </Link>
          </div>
        </div>
        <BuildSequence mode="scroll" />
      </div>
    </section>
  );
}
