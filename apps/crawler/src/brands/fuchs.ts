import { BrandConfig, DEFAULT_CRAWL } from '../config';

export const fuchsBrand: BrandConfig = {
  id: 'fuchs',
  name: 'Fuchs Silkolene',
  startUrl: 'https://shop2banh.vn/fuchs.html',
  pagination: {
    type: 'none',
  },
  selectors: {
    listing: {
      productCard: '.items',
      productLink: 'a',
    },
    detail: {
      name: 'h1',
      price: '.ct-sp-child-price span',
      imageUrl: '.s2b-big-img img, .slider-for img',
      description: '.content-detail p, .description-detail p',
    },
  },
  output: {
    rawImagesDir: 'downloads/raw',
    processedImagesDir: 'public/products',
    dbPath: 'data/products.db',
  },
  crawl: DEFAULT_CRAWL,
};
