/**
 * Standalone ShopperMind clustering runner.
 * Usage: npx tsx scripts/shoppermind/cluster.ts
 */
import { runClustering } from '../../src/services/shoppermind/clustering';

async function main() {
  const summary = await runClustering();
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
