// Fallback copy for every homepage Content block, used until staff populate
// the real rows via /admin/content (the Content sheet is empty on a fresh
// deploy). Keying by block_id lets /admin/content edit these in place later
// with no frontend change required — this is the single source of truth for
// which block_ids the homepage reads.
export const CONTENT_DEFAULTS: Record<string, string> = {
  homepage_eyebrow: "Booking now for this Sukkot season",
  homepage_hero_title: "Holiday Brothers",
  homepage_hero_subtitle:
    "Canvas up in a day, Construction built to last the season — sukkahs built and delivered across Rockland County.",
  homepage_about_teaser:
    "We're a crew of builders and drivers who actually put these up every season — not a marketplace reselling someone else's install. Every booking runs through the same pricing math, every quote comes from a person.",
  faq_q1: "What areas do you service?",
  faq_a1:
    "We're based in Rockland County, NY. If your address falls outside the county we'll still flag your booking for review — it isn't an automatic block, just a heads-up before we confirm.",
  faq_q2: "What happens if it rains?",
  faq_a2:
    "A booking can go on Weather Hold — we reschedule around the storm rather than cancel. You'll see the status update on your booking as soon as we make the call.",
  faq_q3: "What does \"guest\" mean when I book?",
  faq_a3:
    "You can lock in a booking with just a phone number or email — no account required. You'll get a booking code on your receipt that doubles as a temporary login if you want to check status later.",
  faq_q4: "How do I pick between Canvas, Modular, and Construction?",
  faq_a4:
    "Canvas is fabric-over-frame — fastest and most affordable. Modular is interlocking wood panels — a middle ground on speed and durability. Construction is a full nail-and-wood build — the most durable, built to last the season.",
};

export function contentValue(rows: { block_id: string; value: string }[], blockId: string): string {
  const row = rows.find((r) => r.block_id === blockId);
  return row?.value || CONTENT_DEFAULTS[blockId] || "";
}
