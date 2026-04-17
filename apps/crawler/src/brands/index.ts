import { BrandConfig } from '../config';

import { antYokoBrand } from './ant-yoko';
import { fuchsBrand } from './fuchs';

export const brands: Record<string, BrandConfig> = {
  [antYokoBrand.id]: antYokoBrand,
  [fuchsBrand.id]: fuchsBrand,
};

export { antYokoBrand, fuchsBrand };
