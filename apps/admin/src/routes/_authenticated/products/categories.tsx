import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  FolderTree,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import { Badge } from '@admin/components/ui/badge';
import { Button } from '@admin/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@admin/components/ui/table';
import { getCategoriesAction } from '@admin/features/categories/actions/get-categories.action';
import { CategoryFormDialog } from '@admin/features/categories/components/category-form-dialog';
import { DeleteCategoryDialog } from '@admin/features/categories/components/delete-category-dialog';
import type { CategoryResponseDto } from '@admin/features/categories/category.type';

export const Route = createFileRoute('/_authenticated/products/categories')({
  component: CategoriesPage,
});

function CategoriesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryResponseDto | null>(null);

  const { data: categories = [], isLoading, isError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategoriesAction(),
  });

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const openCreate = () => {
    setSelectedCategory(null);
    setFormOpen(true);
  };

  const openEdit = (category: CategoryResponseDto) => {
    setSelectedCategory(category);
    setFormOpen(true);
  };

  const openDelete = (category: CategoryResponseDto) => {
    setSelectedCategory(category);
    setDeleteOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh mục</h1>
          <p className="text-muted-foreground text-sm">
            Quản lý danh mục sản phẩm của cửa hàng.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 size-4" />
          Thêm danh mục
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      ) : isError ? (
        <div className="text-destructive flex h-48 items-center justify-center text-sm">
          Không thể tải danh mục. Vui lòng thử lại.
        </div>
      ) : categories.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2">
          <FolderTree className="text-muted-foreground size-10 opacity-30" />
          <p className="text-muted-foreground text-sm">
            Chưa có danh mục nào.{' '}
            <button
              className="text-primary underline-offset-4 hover:underline"
              onClick={openCreate}
            >
              Tạo danh mục đầu tiên
            </button>
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Ảnh</TableHead>
                <TableHead>Tên danh mục</TableHead>
                <TableHead>Danh mục cha</TableHead>
                <TableHead className="w-32">Thứ tự</TableHead>
                <TableHead className="w-28 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => {
                const parent = category.parentId
                  ? categoryMap[category.parentId]
                  : null;
                return (
                  <TableRow key={category.id}>
                    <TableCell>
                      {category.image?.url ? (
                        <img
                          src={category.image.url}
                          alt={category.name}
                          className="size-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="bg-muted flex size-10 items-center justify-center rounded-md">
                          <ImageIcon className="text-muted-foreground size-4" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell>
                      {parent ? (
                        <Badge variant="secondary">{parent.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>{category.displayOrder}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(category)}
                          aria-label="Chỉnh sửa"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => openDelete(category)}
                          aria-label="Xóa"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={selectedCategory ?? undefined}
        categories={categories}
      />

      {selectedCategory && (
        <DeleteCategoryDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          category={selectedCategory}
        />
      )}
    </div>
  );
}
