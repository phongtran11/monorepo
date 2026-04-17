import { BrandConfig, DEFAULT_CRAWL } from '../config';

export const antYokoBrand: BrandConfig = {
  id: 'ant-yoko',
  name: 'ANT YOKO',
  startUrl: 'https://antyoko.com/danh-muc-san-pham/dau-nhot-xe-may/',
  pagination: {
    type: 'load-more',
    selector: '.lmp_load_more_button .lmp_button',
  },
  selectors: {
    listing: {
      productCard: 'li.product',
      productLink: 'a',
    },
    detail: {
      name: 'h1.product_title, h1',
      price: '.price',
      imageUrl: '.woocommerce-product-gallery__image img, .product img',
      description:
        '.woocommerce-product-details__short-description, .woocommerce-tabs .panel',
    },
  },
  output: {
    rawImagesDir: 'downloads/raw',
    processedImagesDir: 'public/products',
    dbPath: 'data/products.db',
  },
  crawl: DEFAULT_CRAWL,
};
