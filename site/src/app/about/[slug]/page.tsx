import { notFound } from "next/navigation";
import { getContent, type ContentRow } from "@/lib/backend";
import { ClosingCta } from "@/components/homepage/closing-cta";

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

function blockValue(rows: ContentRow[], blockId: string, fallback: string): string {
  return rows.find((r) => r.block_id === blockId)?.value || fallback;
}

export default async function AboutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fallback = DEFAULTS[slug];
  if (!fallback) notFound();

  let contentRows: ContentRow[] = [];
  try {
    const res = await getContent();
    contentRows = res.ok ? res.rows : [];
  } catch {
    contentRows = [];
  }

  const title = blockValue(contentRows, `about_${slug}_title`, fallback.title);
  const subtitle = blockValue(contentRows, `about_${slug}_subtitle`, fallback.subtitle);
  const bodyRaw = blockValue(contentRows, `about_${slug}_body`, fallback.body.join("\n\n"));
  const paragraphs = bodyRaw.split("\n\n").filter(Boolean);

  return (
    <div className="flex flex-col">
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-8">
        <p className="text-eyebrow">About</p>
        <h1 className="text-display-xl mt-3 text-foreground">{title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>
        <div className="mt-8 space-y-4 text-foreground">
          {paragraphs.map((p, i) => (
            <p key={i} className="leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      </section>
      <ClosingCta />
    </div>
  );
}
