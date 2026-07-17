"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearSession } from "@/lib/session";
import { useRouter } from "next/navigation";

const SECTIONS = [
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/crew", label: "Crew" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/rewards", label: "Rewards" },
  { href: "/admin/roles", label: "Roles" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/incidents", label: "Incidents" },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="border-b border-border bg-secondary">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 overflow-x-auto px-6 py-3">
        <nav className="flex items-center gap-1">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === s.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => {
            clearSession();
            router.push("/admin");
          }}
          className="whitespace-nowrap text-sm text-muted-foreground hover:text-foreground"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
