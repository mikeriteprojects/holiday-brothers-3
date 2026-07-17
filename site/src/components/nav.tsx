"use client";

import Link from "next/link";
import { useSession } from "@/lib/session";
import { ThemeToggle } from "@/components/theme-toggle";
import { TransitionLink } from "@/components/page-transition-links";

export function Nav() {
  const { session, loaded } = useSession();
  const isAdmin = session?.permissions !== undefined;

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="text-display-md font-display text-foreground">
          Holiday Brothers
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {loaded && session ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/worker-portal"
                className="hover-wiggle rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary"
              >
                My Portal
              </Link>
            </>
          ) : (
            <Link
              href="/worker-login"
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
            >
              Log In
            </Link>
          )}
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
      </div>
    </header>
  );
}
