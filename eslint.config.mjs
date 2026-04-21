import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const PRISMA_FORBIDDEN_MESSAGE =
  "Client-side code must not import Prisma. Move data access into a server-side service or API route under src/server/.";

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
  ]),
  // Server bright line (Phase 3A): client-side code must not import the
  // Prisma client at runtime. Phase 3 expands this scope to lib/ and api/
  // as files migrate to use the repositories layer under src/server/.
  //
  // Type-only imports from @prisma/client are allowed for now — they erase
  // at compile time and don't pull Prisma into the client bundle. Phase E
  // (DTOs at the repository boundary) is the right place to decouple
  // component types from the DB schema.
  {
    files: [
      "src/components/**/*.{ts,tsx}",
      "src/hooks/**/*.{ts,tsx}",
      "src/contexts/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "@prisma/client", message: PRISMA_FORBIDDEN_MESSAGE, allowTypeImports: true },
            { name: "@prisma/adapter-pg", message: PRISMA_FORBIDDEN_MESSAGE },
            { name: "@/app/lib/prisma", message: PRISMA_FORBIDDEN_MESSAGE },
            { name: "@/server/db/client", message: PRISMA_FORBIDDEN_MESSAGE },
          ],
          patterns: [
            {
              group: [
                "**/app/lib/prisma",
                "**/server/db/client",
              ],
              message: PRISMA_FORBIDDEN_MESSAGE,
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
