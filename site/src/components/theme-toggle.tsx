"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { getStoredTheme, setTheme, type ThemePreference } from "@/lib/theme";

const CYCLE: ThemePreference[] = ["system", "light", "dark"];
const ICON = { system: Monitor, light: Sun, dark: Moon };
const LABEL = { system: "Matching system theme", light: "Light theme", dark: "Dark theme" };

export function ThemeToggle() {
  const [pref, setPref] = useState<ThemePreference>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPref(getStoredTheme());
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-9 w-9" aria-hidden />;

  const Icon = ICON[pref];

  function cycle() {
    const next = CYCLE[(CYCLE.indexOf(pref) + 1) % CYCLE.length];
    setPref(next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      title={LABEL[pref]}
      aria-label={`Theme: ${LABEL[pref]}. Click to change.`}
      className="hover-wiggle flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
