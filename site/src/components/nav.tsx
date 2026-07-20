"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useSession } from "@/lib/session";
import { ThemeToggle } from "@/components/theme-toggle";
import { TransitionLink } from "@/components/page-transition-links";
import { PointsBadge } from "@/components/points-badge";

export function Nav() {
  const { session, loaded } = useSession();
  const isAdmin = session?.permissions !== undefined;
  const [menuOpen, setMenuOpen] = useState(false);

  const accountLink =
    loaded && session ? (
      <Link
        href="/worker-portal"
        onClick={() => setMenuOpen(false)}
        className="hover-wiggle rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary"
      >
        My Portal
      </Link>
    ) : (
      <Link
        href="/worker-login"
        onClick={() => setMenuOpen(false)}
        className="hover-wiggle rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary"
      >
        Log In
      </Link>
    );

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="text-display-md font-display text-foreground">
          Holiday Brothers
        </Link>

        {/* Desktop: everything inline. */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {loaded && session && <PointsBadge accountId={session.account_id} />}
          {isAdmin && (
            <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Admin
            </Link>
          )}
          {accountLink}
          <TransitionLink
            href="/join-crew"
            kind="lulav"
            className="hover-wiggle rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary"
          >
            Join Crew
          </TransitionLink>
          <TransitionLink
            href="/booking"
            kind="esrog"
            className="hover-wiggle rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Book Now
          </TransitionLink>
        </div>

        {/* Mobile: Book Now stays visible (the one action worth one-tap access), everything else collapses. */}
        <div className="flex items-center gap-2 md:hidden">
          <TransitionLink
            href="/booking"
            kind="esrog"
            className="hover-wiggle rounded-full bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            Book Now
          </TransitionLink>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <ThemeToggle />
              {loaded && session && <PointsBadge accountId={session.account_id} />}
            </div>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Admin
              </Link>
            )}
            {accountLink}
            <TransitionLink
              href="/join-crew"
              kind="lulav"
              className="hover-wiggle rounded-full border border-border px-4 py-2 text-center text-sm font-semibold text-foreground"
            >
              Join Crew
            </TransitionLink>
          </div>
        </div>
      )}
    </header>
  );
}
