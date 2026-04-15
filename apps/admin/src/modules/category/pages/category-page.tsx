'use client';

import { usePermission } from '@admin/modules/auth/context/user.context';
import { Permission } from '@lam-thinh-ecommerce/shared';
import { useMemo, useState } from 'react';

import { CategoryHeader } from '../components/category-header';
import { CategorySheet } from '../components/category-sheet';
import { CategoryTable } from '../components/category-table';
import {
  Category,
  FlatCategory,
  flattenCategories,
} from '../types/category.type';

interface CategoryPageProps {
  categories: Category[];
}

type SheetState =
  | { open: false }
  | { open: true; editCategory: FlatCategory | null };

export function CategoryPage({ categories }: CategoryPageProps) {
  const canCreate = usePermission(Permission.CREATE_CATEGORY);

  const flatCategories = useMemo(
    () => flattenCategories(categories),
    [categories],
  );
  const [sheet, setSheet] = useState<SheetState>({ open: false });

  const openCreate = () => setSheet({ open: true, editCategory: null });
  const openEdit = (cat: FlatCategory) =>
    setSheet({ open: true, editCategory: cat });

  return (
    <div className="flex flex-col gap-4">
      <CategoryHeader
        count={flatCategories.length}
        canCreate={canCreate}
        onCreateClick={openCreate}
      />

      <CategoryTable
        categories={categories}
        onEdit={openEdit}
        onAddFirst={openCreate}
      />

      <CategorySheet
        open={sheet.open}
        onOpenChange={(open) => !open && setSheet({ open: false })}
        editCategory={sheet.open ? sheet.editCategory : null}
        allCategories={flatCategories}
      />
    </div>
  );
}
