"use client";

import { useEffect, useMemo, useState } from "react";
import { BuildSequence } from "@/components/build-sequence";
import {
  EMPTY_ANSWERS,
  visibleSteps,
  type Answers,
  type StepKey,
} from "@/components/booking/types";
import {
  SuppliesStep,
  SizeStep,
  TypeStep,
  SpeedStep,
  DeliveryStep,
  AddressStep,
  AccountStep,
} from "@/components/booking/steps";
import { Confirmation } from "@/components/booking/confirmation";
import { calculatePrice, type PriceBreakdown } from "@/lib/pricing";
import { getPricing, submitBooking, workerSetPassword, type PricingRow } from "@/lib/backend";
import { setSession } from "@/lib/session";

const STEP_LABELS: Record<StepKey, string> = {
  supplies: "Supplies",
  size: "Size",
  type: "Type",
  speed: "Speed",
  delivery: "Delivery",
  address: "Address",
  account: "Account",
};

const STEP_STAGE: Record<StepKey, 0 | 1 | 2> = {
  supplies: 0,
  size: 0,
  type: 1,
  speed: 1,
  delivery: 1,
  address: 2,
  account: 2,
};

export default function BookingPage() {
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [index, setIndex] = useState(0);
  const [pricingRows, setPricingRows] = useState<PricingRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ bookingCode: string; price: PriceBreakdown } | null>(null);

  useEffect(() => {
    getPricing()
      .then((r) => setPricingRows(r.ok ? r.rows : []))
      .catch(() => setPricingRows([]));
  }, []);

  // Only has_supplies affects which steps are visible — narrower than
  // `answers` on purpose so picking a size/type doesn't reshuffle the list.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const steps = useMemo(() => visibleSteps(answers), [answers.has_supplies]);
  const currentKey = steps[Math.min(index, steps.length - 1)];

  const price = useMemo(
    () =>
      calculatePrice(
        pricingRows,
        answers.size,
        answers.sukkah_type,
        answers.speed_tier,
        answers.self_delivery,
        answers.worker_pickup
      ),
    [
      pricingRows,
      answers.size,
      answers.sukkah_type,
      answers.speed_tier,
      answers.self_delivery,
      answers.worker_pickup,
    ]
  );

  function update(patch: Partial<Answers>) {
    setAnswers((a) => ({ ...a, ...patch }));
  }

  function canAdvance(): boolean {
    switch (currentKey) {
      case "size":
        return answers.size !== "";
      case "type":
        return answers.sukkah_type !== "";
      case "speed":
        return answers.speed_tier !== "";
      case "address":
        return answers.street.trim() !== "";
      case "account":
        return (
          answers.accountPath !== "" &&
          (answers.email.trim() !== "" || answers.phone.trim() !== "") &&
          (answers.accountPath !== "full" || (answers.username.trim() !== "" && answers.password.trim() !== ""))
        );
      default:
        return true;
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const address = `${answers.street}, ${answers.city}, ${answers.state} ${answers.zip}`.trim();
      const res = await submitBooking({
        has_supplies: answers.has_supplies ? "TRUE" : "FALSE",
        size: answers.size,
        sukkah_type: answers.sukkah_type,
        speed_tier: answers.speed_tier,
        self_delivery: answers.self_delivery ? "TRUE" : "FALSE",
        worker_pickup: answers.worker_pickup ? "TRUE" : "FALSE",
        address,
        guest_ticket: answers.accountPath === "guest",
        name: `${answers.first_name} ${answers.last_name}`.trim(),
        username: answers.username,
        email: answers.email,
        phone: answers.phone,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (answers.accountPath === "full" && answers.password) {
        const pwRes = await workerSetPassword(res.account_id, answers.password);
        if (pwRes.ok) {
          setSession({ account_id: res.account_id, token: pwRes.token });
        }
      }
      setResult({ bookingCode: res.booking_code, price: res.price as unknown as PriceBreakdown });
    } catch {
      setError("Something went wrong submitting your booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Confirmation answers={answers} price={result.price} bookingCode={result.bookingCode} />
      </div>
    );
  }

  const isLast = index === steps.length - 1;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <ol className="mb-8 flex flex-wrap gap-2">
        {steps.map((key, i) => (
          <li
            key={key}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              i === index
                ? "border-primary bg-primary text-primary-foreground"
                : i < index
                  ? "border-border bg-secondary text-foreground"
                  : "border-border text-muted-foreground"
            }`}
          >
            {i + 1}. {STEP_LABELS[key]}
          </li>
        ))}
      </ol>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          {currentKey === "supplies" && <SuppliesStep answers={answers} update={update} />}
          {currentKey === "size" && <SizeStep answers={answers} update={update} />}
          {currentKey === "type" && <TypeStep answers={answers} update={update} />}
          {currentKey === "speed" && <SpeedStep answers={answers} update={update} />}
          {currentKey === "delivery" && (
            <DeliveryStep answers={answers} update={update} pricingRows={pricingRows} />
          )}
          {currentKey === "address" && <AddressStep answers={answers} update={update} />}
          {currentKey === "account" && <AccountStep answers={answers} update={update} />}

          {error && (
            <p className="mt-4 rounded-lg border-l-2 border-primary bg-primary/5 px-4 py-3 text-sm text-foreground">
              {error}
            </p>
          )}

          <div className="mt-8 flex gap-3">
            {index > 0 && (
              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                className="hover-wiggle rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:border-primary"
              >
                Back
              </button>
            )}
            {!isLast ? (
              <button
                type="button"
                disabled={!canAdvance()}
                onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}
                className="hover-wiggle rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                disabled={!canAdvance() || submitting}
                onClick={handleSubmit}
                className="hover-wiggle rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
              >
                {submitting ? "Locking it in…" : "Lock it in"}
              </button>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <BuildSequence
            mode="step"
            step={STEP_STAGE[currentKey]}
            sukkahType={answers.sukkah_type || "Construction"}
          />
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-eyebrow">Live estimate</p>
            <p className="mt-2 text-3xl font-display text-foreground">${price.total.toFixed(2)}</p>
            <dl className="mt-3 space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <dt>Base</dt>
                <dd>${price.base.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Size</dt>
                <dd>${price.size_mod.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Speed</dt>
                <dd>${price.speed_mod.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Type</dt>
                <dd>${price.type_mod.toFixed(2)}</dd>
              </div>
              {price.self_delivery_discount > 0 && (
                <div className="flex justify-between text-primary">
                  <dt>Self-delivery discount</dt>
                  <dd>-${price.self_delivery_discount.toFixed(2)}</dd>
                </div>
              )}
              {price.worker_pickup_discount > 0 && (
                <div className="flex justify-between text-primary">
                  <dt>Crew pickup discount</dt>
                  <dd>-${price.worker_pickup_discount.toFixed(2)}</dd>
                </div>
              )}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
