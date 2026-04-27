# @lam-thinh-ecommerce/crawler

Playwright-based web crawler for scraping product data (ANT YOKO) and ingesting it into the platform. Outputs data to a local SQLite database and downloads product images.

## Tech Stack

- **Browser Automation:** Playwright
- **Database:** SQLite via better-sqlite3
- **Image Processing:** sharp
- **File Utilities:** fs-extra
- **Language:** TypeScript (ts-node for development)

## Setup

```bash
# From repo root
pnpm install

# Install Playwright browsers (first time only)
pnpm --filter @lam-thinh-ecommerce/crawler exec playwright install chromium
```

## Scripts

```bash
# Development — run with ts-node
pnpm --filter @lam-thinh-ecommerce/crawler dev

# Build TypeScript
pnpm --filter @lam-thinh-ecommerce/crawler build

# Run compiled output
pnpm --filter @lam-thinh-ecommerce/crawler start
```

## Project Structure

```
src/          # Crawler source (TypeScript)
data/         # SQLite database output
downloads/    # Downloaded product images
public/       # Static assets
```

## Output

| Artifact | Location | Description |
|---|---|---|
| Product data | `data/` | SQLite database with scraped records |
| Product images | `downloads/` | Raw images downloaded from source |
