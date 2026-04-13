'use client';

import { Button } from '@admin/components/ui/button';
import { Checkbox } from '@admin/components/ui/checkbox';
import { cn } from '@admin/lib/utils';
import { ColumnDef, Row } from '@tanstack/react-table';
import { ChevronRight, Pencil } from 'lucide-react';
import Image from 'next/image';

import { Category, FlatCategory } from '../types/category.type';
import { DeleteCategoryDialog } from './delete-category-dialog';

export interface CategoryColumnMeta {
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (cat: FlatCategory) => void;
}

function toFlatCategory(row: Row<Category>): FlatCategory {
  return {
    ...row.original,
    children: [],
    depth: row.depth,
    parentId: row.getParentRow()?.original.id ?? null,
  };
}

export const categoryColumns: ColumnDef<Category>[] = [
  {
    id: 'select',
    header: ({ table }) => {
      const { canDelete } = table.options.meta as CategoryColumnMeta;
      if (!canDelete) return null;

      return (
        <Checkbox
          checked={
            table.getIsAllRowsSelected()
              ? true
              : table.getIsSomeRowsSelected()
                ? 'indeterminate'
                : false
          }
          onCheckedChange={(checked) =>
            table.toggleAllRowsSelected(checked === true)
          }
          aria-label="Chọn tất cả"
        />
      );
    },
    cell: ({ row, table }) => {
      const { canDelete } = table.options.meta as CategoryColumnMeta;
      if (!canDelete) return null;

      const hasChildren =
        row.original.children && row.original.children.length > 0;

      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(checked === true)}
          disabled={hasChildren}
          aria-label="Chọn hàng"
          title={
            hasChildren ? 'Không thể chọn danh mục có danh mục con' : undefined
          }
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'name',
    header: 'Tên danh mục',
    cell: ({ row }) => {
      const cat = row.original;
      const canExpand = row.getCanExpand();
      const isExpanded = row.getIsExpanded();

      return (
        <div
          className="flex items-center gap-2"
          style={{ paddingLeft: `${row.depth * 20}px` }}
        >
          {canExpand ? (
            <Button
              variant="outline"
              size="icon-xs"
              onClick={row.getToggleExpandedHandler()}
              className="flex size-5 shrink-0 items-center justify-center rounded hover:bg-muted"
              aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
            >
              <ChevronRight
                className={cn(
                  'size-3.5 text-muted-foreground transition-transform duration-200',
                  isExpanded && 'rotate-90',
                )}
              />
            </Button>
          ) : (
            <span className="size-5 shrink-0" />
          )}

          {cat.imageUrl ? (
            <Image
              src={cat.imageUrl}
              alt={cat.name}
              width={32}
              height={32}
              className="size-8 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="flex size-8 shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold uppercase text-muted-foreground">
              {cat.name.charAt(0)}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{cat.name}</p>
            <p className="truncate text-xs text-muted-foreground">{cat.slug}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'displayOrder',
    header: () => <div className="text-center">Thứ tự</div>,
    cell: ({ getValue }) => (
      <div className="text-center">
        <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          #{getValue() as number}
        </span>
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const { canUpdate, canDelete, onEdit } = table.options
        .meta as CategoryColumnMeta;

      const cat = row.original;

      if (!canUpdate && !canDelete) return null;

      return (
        <div className="flex items-center justify-end gap-1">
          {canUpdate && (
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => onEdit(toFlatCategory(row))}
              aria-label={`Sửa ${cat.name}`}
            >
              <Pencil />
            </Button>
          )}

          {canDelete && (
            <DeleteCategoryDialog categoryId={cat.id} categoryName={cat.name} />
          )}
        </div>
      );
    },
  },
];
