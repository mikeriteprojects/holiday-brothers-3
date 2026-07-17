// Service-area check is advisory, never a hard gate (UserJourney.md §2.2 step
// 6): the geocoder's returned county is authoritative when present (must
// equal "Rockland County" exactly), otherwise falls back to this zip
// whitelist. This starter list should be refined by staff over time — it's
// not wired to a CMS sheet, so treat it as a reasonable approximation, not
// a legal service-area boundary.
export const ROCKLAND_COUNTY_ZIPS = [
  "10901", "10913", "10920", "10923", "10924", "10927", "10930", "10931",
  "10952", "10956", "10960", "10962", "10963", "10964", "10965", "10968",
  "10970", "10974", "10976", "10977", "10980", "10982", "10983", "10984",
  "10985", "10986", "10987", "10989", "10990", "10993", "10994", "10998",
];

export type GeocodeResult = {
  displayName: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  county?: string;
};

export async function geocodeAddress(query: string): Promise<GeocodeResult[]> {
  if (!query || query.trim().length < 4) return [];
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "us");
  url.searchParams.set("limit", "5");
  url.searchParams.set("q", query);

  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{
    display_name: string;
    address?: Record<string, string>;
  }>;

  return data.map((r) => ({
    displayName: r.display_name,
    street: [r.address?.house_number, r.address?.road].filter(Boolean).join(" ") || undefined,
    city: r.address?.city || r.address?.town || r.address?.village || undefined,
    state: r.address?.state || undefined,
    zip: r.address?.postcode || undefined,
    county: r.address?.county || undefined,
  }));
}

export function isInServiceArea(county: string | undefined, zip: string | undefined): boolean {
  if (county) return county === "Rockland County";
  if (zip) return ROCKLAND_COUNTY_ZIPS.includes(zip.slice(0, 5));
  return true; // no info to warn on — advisory only, never blocks
}
