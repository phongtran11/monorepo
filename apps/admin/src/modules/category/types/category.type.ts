export type Category = {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  imageUrl: string | null;
  imagePublicId: string | null;
  children: Category[];
  createdAt: string;
  updatedAt: string;
};

export type FlatCategory = Category & {
  depth: number;
  parentId: string | null;
};

export function flattenCategories(
  categories: Category[],
  parentId: string | null = null,
  depth = 0,
): FlatCategory[] {
  return categories.flatMap((cat) => [
    { ...cat, children: [], depth, parentId },
    ...flattenCategories(cat.children ?? [], cat.id, depth + 1),
  ]);
}
