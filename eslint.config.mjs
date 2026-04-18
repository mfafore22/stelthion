import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Out-of-app workspaces — they carry their own lint configs.
    "packages/**",
    "services/**",
  ]),
  // Enforce the ShopperMind service boundary: mall-app code may only import
  // the client packages, never the engine internals. This is the static-lint
  // half of the boundary; the bundle analyzer check in CI is the dynamic half.
  {
    files: ["src/**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@stelthion/shoppermind", "@stelthion/shoppermind/**"],
              message:
                "Import from '@stelthion/shoppermind-client' (or '-client-types') instead. The service package is not public to the mall app.",
            },
            {
              group: [
                "services/shoppermind/**",
                "**/services/shoppermind/**",
                "../../services/shoppermind/**",
                "../../../services/shoppermind/**",
              ],
              message:
                "Do not reach into the ShopperMind service directly from the mall app. Use '@stelthion/shoppermind-client'.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
