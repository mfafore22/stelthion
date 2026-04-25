# Branch Reorganization — 2026-04-25 inventory

This document records the one-time reorganization that split the unmerged
backend (`claude/awesome-villani-3bd81a`) and the mixed-layer
`feat/concierge-ux-i18n` work into eight small, layer-pure branches. It exists
so the mapping from old shas → new branches is auditable in perpetuity.

The going-forward separation rule is in [branching.md](branching.md).

## Pre-reorg baseline

- Tag: `baseline/pre-reorg-2026-04-25`
- Tag points at: `f9dc8c9` (origin/main HEAD before reorg)

## Resulting branches

### 1. `security/tenant-hardening` (backend, merge commit)

Source: `origin/claude/awesome-villani-3bd81a` rebased onto `origin/main`.
21 source commits, kept verbatim through rebase. Merge as a merge commit so
the per-phase boundaries (Phase 3a, A.5, B, B.5, D, E) stay independently
reviewable in `main` history.

```
phase 3a   refactor(phase3a): establish src/server/ bright line + ESLint guard
phase A.5  test(phase-a.5): add 7 auth parity test suites (+85 tests, 0 regressions)
phase B    feat(phase-b): add defineHandler wrapper + tenant guards; refactor customers route
phase B.5  fix(phase-b.5): plug 12 multi-tenant data leaks across 5 admin/analysis routes
test       test: clear 4 pre-existing failing test suites; tighten agent-router heuristics
phase D    counters / analysis / admin / concierge / shoppermind route groups → defineHandler
phase E    mallRepo, analysisJobRepo, customerRepo, edgeDeviceRepo, counterRepo,
           conciergeRepo, floorplanRepo + cross-tenant leak fixes + 5 admin floorplan routes
```

Verification:
- All 23 parity test suites in `src/__tests__/*.parity.test.ts` pass on rebased HEAD.
- `npm test -- src/__tests__/*.parity.test.ts` reports 269 tests, 0 failures.

### 2. `backend/shoppermind-service` (backend, squash)

Source: subset of `origin/feat/concierge-ux-i18n`, cherry-picked onto `main`.
44 commits — workspace setup, service skeleton, Phase 1 port, Phase 2 engine,
service-boundary lint, regression harness, predictive event-predictor.

Touches: `services/shoppermind/**`, `packages/shoppermind-client/**`,
`packages/shoppermind-client-types/**`, `prisma/schema.prisma` (v2 tables +
dual-axis fields), `eslint.config.mjs`, plus one cross-cutting change in
`src/services/concierge/tools.ts` to route the trend tool through the
ShopperMind client (via `src/lib/shoppermind-client.ts`).

Verification:
- `npm --workspace=services/shoppermind run build` succeeds.
- `npm --workspace=services/shoppermind test` — 82 of 85 tests pass; the 3
  failing tests are pre-existing on the source branch and unrelated to the
  reorganization.

### 3. `backend/shoppermind-mall-api` (backend, squash)

Source: API-route halves of four mixed commits in
`origin/feat/concierge-ux-i18n`, recommitted with `(api)` suffixes. Stacks on
`backend/shoppermind-service` (depends on `src/lib/shoppermind-client.ts`).

| Original sha | New commit | Files kept |
|---|---|---|
| `d47a044` | `feat(shoppermind): mall-app /mall/shoppermind page + overview API (api)` | `src/app/api/shoppermind/overview/route.ts` |
| `2947cb0` | `feat(shoppermind): admin review-queue UI at /mall/shoppermind/review (api)` | three `src/app/api/shoppermind/review/**/route.ts` |
| `390b6db` | `feat(shoppermind): phenomenon detail page with link graph (api)` | `src/app/api/shoppermind/phenomenon/[id]/route.ts` |
| `d2f412a` | `feat(shoppermind): reviewer link-override API + client lib (api)` | `src/app/api/shoppermind/phenomenon/[id]/links/route.ts`, `src/lib/shoppermind-client.ts`, `services/shoppermind/src/__tests__/admin-writes.test.ts` |

UI files from the same source commits land in Branch 6.

### 4. `backend/concierge-fk-fix` (backend, squash)

Source: backend half of `f93e15d`. Stacks on `backend/shoppermind-service`
(touches `packages/shoppermind-client/src/{fetch,index}.ts`).

Files kept: `next.config.ts`, `packages/shoppermind-client/src/fetch.ts`,
`packages/shoppermind-client/src/index.ts`, `src/app/api/concierge/chat/route.ts`,
`src/services/concierge/llm-client.ts`.

UI half (i18n + speech bubble) lands in Branch 7.

### 5. `backend/floorplan-data-loss` (backend, squash)

Source: `e8bbf23` cherry-picked onto `origin/main`. Conflicted on
`src/app/api/admin/floorplan/[mallId]/save/route.ts` because main had its own
divergent batch-upsert implementation; we took `e8bbf23`'s transaction-wrapped
version because atomicity is the data-loss guarantee main was missing.

Files: `src/app/api/admin/floorplan/[mallId]/save/route.ts`,
`src/app/api/admin/floorplan/[mallId]/snapshots/route.ts`.

### 6. `frontend/shoppermind-mall-ui` (frontend, squash)

Source: UI halves of the same four commits as Branch 3. Stacks on Branch 3.
Conflicts auto-resolved by taking incoming versions (the new richer pages
overwrite main's pre-existing stub of `src/app/mall/shoppermind/page.tsx`).

Files added/modified: `src/app/mall/shoppermind/page.tsx`,
`src/app/mall/shoppermind/review/page.tsx`,
`src/app/mall/shoppermind/phenomenon/[id]/page.tsx`.

### 7. `frontend/concierge-ux` (frontend, squash)

Source: UI half of `f93e15d`. Stacks on Branch 4.

Files: `src/app/tenant/layout.tsx`, `src/components/mall/shell/MallTopBar.tsx`,
`src/lib/i18n/hooks.ts`, `src/lib/i18n/index.ts`.

### 8. `docs/branching` (docs + CI)

This branch. Adds `docs/branching.md` (separation rule),
`.github/workflows/path-guard.yml` (CI enforcement), and this inventory
document.

## Stragglers — disposition

To be carried out after the eight branches above are merged:

| Remote branch | Disposition |
|---|---|
| `origin/claude/awesome-villani-3bd81a` | Delete after Branch 1 merges. |
| `origin/feat/concierge-ux-i18n` | Delete after Branches 2, 3, 4, 6, 7 all merge. |
| `origin/floorplan-rescue-fix` | Superseded by Branch 5. Delete. |
| `origin/dev-review/sendotp-template-change` | Marker branch, delete after Branch 1 merges. |
| `origin/feature/c1-features-wired` | Read both commits, decide on a fresh branch if still relevant. |
| `origin/fix/session-security-and-mall-bugfixes` | Diff against post-Branch-1 main; delete if redundant. |

## Local working state preserved at reorg time

- Branch `wip/local-pre-reorg` (commit `f650b50`) holds the developer's
  uncommitted local work at the start of the reorganization (Space Optimizer
  feature, Admin Plans editor, ShopperMind component library, plan-gate
  pipeline, footfall counter source, demo seed scripts, Prisma plan-tiers
  migration, TrendShape intensity refactor). This branch is the developer's
  starting point for the next round of feature work, applied on top of the
  reorganized `main`.
