"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, setSession } from "@/lib/session";
import { adminLogin } from "@/lib/backend";

const SECTIONS = [
  { href: "/admin/bookings", label: "Bookings / leads", desc: "View, update status, delete." },
  { href: "/admin/crew", label: "Crew & workers", desc: "Applications, hiring, role assignment." },
  { href: "/admin/jobs", label: "Jobs", desc: "Create and track scheduling." },
  { href: "/admin/vendors", label: "Vendors", desc: "Approve applications, set tiers." },
  { href: "/admin/content", label: "Content", desc: "Draft/publish CMS — copy, pricing, FAQ, testimonials." },
  { href: "/admin/rewards", label: "Rewards & points", desc: "Reward catalog, redemptions, ledger." },
  { href: "/admin/roles", label: "Roles & permissions", desc: "Custom roles, permission toggles." },
  { href: "/admin/settings", label: "Settings", desc: "Cancellation-fee tiers, thresholds." },
  { href: "/admin/incidents", label: "Incidents & reviews", desc: "On-site issues, customer feedback." },
] as const;

export default function AdminHome() {
  const { session, loaded } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await adminLogin(username.trim(), password);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSession({ account_id: res.account_id, token: res.token, permissions: res.permissions });
    } catch {
      setError("Couldn't reach the login service. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = loaded && !!session?.permissions;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-sm py-10">
        <p className="text-eyebrow">Staff only</p>
        <h1 className="text-display-lg mt-2 text-foreground">Admin login</h1>
        <form onSubmit={handleLogin} className="mt-8 space-y-3">
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username, email, or phone"
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground"
          />
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground"
          />
          <button
            type="submit"
            disabled={loading}
            className="hover-wiggle w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>
        {error && (
          <p className="mt-4 rounded-lg border-l-2 border-primary bg-primary/5 px-4 py-3 text-sm text-foreground">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="text-eyebrow">Admin</p>
      <h1 className="text-display-lg mt-2 text-foreground">What do you need?</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary"
          >
            <p className="font-semibold text-foreground">{s.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
