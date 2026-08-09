// One-off report: answers the two go/no-go thresholds for the Excerpt
// Suggestion capability against real data. Queried by hand, roughly monthly —
// see docs/excerpt-suggestion-metrics.md for what each number means and what
// to do when a threshold is missed. Run from the server dir:
//   bun run excerpt-suggestion-metrics [--days=30]
import 'dotenv/config';
import mongoose from 'mongoose';
import {
  computeAdoption,
  computeKeptUnedited,
  formatRate,
  ADOPTION_THRESHOLD,
  KEPT_UNEDITED_THRESHOLD,
} from '../src/reporting/excerptSuggestionMetrics';

function parseDays(argv: string[]): number {
  const arg = argv.find((a) => a.startsWith('--days='));
  const days = arg ? Number(arg.slice('--days='.length)) : 30;
  return Number.isFinite(days) && days > 0 ? days : 30;
}

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  const days = parseDays(process.argv.slice(2));
  await mongoose.connect(uri);

  const adoption = await computeAdoption(days);
  const keptUnedited = await computeKeptUnedited(days);

  console.log(`Excerpt Suggestion usage — last ${days} day(s)\n`);

  console.log('Adoption (threshold: stop building AI capabilities under 25%)');
  console.log(`  Posts published:        ${adoption.publishedPosts}`);
  console.log(`  ...with a suggestion:   ${adoption.postsWithSuggestion}`);
  console.log(`  Adoption rate:          ${formatRate(adoption.adoptionRate)}`);
  if (adoption.adoptionRate !== null && adoption.adoptionRate < ADOPTION_THRESHOLD) {
    console.log('  -> Below threshold: stop building further AI capabilities.');
  }

  console.log('\nKept unedited (threshold: fix the prompt under 40%)');
  console.log(`  Suggestions issued:     ${keptUnedited.issuedSuggestions}`);
  console.log(`  ...kept unedited:       ${keptUnedited.keptUnedited}`);
  console.log(`  Kept-unedited rate:     ${formatRate(keptUnedited.keptUneditedRate)}`);
  if (
    keptUnedited.keptUneditedRate !== null &&
    keptUnedited.keptUneditedRate < KEPT_UNEDITED_THRESHOLD
  ) {
    console.log('  -> Below threshold: fix the prompt, not the model.');
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('excerpt-suggestion-metrics failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
