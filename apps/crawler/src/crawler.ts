import { Page, chromium } from 'playwright';

import { BrandConfig } from './config';
import { upsertProduct } from './db';
import { processImage } from './image-processor';

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parsePrice(raw: string): { price: number | null; currency: string } {
  if (!raw) return { price: null, currency: 'VND' };
  const cleaned = raw.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return { price: isNaN(parsed) ? null : parsed, currency: 'VND' };
}

function parseProperties(text: string): Record<string, string> {
  const props: Record<string, string> = {};
  const lines = text.split(/[\n\r]+/);
  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      props[match[1].trim()] = match[2].trim();
    }
  }
  return props;
}

async function autoScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  });
}

async function handlePagination(page: Page, brand: BrandConfig): Promise<void> {
  const { pagination, crawl } = brand;

  if (pagination.type === 'none') return;

  if (pagination.type === 'load-more') {
    let clicks = 0;
    const maxClicks = pagination.maxClicks ?? 0;
    while (true) {
      await autoScroll(page);
      const btn = page.locator(pagination.selector);
      const visible = await btn.isVisible().catch(() => false);
      if (!visible) break;
      if (maxClicks > 0 && clicks >= maxClicks) break;
      console.log(`[${brand.id}] Clicking "load more" (click ${clicks + 1})...`);
      await btn.click();
      clicks++;
      await randomDelay(crawl.delayMinMs, crawl.delayMaxMs);
    }
    console.log(`[${brand.id}] All products loaded after ${clicks} click(s).`);
    return;
  }

  if (pagination.type === 'next-button') {
    while (true) {
      await autoScroll(page);
      const btn = page.locator(pagination.selector);
      const visible = await btn.isVisible().catch(() => false);
      if (!visible) break;
      console.log(`[${brand.id}] Navigating to next page...`);
      await btn.click();
      await page.waitForLoadState('networkidle');
      await randomDelay(crawl.delayMinMs, crawl.delayMaxMs);
    }
    return;
  }
}

async function extractProductUrls(page: Page, brand: BrandConfig): Promise<string[]> {
  const { productCard, productLink } = brand.selectors.listing;
  return page.$$eval(
    `${productCard} ${productLink}`,
    (anchors) =>
      [...new Set((anchors as HTMLAnchorElement[]).map((a) => a.href))].filter((href) =>
        href.startsWith('http'),
      ),
  );
}

async function scrapeDetailPage(
  page: Page,
  url: string,
  brand: BrandConfig,
): Promise<{ name: string; price: string; imageUrl: string; properties: Record<string, string> }> {
  const { detail } = brand.selectors;

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const name = await page
    .$eval(detail.name, (el) => el.textContent?.trim() ?? '')
    .catch(() => '');
  const price = await page
    .$eval(detail.price, (el) => el.textContent?.trim() ?? '')
    .catch(() => '');
  const imageUrl = await page
    .$eval(detail.imageUrl, (img) => (img as HTMLImageElement).src)
    .catch(() => '');
  const rawDescription = await page
    .$eval(detail.description, (el) => el.textContent ?? '')
    .catch(() => '');

  return { name, price, imageUrl, properties: parseProperties(rawDescription) };
}

export async function runCrawler(brand: BrandConfig): Promise<void> {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ userAgent: brand.crawl.userAgent });
  const page = await context.newPage();

  try {
    console.log(`[${brand.id}] Navigating to ${brand.startUrl}`);
    await page.goto(brand.startUrl, { waitUntil: 'networkidle', timeout: 60000 });

    await handlePagination(page, brand);

    const productUrls = await extractProductUrls(page, brand);
    console.log(`[${brand.id}] Found ${productUrls.length} product URL(s).`);

    let scraped = 0;
    for (const url of productUrls) {
      try {
        console.log(`[${brand.id}] Scraping ${scraped + 1}/${productUrls.length}: ${url}`);

        const detail = await scrapeDetailPage(page, url, brand);

        if (!detail.name) {
          console.warn(`[${brand.id}] Skipping ${url} — no name found.`);
          continue;
        }

        const { price, currency } = parsePrice(detail.price);
        if (price === null) {
          console.warn(`[${brand.id}] No price parsed for "${detail.name}"`);
        }

        const localImagePath = await processImage(
          detail.imageUrl,
          brand.output.rawImagesDir,
          brand.output.processedImagesDir,
        );

        upsertProduct({
          brand: brand.id,
          name: detail.name,
          price,
          currency,
          properties: detail.properties,
          original_url: url,
          local_image_path: localImagePath ?? '',
        });

        scraped++;
        await randomDelay(brand.crawl.delayMinMs, brand.crawl.delayMaxMs);
      } catch (err) {
        console.error(`[${brand.id}] Error scraping ${url}: ${(err as Error).message}`);
      }
    }

    console.log(`[${brand.id}] Done. Scraped ${scraped}/${productUrls.length} product(s).`);
  } finally {
    await browser.close();
  }
}
