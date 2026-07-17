import type { Answers } from "./types";
import type { PriceBreakdown } from "@/lib/pricing";

type Props = {
  answers: Answers;
  price: PriceBreakdown;
  bookingCode: string;
};

// Guest and full-account are genuinely different end states, not one glossed
// as the other (UserJourney.md §2.3). No payment/cart language anywhere —
// "Paid" is a manually-set staff status, never charged from here.
export function Confirmation({ answers, price, bookingCode }: Props) {
  if (answers.accountPath === "guest") {
    return (
      <div className="space-y-6 rounded-2xl border border-border bg-card p-8 print:border-0">
        <div>
          <p className="text-eyebrow">Booking submitted</p>
          <h2 className="text-display-md mt-1 text-foreground">Booking code: {bookingCode}</h2>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <dt className="text-muted-foreground">Size / Type / Speed</dt>
          <dd className="text-foreground">
            {answers.size} · {answers.sukkah_type} · {answers.speed_tier}
          </dd>
          <dt className="text-muted-foreground">Address</dt>
          <dd className="text-foreground">
            {answers.street}, {answers.city}, {answers.state} {answers.zip}
          </dd>
        </dl>
        <div className="border-t border-border pt-4 text-sm">
          <PriceLines price={price} />
        </div>
        <p className="rounded-lg bg-secondary px-4 py-3 text-sm text-foreground">
          Your temporary guest login code is your booking code:{" "}
          <strong className="font-mono">{bookingCode}</strong> — use it at{" "}
          <span className="font-mono">/worker-login</span> to check status later.
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="hover-wiggle rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground hover:border-primary print:hidden"
        >
          Print receipt
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-8">
      <div>
        <p className="text-eyebrow">You&apos;re all set, {answers.first_name}</p>
        <h2 className="text-display-md mt-1 text-foreground">Confirmation code: {bookingCode}</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Estimated total: <strong className="text-foreground">${price.total.toFixed(2)}</strong> — you
        can log in any time at <span className="font-mono">/worker-login</span> with your username
        and password to track this booking.
      </p>
    </div>
  );
}

function PriceLines({ price }: { price: PriceBreakdown }) {
  return (
    <div className="space-y-1">
      <Row label="Base" value={price.base} />
      <Row label="Size" value={price.size_mod} />
      <Row label="Speed" value={price.speed_mod} />
      <Row label="Type" value={price.type_mod} />
      {price.self_delivery_discount > 0 && <Row label="Self-delivery discount" value={-price.self_delivery_discount} />}
      {price.worker_pickup_discount > 0 && <Row label="Crew pickup discount" value={-price.worker_pickup_discount} />}
      <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold text-foreground">
        <span>Total</span>
        <span>${price.total.toFixed(2)}</span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span>${value.toFixed(2)}</span>
    </div>
  );
}
