export const RESOURCE_TYPE = {
  CATEGORY: 'category',
  PRODUCT: 'product',
} as const;

export type ResourceType = (typeof RESOURCE_TYPE)[keyof typeof RESOURCE_TYPE];
