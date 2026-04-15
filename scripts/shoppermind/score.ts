/**
 * Standalone ShopperMind scoring runner.
 * Usage: npx tsx scripts/shoppermind/score.ts
 */
import { runScoring } from '../../src/services/shoppermind/scoring';

async function main() {
  const summary = await runScoring();
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
