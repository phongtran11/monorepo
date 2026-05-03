'use client';

import { usePermission } from '@admin/modules/auth/context/user.context';
import { Permission } from '@lam-thinh-ecommerce/shared';
import { useMemo, useState } from 'react';

import { CategoryDialog } from '../components/category-dialog';
import { CategoryHeader } from '../components/category-header';
import { CategoryTable } from '../components/category-table';
import {
  Category,
  FlatCategory,
  flattenCategories,
} from '../types/category.type';

interface CategoryPageProps {
  categories: Category[];
}

type DialogState =
  | { open: false }
  | { open: true; editCategory: FlatCategory | null };

export function CategoryPage({ categories }: CategoryPageProps) {
  const canCreate = usePermission(Permission.CREATE_CATEGORY);

  const flatCategories = useMemo(
    () => flattenCategories(categories),
    [categories],
  );
  const [dialog, setDialog] = useState<DialogState>({ open: false });

  const openCreate = () => setDialog({ open: true, editCategory: null });
  const openEdit = (cat: FlatCategory) =>
    setDialog({ open: true, editCategory: cat });

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

      <CategoryDialog
        open={dialog.open}
        onOpenChange={(open) => !open && setDialog({ open: false })}
        editCategory={dialog.open ? dialog.editCategory : null}
        allCategories={flatCategories}
      />
    </div>
  );
}
