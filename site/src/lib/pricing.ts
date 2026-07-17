import type { PricingRow } from "./backend";

// Mirrors calculatePrice_ in backend/HolidayBrothersBackend.gs exactly, so
// the live estimate shown during booking matches what the backend computes
// on submit. Falls back to the same defaults the backend uses when a
// Pricing row hasn't been set yet (fresh/empty sheet).

function pricingModifier(rows: PricingRow[], component: string, key: string): number {
  const row = rows.find((r) => r.formula_component === component && r.sukkah_type_or_tier === key);
  return row ? Number(row.value || 0) : 0;
}

export type PriceBreakdown = {
  base: number;
  size_mod: number;
  speed_mod: number;
  type_mod: number;
  self_delivery_discount: number;
  worker_pickup_discount: number;
  total: number;
};

export function calculatePrice(
  rows: PricingRow[],
  size: string,
  sukkahType: string,
  speedTier: string,
  selfDelivery = false,
  workerPickup = false
): PriceBreakdown {
  const base = pricingModifier(rows, "base", "Small/Canvas/Regular") || 75;
  const sizeMod = size === "Small" ? 0 : pricingModifier(rows, "size_mod", size);
  const speedMod = pricingModifier(rows, "speed_mod", speedTier);
  const typeMod = pricingModifier(rows, "type_mod", sukkahType);
  const selfDeliveryDiscount = selfDelivery ? pricingModifier(rows, "discount", "self_delivery") : 0;
  const workerPickupDiscount = workerPickup ? pricingModifier(rows, "discount", "worker_pickup") : 0;
  return {
    base,
    size_mod: sizeMod,
    speed_mod: speedMod,
    type_mod: typeMod,
    self_delivery_discount: selfDeliveryDiscount,
    worker_pickup_discount: workerPickupDiscount,
    total: base + sizeMod + speedMod + typeMod - selfDeliveryDiscount - workerPickupDiscount,
  };
}
