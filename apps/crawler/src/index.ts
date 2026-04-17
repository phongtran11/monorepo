import { brands } from './brands';
import { runCrawler } from './crawler';
import { initDb } from './db';

async function main(): Promise<void> {
  const arg = process.argv[2] ?? 'all';

  const selectedBrands =
    arg === 'all'
      ? Object.values(brands)
      : arg.split(',').map((id) => {
          const brand = brands[id.trim()];
          if (!brand) {
            console.error(
              `[crawler] Unknown brand: "${id}". Available: ${Object.keys(brands).join(', ')}`,
            );
            process.exit(1);
          }
          return brand;
        });

  // All brands share the same DB
  const dbPath = selectedBrands[0].output.dbPath;
  initDb(dbPath);
  console.log(`[crawler] Database initialised at ${dbPath}`);

  for (const brand of selectedBrands) {
    console.log(`\n[crawler] ── Starting brand: ${brand.name} (${brand.id}) ──`);
    await runCrawler(brand);
  }

  console.log('\n[crawler] All done.');
}

process.on('SIGINT', () => {
  console.log('\n[crawler] Received SIGINT — shutting down gracefully.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[crawler] Received SIGTERM — shutting down gracefully.');
  process.exit(0);
});

main().catch((err: Error) => {
  console.error('[crawler] Fatal error:', err);
  process.exit(1);
});
