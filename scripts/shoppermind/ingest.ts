/**
 * Standalone ShopperMind ingestion runner.
 * Usage: npx tsx scripts/shoppermind/ingest.ts [--force] [--source=<id>]
 *
 * Identical behaviour to /api/cron/shoppermind/ingest — this script is the
 * extraction hook: same code, no Next.js runtime required.
 */
import { runIngestion } from '../../src/services/shoppermind/ingest-runner';

async function main() {
  const force = process.argv.includes('--force');
  const sourceArg = process.argv.find((a) => a.startsWith('--source='));
  const sourceIds = sourceArg ? [sourceArg.split('=')[1]] : undefined;

  const summary = await runIngestion({ force, sourceIds });
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
