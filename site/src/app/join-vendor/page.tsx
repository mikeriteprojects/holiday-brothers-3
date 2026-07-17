"use client";

import { useState } from "react";
import { submitVendorApplication } from "@/lib/backend";

type Form = {
  business_name: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  service_area: string;
  stock_status: string;
  rental_availability: boolean;
  delivery_capability: boolean;
};

const EMPTY: Form = {
  business_name: "",
  email: "",
  phone: "",
  address: "",
  category: "",
  service_area: "",
  stock_status: "",
  rental_availability: false,
  delivery_capability: false,
};

export default function JoinVendorPage() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitVendorApplication({
        business_name: form.business_name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        category: form.category,
        service_area: form.service_area,
        stock_status: form.stock_status,
        rental_availability: form.rental_availability ? "TRUE" : "FALSE",
        delivery_capability: form.delivery_capability ? "TRUE" : "FALSE",
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong submitting your application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="text-eyebrow">Application submitted for review</p>
        <h1 className="text-display-lg mt-2 text-foreground">Thanks — we&apos;ll be in touch.</h1>
        <p className="mt-4 text-muted-foreground">
          Once approved, you&apos;ll be able to log in at <span className="font-mono">/worker-login</span>{" "}
          with the email or phone you gave us.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-eyebrow">Become a vendor</p>
      <h1 className="text-display-xl mt-2 text-foreground">Supply materials for real builds.</h1>
      <p className="mt-3 text-muted-foreground">
        We work with canvas, panel, and lumber suppliers across Rockland County. Tell us about your
        business — every application is reviewed before it&apos;s approved.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-4">
        <input
          required
          value={form.business_name}
          onChange={(e) => set("business_name", e.target.value)}
          placeholder="Business name"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            required
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="Email"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          />
          <input
            required
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="Phone"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          />
        </div>
        <input
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          placeholder="Business address"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            placeholder="Category (e.g. Canvas Supplier, Lumber)"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          />
          <input
            value={form.service_area}
            onChange={(e) => set("service_area", e.target.value)}
            placeholder="Service area"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          />
        </div>
        <input
          value={form.stock_status}
          onChange={(e) => set("stock_status", e.target.value)}
          placeholder="Current stock status"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        />
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.rental_availability}
              onChange={(e) => set("rental_availability", e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            We offer rental availability
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.delivery_capability}
              onChange={(e) => set("delivery_capability", e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            We can deliver
          </label>
        </div>

        {error && (
          <p className="rounded-lg border-l-2 border-primary bg-primary/5 px-4 py-3 text-sm text-foreground">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="hover-wiggle rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          {submitting ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </div>
  );
}
