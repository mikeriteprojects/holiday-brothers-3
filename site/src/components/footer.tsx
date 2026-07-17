import Link from "next/link";

const COLUMNS = [
  {
    heading: "Book",
    links: [
      { href: "/booking", label: "Start a booking" },
      { href: "/booking/track", label: "Track my booking" },
    ],
  },
  {
    heading: "Work with us",
    links: [
      { href: "/join-crew", label: "Join the crew" },
      { href: "/join-vendor", label: "Become a vendor" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/worker-login", label: "Log in" },
      { href: "/worker-portal", label: "My portal" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <p className="text-display-md font-display text-foreground">Holiday Brothers</p>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Canvas, Modular, and Construction sukkahs — built and delivered across Rockland
              County, NY.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <p className="text-eyebrow">{col.heading}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-12 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Holiday Brothers. Built for Sukkot, one season at a time.
        </p>
      </div>
    </footer>
  );
}
