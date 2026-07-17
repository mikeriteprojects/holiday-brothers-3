"use client";

import { useMemo, useState } from "react";
import { submitCrewApplication } from "@/lib/backend";

type CrewRole = "Builder Only" | "Builder + Driver" | "Driver Only";

type Form = {
  name: string;
  email: string;
  phone: string;
  birthday: string;
  crew_role: CrewRole | "";
  driving_subtype: string;
  school: string;
  prior_work: boolean;
  address: string;
  transport_guaranteed: boolean;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  guardian_contact_name: string;
  guardian_contact_phone: string;
  medical_experience: boolean;
  medical_cert_url: string;
  waiver_accepted: boolean;
};

const EMPTY: Form = {
  name: "",
  email: "",
  phone: "",
  birthday: "",
  crew_role: "",
  driving_subtype: "",
  school: "",
  prior_work: false,
  address: "",
  transport_guaranteed: false,
  emergency_contact_name: "",
  emergency_contact_phone: "",
  guardian_contact_name: "",
  guardian_contact_phone: "",
  medical_experience: false,
  medical_cert_url: "",
  waiver_accepted: false,
};

// Mirrors the backend's own age math (actSubmitCrewApplication_ computes
// requires_parental_consent as age < 16) so the live warning shown here
// never disagrees with what the server returns on submit.
function computeAge(birthday: string): number | null {
  if (!birthday) return null;
  const birth = new Date(birthday);
  if (Number.isNaN(birth.getTime())) return null;
  return Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
}

export default function JoinCrewPage() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ requiresConsent: boolean } | null>(null);

  const age = useMemo(() => computeAge(form.birthday), [form.birthday]);
  const needsDriving = form.crew_role === "Builder + Driver" || form.crew_role === "Driver Only";
  const needsGuardian = age !== null && age < 18;

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitCrewApplication({
        name: form.name,
        email: form.email,
        phone: form.phone,
        birthday: form.birthday,
        crew_role: form.crew_role,
        driving_subtype: form.driving_subtype,
        school: form.school,
        prior_work: form.prior_work ? "TRUE" : "FALSE",
        address: form.address,
        transport_guaranteed: form.transport_guaranteed ? "TRUE" : "FALSE",
        emergency_contact_name: form.emergency_contact_name,
        emergency_contact_phone: form.emergency_contact_phone,
        guardian_contact_name: form.guardian_contact_name,
        guardian_contact_phone: form.guardian_contact_phone,
        medical_experience: form.medical_experience ? "TRUE" : "FALSE",
        medical_cert_url: form.medical_cert_url,
        waiver_accepted: form.waiver_accepted ? "TRUE" : "FALSE",
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult({ requiresConsent: res.requires_parental_consent });
    } catch {
      setError("Something went wrong submitting your application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="text-eyebrow">Application submitted</p>
        <h1 className="text-display-lg mt-2 text-foreground">You&apos;re on the list.</h1>
        <p className="mt-4 text-muted-foreground">
          {result.requiresConsent
            ? "Since you're under 16, we'll need parental sign-off before this moves forward — we'll be in touch with next steps."
            : "We'll review your application and follow up with next steps."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-eyebrow">Join the crew</p>
      <h1 className="text-display-xl mt-2 text-foreground">Build sukkahs with us.</h1>
      <p className="mt-3 text-muted-foreground">
        Builder, driver, or both — tell us who you are and what you can do.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-8">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Full name"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          />
          <input
            required
            type="date"
            value={form.birthday}
            onChange={(e) => set("birthday", e.target.value)}
            placeholder="Date of birth"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          />
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
          <input
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="Address"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground sm:col-span-2"
          />
          <input
            value={form.school}
            onChange={(e) => set("school", e.target.value)}
            placeholder="School / Yeshiva"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground sm:col-span-2"
          />
        </div>

        {age !== null && needsGuardian && (
          <p className="rounded-lg border-l-2 border-primary bg-primary/5 px-4 py-3 text-sm text-foreground">
            You&apos;re {age}, so we&apos;ll need a parent or guardian contact below.
          </p>
        )}

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-foreground">Role</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {(["Builder Only", "Builder + Driver", "Driver Only"] as CrewRole[]).map((role) => (
              <button
                type="button"
                key={role}
                onClick={() => set("crew_role", role)}
                className={`rounded-xl border p-3 text-sm font-medium ${
                  form.crew_role === role ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
          {needsDriving && (
            <input
              value={form.driving_subtype}
              onChange={(e) => set("driving_subtype", e.target.value)}
              placeholder="Driving subtype (e.g. own vehicle, van)"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
            />
          )}
        </fieldset>

        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="mb-1 text-sm font-semibold text-foreground sm:col-span-2">
            Emergency contact
          </legend>
          <input
            value={form.emergency_contact_name}
            onChange={(e) => set("emergency_contact_name", e.target.value)}
            placeholder="Name"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          />
          <input
            value={form.emergency_contact_phone}
            onChange={(e) => set("emergency_contact_phone", e.target.value)}
            placeholder="Phone"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          />
        </fieldset>

        {needsGuardian && (
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-1 text-sm font-semibold text-foreground sm:col-span-2">
              Parent / guardian contact
            </legend>
            <input
              value={form.guardian_contact_name}
              onChange={(e) => set("guardian_contact_name", e.target.value)}
              placeholder="Name"
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
            />
            <input
              value={form.guardian_contact_phone}
              onChange={(e) => set("guardian_contact_phone", e.target.value)}
              placeholder="Phone"
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
            />
          </fieldset>
        )}

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.prior_work}
              onChange={(e) => set("prior_work", e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            I have prior build/labor experience
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.transport_guaranteed}
              onChange={(e) => set("transport_guaranteed", e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            I have guaranteed transport to job sites
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.medical_experience}
              onChange={(e) => set("medical_experience", e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            I have medical training / certification
          </label>
          {form.medical_experience && (
            <input
              value={form.medical_cert_url}
              onChange={(e) => set("medical_cert_url", e.target.value)}
              placeholder="Certification link (optional)"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
            />
          )}
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              required
              type="checkbox"
              checked={form.waiver_accepted}
              onChange={(e) => set("waiver_accepted", e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            I accept the liability waiver
          </label>
        </div>

        {error && (
          <p className="rounded-lg border-l-2 border-primary bg-primary/5 px-4 py-3 text-sm text-foreground">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !form.crew_role}
          className="hover-wiggle rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          {submitting ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </div>
  );
}
