'use client';

import { Button } from '@admin/components/ui/button';
import { Card, CardContent } from '@admin/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@admin/components/ui/table';
import {
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  RowSelectionState,
  useReactTable,
} from '@tanstack/react-table';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Category, FlatCategory } from '../types/category.type';
import { BulkDeleteCategoryDialog } from './bulk-delete-category-dialog';
import { CategoryColumnMeta, categoryColumns } from './category-columns';

interface CategoryTableProps {
  categories: Category[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (cat: FlatCategory) => void;
  onAddFirst: () => void;
}

export function CategoryTable({
  categories,
  canCreate,
  canUpdate,
  canDelete,
  onEdit,
  onAddFirst,
}: CategoryTableProps) {
  const [expanded, setExpanded] = useState<ExpandedState>(true);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  const meta: CategoryColumnMeta = { canUpdate, canDelete, onEdit };

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: categories,
    columns: categoryColumns,
    getSubRows: (row) => row.children,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: setExpanded,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: (row) =>
      !row.original.children || row.original.children.length === 0,
    state: { expanded, rowSelection },
    meta,
  });

  const selectedIds = table
    .getSelectedRowModel()
    .flatRows.map((r) => r.original.id);

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <p className="text-sm">Chưa có danh mục nào</p>
            {canCreate && (
              <Button size="sm" variant="outline" onClick={onAddFirst}>
                <Plus data-icon="inline-start" />
                Thêm danh mục đầu tiên
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {canDelete && selectedIds.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2">
          <span className="text-sm text-muted-foreground">
            Đã chọn{' '}
            <span className="font-medium text-foreground">
              {selectedIds.length}
            </span>{' '}
            danh mục
          </span>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setBulkDialogOpen(true)}
          >
            <Trash2 data-icon="inline-start" />
            Xóa đã chọn
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <BulkDeleteCategoryDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        selectedIds={selectedIds}
        onSuccess={() => setRowSelection({})}
      />
    </>
  );
}
