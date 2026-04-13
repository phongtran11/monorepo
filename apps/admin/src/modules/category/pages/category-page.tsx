'use client';

import { useState } from 'react';

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
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export function CategoryPage({
  categories,
  canCreate,
  canUpdate,
  canDelete,
}: CategoryPageProps) {
  const flatCategories = flattenCategories(categories);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<FlatCategory | null>(null);

  const openCreate = () => {
    setEditCategory(null);
    setSheetOpen(true);
  };

  const openEdit = (cat: FlatCategory) => {
    setEditCategory(cat);
    setSheetOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <CategoryHeader
        count={flatCategories.length}
        canCreate={canCreate}
        onCreateClick={openCreate}
      />

      <CategoryTable
        categories={categories}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onEdit={openEdit}
        onAddFirst={openCreate}
      />

      <CategorySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editCategory={editCategory}
        allCategories={flatCategories}
      />
    </div>
  );
}
