'use client';

import { Button } from '@admin/components/ui/button';
import { FolderTree, Plus } from 'lucide-react';
import { useState } from 'react';

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderTree className="size-5" />
          <h1 className="text-xl font-semibold">Danh mục</h1>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {flatCategories.length}
          </span>
        </div>
        {canCreate && (
          <Button size="sm" onClick={openCreate}>
            <Plus data-icon="inline-start" />
            Thêm danh mục
          </Button>
        )}
      </div>

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
