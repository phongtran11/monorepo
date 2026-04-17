  Build a production-ready web crawler at `apps/crawler/` in the existing pnpm monorepo.

  ## Tech Stack (monorepo conventions apply)
  - TypeScript (strict mode), pnpm workspace
  - Playwright (headless), better-sqlite3, Sharp, fs-extra
  - Follow CLAUDE.md: kebab-case files, 2-space indent, single quotes, always semicolons
  - Run `pnpm check` before declaring done

  ## Configuration Interface (required — fill in before running)
  Create `apps/crawler/src/config.ts` with a typed `CrawlerConfig`:

  ```ts
  export const config: CrawlerConfig = {
    startUrl: 'FILL_IN',          // e.g. https://example.com/products
    pagination: 'next-button',    // 'next-button' | 'numeric-url'
    selectors: {
      productCard:  'FILL_IN',
      name:         'FILL_IN',
      imageUrl:     'FILL_IN',    // src attribute
      price:        'FILL_IN',
      currency:     'FILL_IN',    // or hardcode if always VND
      properties:   'FILL_IN',   // parent selector for key-value pairs
    },
    output: {
      rawImagesDir:      'downloads/raw',
      processedImagesDir: 'public/products',
      dbPath:            'data/products.db',
    },
    crawl: {
      delayMinMs:   2000,
      delayMaxMs:   5000,
      userAgent:    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...',
    },
  };

  Module Structure

  - src/config.ts          — typed config (as above)
  - src/db.ts              — SQLite schema init + upsert helper (key: product original_url)
  - src/image-processor.ts — download + Sharp: 800×800, WebP, contain, white bg → public/products/
  - src/crawler.ts         — Playwright loop: load, auto-scroll, extract, paginate
  - src/index.ts           — entry point; graceful shutdown on SIGINT/SIGTERM

  Schema

  Table products: id INTEGER PK, name TEXT, price REAL, currency TEXT, properties TEXT (JSON),
  original_url TEXT UNIQUE, local_image_path TEXT, created_at TEXT, updated_at TEXT.
  Upsert on original_url.

  Data Extraction Rules

  - Price: strip non-numeric chars, parse as float. If unparseable, log warning and set null.
  - Properties: collect all key-value pairs under the properties selector into a JSON object.
  - Image: download original URL to raw/, process with Sharp to public/products/<hash>.webp.
  - Skip products where name or price is missing; log them but do not abort.

  Crawler Behaviour

  1. Launch Playwright headless.
  2. Set User-Agent from config.
  3. Wait for network idle + product card selector to appear.
  4. Auto-scroll to bottom (100px steps, 300ms delay) to trigger lazy load.
  5. Extract all product cards on page.
  6. Random delay (config.crawl.delayMinMs–delayMaxMs) before next page.
  7. Pagination:
    - next-button: click if present; stop when absent.
    - numeric-url: increment page param; stop when 0 products found.
  8. Log progress: "Page N — scraped X products (total: Y)".

  Workflow

  1. /plan — confirm file layout, config interface shape, and pagination strategy
  2. /tdd — write a smoke test using a local HTML fixture (no network call) to verify extraction logic
  3. Implement all modules following the plan
  4. /code-review — focus on: SSRF risk in image download, path traversal in image save path, error isolation
  5. Use security-reviewer agent to audit image download and URL handling
  6. /verify — run pnpm check (lint + format); confirm TS compiles with zero errors under strict

  Acceptance Criteria

  - pnpm check passes with zero errors
  - Smoke test (local fixture) passes
  - SQLite rows created match product cards found on at least one real page
  - Processed images exist under public/products/ as .webp files
  - Re-running the crawler on the same page does not create duplicate rows

  Out of Scope

  - No API server or web UI
  - No integration with apps/api or the admin dashboard
  - No cloud storage upload (local only)
  - Do not modify any other workspace package

  ---

  ### Section 4: Optimized Prompt — Quick Version

  /plan apps/crawler/: TypeScript Playwright crawler → better-sqlite3 upsert + Sharp WebP processing.
  Config-driven (typed CrawlerConfig in src/config.ts — URL + selectors filled in by user).
  Modules: config.ts, db.ts, image-processor.ts, crawler.ts, index.ts.
  /tdd with local HTML fixture before hitting real network.
  Use security-reviewer agent on image download + path handling.
  /verify with pnpm check. Do not touch other workspace packages.

  ---

  ### Section 5: Enhancement Rationale

  | Enhancement | Reason |
  |-------------|--------|
  | Typed `CrawlerConfig` interface | Makes the placeholder problem structural — TS compiler will catch unfilled values rather than runtime crashes |
  | Monorepo conventions explicitly stated | Prevents `pnpm check` failures and ensures the new package fits the repo's style |
  | SSRF + path traversal review step | Image download from arbitrary URLs is a real attack surface; named explicitly so the reviewer doesn't skip it |
  | Smoke test on local HTML fixture | Makes TDD feasible without a live network and keeps tests reproducible in CI |
  | Graceful shutdown (SIGINT/SIGTERM) | Prevents SQLite corruption and partial image writes on Ctrl-C |
  | `currency` added to schema AND extraction | Removes the schema inconsistency in the original plan |
  | Pagination strategy as a config enum | Forces the decision upfront rather than building both branches speculatively |

  ---