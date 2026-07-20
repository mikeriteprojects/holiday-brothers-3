"use client";

import { useEffect, useState } from "react";
import type { Answers } from "./types";
import { OptionCard } from "./option-card";
import { geocodeAddress, isInServiceArea, type GeocodeResult } from "@/lib/service-area";
import type { PricingRow } from "@/lib/backend";
import { formatMoney } from "@/lib/format";

type StepProps = {
  answers: Answers;
  update: (patch: Partial<Answers>) => void;
};

function discountAmount(rows: PricingRow[], key: string): number {
  const row = rows.find((r) => r.formula_component === "discount" && r.sukkah_type_or_tier === key);
  return row ? Number(row.value || 0) : 0;
}

export function SuppliesStep({ answers, update }: StepProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-display-md text-foreground">Do you already have supplies?</h2>
      <p className="text-sm text-muted-foreground">
        If you&apos;re sourcing your own canvas, panels, or lumber, we skip the delivery step entirely —
        it only applies when we&apos;re sourcing supplies for you.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <OptionCard
          selected={answers.has_supplies === false}
          onClick={() => update({ has_supplies: false })}
          title="No, I need supplies"
          subtitle="We'll source and deliver, with a delivery step next."
        />
        <OptionCard
          selected={answers.has_supplies === true}
          onClick={() => update({ has_supplies: true })}
          title="Yes, I have my own"
          subtitle="We'll skip straight past delivery."
        />
      </div>
    </div>
  );
}

const SIZES: { key: Answers["size"]; subtitle: string }[] = [
  { key: "Small", subtitle: "A tight yard or a small family." },
  { key: "Medium", subtitle: "The most common choice." },
  { key: "Large", subtitle: "Room for a full table and then some." },
];

export function SizeStep({ answers, update }: StepProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-display-md text-foreground">What size sukkah?</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {SIZES.map((s) => (
          <OptionCard
            key={s.key}
            selected={answers.size === s.key}
            onClick={() => update({ size: s.key })}
            title={s.key as string}
            subtitle={s.subtitle}
          />
        ))}
      </div>
    </div>
  );
}

const TYPES: { key: Answers["sukkah_type"]; subtitle: string; swatch: string }[] = [
  { key: "Canvas", subtitle: "Fabric-over-frame — fastest, most affordable.", swatch: "var(--method-canvas)" },
  { key: "Modular", subtitle: "Interlocking wood panels — a middle ground.", swatch: "var(--method-modular)" },
  { key: "Construction", subtitle: "Full nail-and-wood — built to last the season.", swatch: "var(--method-construction)" },
];

export function TypeStep({ answers, update }: StepProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-display-md text-foreground">Which build method?</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {TYPES.map((t) => (
          <OptionCard
            key={t.key}
            selected={answers.sukkah_type === t.key}
            onClick={() => update({ sukkah_type: t.key })}
            title={t.key as string}
            subtitle={t.subtitle}
            swatch={t.swatch}
          />
        ))}
      </div>
    </div>
  );
}

const SPEEDS: { key: Answers["speed_tier"]; subtitle: string }[] = [
  { key: "Patient", subtitle: "Flexible timing, the cheapest tier." },
  { key: "Regular", subtitle: "Standard turnaround." },
  { key: "Express", subtitle: "Rushed, premium pricing." },
];

export function SpeedStep({ answers, update }: StepProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-display-md text-foreground">How soon do you need it?</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {SPEEDS.map((s) => (
          <OptionCard
            key={s.key}
            selected={answers.speed_tier === s.key}
            onClick={() => update({ speed_tier: s.key })}
            title={s.key as string}
            subtitle={s.subtitle}
          />
        ))}
      </div>
    </div>
  );
}

