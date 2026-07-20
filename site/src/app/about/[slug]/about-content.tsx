"use client";

import { useContent } from "@/lib/use-content";
import { ClosingCta } from "@/components/homepage/closing-cta";
import type { ContentRow } from "@/lib/backend";

function blockValue(rows: ContentRow[], blockId: string, fallback: string): string {
  return rows.find((r) => r.block_id === blockId)?.value || fallback;
}

export function AboutContent({
  slug,
  fallback,
}: {
  slug: string;
  fallback: { title: string; subtitle: string; body: string[] };
}) {
  const { rows: contentRows } = useContent();

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
