# ShopperMind Demo Data Runbook

This branch packages the tracked data assets and seed commands needed to show
ShopperMind with realistic demo content. The repository does not contain a
database dump. The service database is populated by running the seed scripts
against the ShopperMind database.

## What Is Included

- `src/engine/registry/seed-markets.json`: market registry seed source.
- `data/trend-bootstrap/2026-q1/trends.ts`: cited trend bootstrap dataset.
- `scripts/seed-demo.ts`: Helsinki and Tampere demo markets, phenomena, scores,
  and Signal of the Day rows.
- `scripts/seed-multi-country-markets.ts`: Stockholm, London, New York, and
  Dubai market rows.
- `scripts/seed-bootstrap-trends.ts`: source-backed trend rows for active
  markets.
- `scripts/seed-sources-helsinki.ts`: starter public RSS sources for Helsinki.
- `scripts/seed-imf-source.ts`: IMF macro source rows and starter macro
  phenomenon.

## Database Location

ShopperMind owns a separate Postgres database. It is not the main app database.

Local Docker default:

```bash
postgres://shoppermind:shoppermind@localhost:55432/shoppermind_db
```

Container default:

```bash
postgres://shoppermind:shoppermind@postgres:5432/shoppermind_db
```

On Hetzner, set the ShopperMind service process `DATABASE_URL` to the production
ShopperMind database URL. Do not point it at the main app database.

## Seed A Fresh ShopperMind Database

From the repository root:

```bash
DATABASE_URL="$SHOPPERMIND_DATABASE_URL" \
REDIS_URL="$SHOPPERMIND_REDIS_URL" \
SHOPPERMIND_SERVICE_TOKEN="$SHOPPERMIND_SERVICE_TOKEN" \
SHOPPERMIND_INTERNAL_TOKEN="$SHOPPERMIND_INTERNAL_TOKEN" \
npm run prisma:push --workspace=@stelthion/shoppermind
```

Then run the complete demo seed:

```bash
DATABASE_URL="$SHOPPERMIND_DATABASE_URL" \
REDIS_URL="$SHOPPERMIND_REDIS_URL" \
SHOPPERMIND_SERVICE_TOKEN="$SHOPPERMIND_SERVICE_TOKEN" \
SHOPPERMIND_INTERNAL_TOKEN="$SHOPPERMIND_INTERNAL_TOKEN" \
npm run seed:demo-full --workspace=@stelthion/shoppermind
```

The seed is idempotent. Re-running it updates or preserves rows by natural keys.

## Optional Legacy Import

Use this only when cutting over from an older main-app trend schema:

```bash
SOURCE_DATABASE_URL="$MAIN_APP_DATABASE_URL" \
DATABASE_URL="$SHOPPERMIND_DATABASE_URL" \
REDIS_URL="$SHOPPERMIND_REDIS_URL" \
SHOPPERMIND_SERVICE_TOKEN="$SHOPPERMIND_SERVICE_TOKEN" \
SHOPPERMIND_INTERNAL_TOKEN="$SHOPPERMIND_INTERNAL_TOKEN" \
npm run import:legacy --workspace=@stelthion/shoppermind
```

## Quick Checks

Run these against the ShopperMind database:

```sql
select count(*) from "Market";
select count(*) from "Phenomenon";
select count(*) from "PhenomenonScore";
select count(*) from "SignalSource";
select count(*) from "RawSignal";
```

Expected result: each count should be greater than zero after `seed:demo-full`.
