import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // react-hooks/set-state-in-effect false-positives on the standard
  // fetch-on-mount pattern (an async function called from useEffect that
  // setState()s after an await) — it can't see that the setState is
  // deferred past the await, so it flags every data-loading effect in the
  // app. Rather than eslint-disable-next-line on every single page that
  // fetches data on mount (every list screen we build), turn it off here.
  { rules: { "react-hooks/set-state-in-effect": "off" } },
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
