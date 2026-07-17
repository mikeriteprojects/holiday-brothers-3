import { getContent, type ContentRow } from "@/lib/backend";
import { Hero } from "@/components/homepage/hero";
import { NumberedNarrative } from "@/components/homepage/numbered-narrative";
import { AboutTeaser } from "@/components/homepage/about-teaser";
import { Faq } from "@/components/homepage/faq";
import { ClosingCta } from "@/components/homepage/closing-cta";

async function loadContent(): Promise<ContentRow[]> {
  try {
    const result = await getContent();
    return result.ok ? result.rows : [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const contentRows = await loadContent();

  return (
    <div className="flex flex-col">
      <Hero contentRows={contentRows} />
      <NumberedNarrative />
      <AboutTeaser contentRows={contentRows} />
      <Faq contentRows={contentRows} />
      <ClosingCta />
    </div>
  );
}
