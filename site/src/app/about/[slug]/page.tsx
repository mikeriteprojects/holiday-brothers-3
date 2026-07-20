import { notFound } from "next/navigation";
import { AboutContent } from "./about-content";

// Statically generated from Content blocks (block_id convention:
// about_<slug>_title / about_<slug>_subtitle / about_<slug>_body), same type
// system and motion language as the homepage — full density, not a thin
// template. Real slugs are just more Content rows; nothing here changes.
const ABOUT_SLUGS = ["our-story"] as const;

const DEFAULTS: Record<string, { title: string; subtitle: string; body: string[] }> = {
  "our-story": {
    title: "Why Holiday Brothers",
    subtitle: "A sukkah is a temporary structure with a permanent standard.",
    body: [
      "We build and deliver sukkahs across Rockland County in three real construction methods — Canvas, Modular, and Construction — because different families need different things from a week-long structure.",
      "Every booking runs through the same seven-step sequence, in the same order, because the pricing math depends on it. No hidden fees, no reordering the steps to make a sale look better.",
      "There's no online payment on this site by design — quotes get confirmed by a person, and 'Paid' is a status our staff sets manually once the job is settled.",
    ],
  },
};

export function generateStaticParams() {
  return ABOUT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fallback = DEFAULTS[slug];
  if (!fallback) return { title: "Holiday Brothers" };
  return { title: `${fallback.title} — Holiday Brothers`, description: fallback.subtitle };
}

export default async function AboutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fallback = DEFAULTS[slug];
  if (!fallback) notFound();

  return <AboutContent slug={slug} fallback={fallback} />;
}
