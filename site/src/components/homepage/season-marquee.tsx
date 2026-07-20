const SEASON_TEXT = "AUGUST 16TH — SEPTEMBER 24TH · BOOKING NOW FOR THIS SUKKOT SEASON";

// Two of these run on the homepage, scrolling in opposite directions
// (direction prop), each row duplicated so the CSS translate(-50%) loop is
// seamless.
export function SeasonMarquee({ direction = "left" }: { direction?: "left" | "right" }) {
  const row = (
    <span className="flex shrink-0 items-center gap-8 pr-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="text-display-md font-display whitespace-nowrap text-foreground/80">
          {SEASON_TEXT}
        </span>
      ))}
    </span>
  );

  return (
    <div className="overflow-hidden border-y border-border bg-secondary py-4">
      <div className={`marquee-track ${direction === "left" ? "marquee-left" : "marquee-right"}`}>
        {row}
        {row}
      </div>
    </div>
  );
}
