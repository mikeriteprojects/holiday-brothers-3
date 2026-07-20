import Link from "next/link";
import { contentValue } from "./content-defaults";
import type { ContentRow } from "@/lib/backend";

// The homepage previously had no about-us presence at all — this teases
// the real /about/our-story page (same Content-block CMS, same type
// system) rather than duplicating its copy inline. The whole card is one
// link (glow-hover signals that), not just the visible pill inside it.
export function AboutTeaser({ contentRows }: { contentRows: ContentRow[] }) {
  const body = contentValue(contentRows, "homepage_about_teaser");

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <Link
        href="/about/our-story"
        className="glow-hover grid gap-8 rounded-2xl border border-border bg-card p-8 sm:grid-cols-[1fr_auto] sm:items-center"
      >
        <div>
          <p className="text-eyebrow">About us</p>
          <h2 className="text-display-lg mt-2 text-foreground">Built by people who build sukkahs.</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">{body}</p>
        </div>
        <span className="hover-wiggle inline-block whitespace-nowrap rounded-full border border-border px-6 py-3 text-center text-sm font-semibold text-foreground">
          Read our story
        </span>
      </Link>
    </section>
  );
}
