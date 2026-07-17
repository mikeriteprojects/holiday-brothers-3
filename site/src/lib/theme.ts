export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "hb_theme";

export function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
}

export function applyTheme(pref: ThemePreference) {
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = pref === "dark" || (pref === "system" && systemDark);
  document.documentElement.classList.toggle("dark", isDark);
}

export function setTheme(pref: ThemePreference) {
  window.localStorage.setItem(STORAGE_KEY, pref);
  applyTheme(pref);
  window.dispatchEvent(new Event("hb_theme_change"));
}

// Inlined into layout.tsx as a blocking script so the correct theme class is
// set before first paint (no flash of the wrong theme). Defaults to system
// preference when no explicit choice has been stored.
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var pref = localStorage.getItem('${STORAGE_KEY}') || 'system';
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = pref === 'dark' || (pref === 'system' && systemDark);
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;
