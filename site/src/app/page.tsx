"use client";

import { useContent } from "@/lib/use-content";
import { Hero } from "@/components/homepage/hero";
import { NumberedNarrative } from "@/components/homepage/numbered-narrative";
import { AboutTeaser } from "@/components/homepage/about-teaser";
import { Faq } from "@/components/homepage/faq";
import { ClosingCta } from "@/components/homepage/closing-cta";
import { SeasonMarquee } from "@/components/homepage/season-marquee";

export default function Home() {
  const { rows: contentRows } = useContent();

  return (
    <div className="flex flex-col">
      <Hero contentRows={contentRows} />
      <SeasonMarquee direction="left" />
      <NumberedNarrative />
      <AboutTeaser contentRows={contentRows} />
      <SeasonMarquee direction="right" />
      <Faq contentRows={contentRows} />
      <ClosingCta />
    </div>
  );
}
