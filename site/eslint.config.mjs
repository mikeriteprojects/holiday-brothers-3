import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Flags the standard "fetch on mount via a named async function"
      // pattern (useEffect(() => { load() }, [load])) as if it were a
      // synchronous setState-in-effect footgun — it isn't, since the
      // setState happens after an await. Kept as a warning rather than
      // off entirely so genuinely synchronous cases still get flagged.
      "react-hooks/set-state-in-effect": "warn",
      // Three.js BufferGeometry is an inherently mutable, imperative object
      // — updating vertex positions in place (then setting needsUpdate) is
      // the correct, standard way to animate geometry, not a React state
      // mutation bug. The compiler's static rule can't tell the difference,
      // so this is a warning rather than off entirely.
      "react-hooks/immutability": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
