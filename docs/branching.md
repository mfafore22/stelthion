# Branch separation rule

This repository keeps backend and frontend work on separate branches so each
layer can move independently. A backend branch never edits a frontend path; a
frontend branch never edits a backend path. The path-guard CI job enforces it.

## Path classification

| Layer | Path prefixes | Branch prefix |
|---|---|---|
| Service backend | `services/*`, `packages/*` | `backend/service-*` |
| Mall-app API | `src/app/api/*`, `src/server/*`, `src/lib/*-server.ts`, `src/services/*` (server-side concierge engine) | `backend/api-*` |
| Mall-app UI | `src/app/(non-api routes)/*`, `src/components/*`, `src/locales/*`, `src/contexts/*` | `frontend/*` |
| Schema / migrations | `prisma/schema.prisma`, `prisma/migrations/*`, `prisma/seed.ts` | `backend/schema-*` (alone in its PR) |

## Rules

1. **Layer purity.** A `backend/*` branch must not edit any "Mall-app UI" path; a
   `frontend/*` branch must not edit any backend path. CI enforces this with the
   path-guard workflow at [.github/workflows/path-guard.yml](.github/workflows/path-guard.yml).
2. **API-contract first.** Fullstack features ship the API contract before the
   UI. A backend PR exports a typed return shape from `src/lib/<feature>/types.ts`
   along with optional `mock-fixture.ts` and `fetcher.ts` that supports
   `mode: 'mock' | 'live'`. The frontend PR ships against `mode: 'mock'` and
   flips to `'live'` once the backend lands. Pattern proven in
   `src/lib/space-optimizer/{types,mock-fixture,fetcher}.ts`.
3. **Schema isolation.** Schema changes ship in their own PR, reviewed and
   applied before any feature code that depends on them.
4. **Squash by default.** Multi-phase branches that need review-unit boundaries
   merge as merge commits. Everything else squash-merges.
5. **Conventional-commit prefixes** in PR titles: `feat(scope)`, `fix(scope)`,
   `chore(scope)`, `refactor(scope)`, `test(scope)`, `docs(scope)`.
6. **Branch hygiene.** Branches are deleted on origin within 7 days of merge.

## Working with this rule

- A backend developer can land hardening, repository extractions, service
  migrations, schema changes, and API routes without waiting for any frontend
  work.
- A frontend developer can land pages, components, locales, and i18n changes
  against the typed contract — even before the backend lands — by importing
  from `mock-fixture.ts`.
- When a fullstack feature is finished, the frontend branch flips its fetcher
  to `mode: 'live'` in a one-line PR.

## Why this exists

Two large unmerged branches (`claude/awesome-villani-3bd81a` for backend
hardening; `feat/concierge-ux-i18n` for ShopperMind v2 + concierge UX) had
diverged on different fork points and contained entirely different sets of
changes. Neither had an open PR, so it was impossible to tell from GitHub
which work was authoritative or where to add new code. Reorganizing each
work-stream into small, layer-pure branches makes the pipeline legible again
and removes the reviewer's need to context-switch between layers in a single
PR. See [docs/branch-reorg-2026-04-25.md](branch-reorg-2026-04-25.md) for the
one-time reorganization audit.
