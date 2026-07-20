"use client";

import { useState } from "react";
import { getBookingStatus, type BookingRow } from "@/lib/backend";
import { formatMoney } from "@/lib/format";

// The customer-facing lookup UserJourney.md §2.4 resolves to build — guests
// can check status without fully logging in, using the backend's existing
// code + phone lookup.
export default function TrackBookingPage() {
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setBooking(null);
    try {
      const res = await getBookingStatus(code.trim(), phone.trim() || undefined);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setBooking(res.booking);
    } catch {
      setError("Couldn't reach the booking lookup. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <p className="text-eyebrow">Track my booking</p>
      <h1 className="text-display-lg mt-2 text-foreground">Check your status</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Your booking code is on your receipt — it&apos;s also your temporary guest login.
      </p>

      <form onSubmit={handleLookup} className="mt-8 space-y-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Booking code"
          required
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone (optional, confirms it's yours)"
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground"
        />
        <button
          type="submit"
          disabled={loading}
          className="hover-wiggle rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          {loading ? "Looking up…" : "Check status"}
        </button>
      </form>

      {error && (
        <p className="mt-6 rounded-lg border-l-2 border-primary bg-primary/5 px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      )}

      {booking && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <p className="text-eyebrow">{booking.status}</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            {booking.size} {booking.sukkah_type} · {booking.speed_tier}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{booking.address}</p>
          <p className="mt-2 text-sm text-foreground">Total: {formatMoney(Number(booking.price_total))}</p>
        </div>
      )}
    </div>
  );
}
