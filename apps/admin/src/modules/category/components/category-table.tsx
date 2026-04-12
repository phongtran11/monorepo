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
  useReactTable,
} from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Category, FlatCategory } from '../types/category.type';
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
  // useReactTable returns non-memoizable functions — opt out of React Compiler
  'use no memo';

  const [expanded, setExpanded] = useState<ExpandedState>(true);

  const meta: CategoryColumnMeta = { canUpdate, canDelete, onEdit };

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: categories,
    columns: categoryColumns,
    getSubRows: (row) => row.children,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: setExpanded,
    state: { expanded },
    meta,
  });

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
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
