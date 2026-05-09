# ShopperMind Release Gate

Run from the repo root:

```bash
npm run release:gate --workspace=@stelthion/shoppermind
```

The gate reports a shared `ReleaseGateReport` with pass, warning, and blocker
checks. Blockers fail the process. Warnings remain visible in the report.

## Checks

- shared runtime lint and tests
- ShopperMind workspace lint and build
- ShopperMind Prisma schema validation
- seed bootstrap checks
- Phase 6 contract checks
- static migration destructive-SQL check
- governance freshness marker check
- optional live smoke for internal service endpoints
- Redis-backed rate limiting through the service build and tests

The root ESLint config intentionally ignores `services/**` and `packages/**`.
This gate therefore runs workspace lints directly and should be the required
release check for service/runtime work.

## Live Smoke

Set these for live endpoint smoke:

```bash
SHOPPERMIND_SMOKE_BASE_URL=https://shoppermind.example
SHOPPERMIND_INTERNAL_TOKEN=...
SHOPPERMIND_REQUIRE_SMOKE=true
```

Local and CI runs warn when smoke is not configured. Production runs fail
automatically when live smoke is missing, even without `SHOPPERMIND_REQUIRE_SMOKE`.

The CI gate is schema-only by design. It does not start Postgres or Redis.
Deploy jobs should run the same gate against a live service before promotion.

## Destructive Migrations

Migrations containing `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, or `DELETE FROM`
are blocked unless the SQL includes `release-gate:allow-destructive`.