export function DeliveryStep({
  answers,
  update,
  pricingRows,
}: StepProps & { pricingRows: PricingRow[] }) {
  const selfDeliveryAmount = discountAmount(pricingRows, "self_delivery");
  const workerPickupAmount = discountAmount(pricingRows, "worker_pickup");

  return (
    <div className="space-y-3">
      <h2 className="text-display-md text-foreground">Delivery discounts</h2>
      <p className="text-sm text-muted-foreground">
        Two independent, stackable ways to save — pulled live from our current pricing.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
          <input
            type="checkbox"
            checked={answers.self_delivery}
            onChange={(e) => update({ self_delivery: e.target.checked })}
            className="mt-1 h-4 w-4 accent-[var(--primary)]"
          />
          <span>
            <span className="block font-semibold text-foreground">
              Self-deliver{selfDeliveryAmount > 0 && ` — save ${formatMoney(selfDeliveryAmount)}`}
            </span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              Pick up the materials yourself and save.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
          <input
            type="checkbox"
            checked={answers.worker_pickup}
            onChange={(e) => update({ worker_pickup: e.target.checked })}
            className="mt-1 h-4 w-4 accent-[var(--primary)]"
          />
          <span>
            <span className="block font-semibold text-foreground">
              Pick up the crew{workerPickupAmount > 0 && ` — save ${formatMoney(workerPickupAmount)}`}
            </span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              Save by bringing the crew to the job yourself.
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}

export function AddressStep({ answers, update }: StepProps) {
  const [query, setQuery] = useState(answers.street);
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [warning, setWarning] = useState(false);

  useEffect(() => {
    if (!query || query === answers.street) return;
    const handle = setTimeout(async () => {
      const results = await geocodeAddress(query);
      setSuggestions(results);
    }, 500);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (!answers.zip && !answers.county) return;
    setWarning(!isInServiceArea(answers.county || undefined, answers.zip || undefined));
  }, [answers.zip, answers.county]);

  function selectSuggestion(r: GeocodeResult) {
    update({
      street: r.street || query,
      city: r.city || "",
      state: r.state || "",
      zip: r.zip || "",
      county: r.county || "",
    });
    setSuggestions([]);
  }

  return (
    <div className="space-y-3">
      <h2 className="text-display-md text-foreground">Where&apos;s the build?</h2>
      <div className="relative">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            update({ street: e.target.value });
          }}
          placeholder="Street address"
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
            {suggestions.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => selectSuggestion(r)}
                  className="block w-full px-4 py-2 text-left text-sm text-foreground hover:bg-secondary"
                >
                  {r.displayName}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <input
          value={answers.city}
          onChange={(e) => update({ city: e.target.value })}
          placeholder="City"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        />
        <input
          value={answers.state}
          onChange={(e) => update({ state: e.target.value })}
          placeholder="State"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        />
        <input
          value={answers.zip}
          onChange={(e) => update({ zip: e.target.value })}
          placeholder="Zip"
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        />
      </div>
      {warning && (
        <p className="rounded-lg border-l-2 border-primary bg-primary/5 px-4 py-3 text-sm text-foreground">
          This address looks outside Rockland County — we may not be able to service it this
          season. You can still submit; we&apos;ll follow up either way.
        </p>
      )}
    </div>
  );
}

export function AccountStep({ answers, update }: StepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-display-md text-foreground">Let&apos;s lock it in</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <OptionCard
          selected={answers.accountPath === "full"}
          onClick={() => update({ accountPath: "full" })}
          title="Full account"
          subtitle="Name, username, password, email, phone — log in normally afterward."
        />
        <OptionCard
          selected={answers.accountPath === "guest"}
          onClick={() => update({ accountPath: "guest" })}
          title="Guest — no account needed"
          subtitle="Just an email or phone. Your booking code doubles as a login later."
        />
      </div>

      {answers.accountPath === "full" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={answers.first_name}
            onChange={(e) => update({ first_name: e.target.value })}
            placeholder="First name"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          />
          <input
            value={answers.last_name}
            onChange={(e) => update({ last_name: e.target.value })}
            placeholder="Last name"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          />
          <input
            value={answers.username}
            onChange={(e) => update({ username: e.target.value })}
            placeholder="Username"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          />
          <input
            value={answers.password}
            onChange={(e) => update({ password: e.target.value })}
            placeholder="Password"
            type="password"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          />
        </div>
      )}

      {answers.accountPath !== "" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={answers.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="Email"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          />
          <input
            value={answers.phone}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="Phone"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          />
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        We need your address plus at least one of phone or email to submit.
      </p>
    </div>
  );
}
