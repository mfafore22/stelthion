/**
 * Standalone ShopperMind daily publish runner.
 * Usage: npx tsx scripts/shoppermind/publish.ts
 */
import { runPublish } from '../../src/services/shoppermind/publisher';

async function main() {
  const summary = await runPublish();
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
