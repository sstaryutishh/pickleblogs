import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  // Document navigation keeps the editorial site usable without JavaScript and
  // avoids relying on RSC cache-header forwarding by the Framer reverse proxy.
  { rules: { "@next/next/no-html-link-for-pages": "off" } },
  globalIgnores([".next/**", "next-env.d.ts", "playwright-report/**", "test-results/**"]),
]);
