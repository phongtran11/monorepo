export type PaginationConfig =
  | { type: 'none' }
  | { type: 'load-more'; selector: string; maxClicks?: number }
  | { type: 'numeric-url'; buildUrl: (baseUrl: string, page: number) => string }
  | { type: 'next-button'; selector: string };

export interface ListingSelectors {
  /** Selector for each product card on the listing page */
  productCard: string;
  /** Selector for the product detail link inside a card */
  productLink: string;
}

export interface DetailSelectors {
  /** Product name on the detail page */
  name: string;
  /** Price element on the detail page */
  price: string;
  /** Main product image on the detail page */
  imageUrl: string;
  /** Element containing spec text (parsed as "Key: Value" lines) */
  description: string;
}

export interface BrandConfig {
  /** Brand identifier — used as CLI argument and log prefix */
  id: string;
  /** Human-readable brand name */
  name: string;
  /** Starting URL for the product listing */
  startUrl: string;
  pagination: PaginationConfig;
  selectors: {
    listing: ListingSelectors;
    detail: DetailSelectors;
  };
  output: {
    rawImagesDir: string;
    processedImagesDir: string;
    dbPath: string;
  };
  crawl: {
    delayMinMs: number;
    delayMaxMs: number;
    userAgent: string;
  };
}

export const DEFAULT_CRAWL = {
  delayMinMs: 2000,
  delayMaxMs: 5000,
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
};
