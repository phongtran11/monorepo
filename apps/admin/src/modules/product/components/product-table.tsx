'use client';

import { LSelect } from '@admin/components/atoms';
import { Pagination } from '@admin/components/modules';
import { Card, CardContent } from '@admin/components/ui/card';
import { Input } from '@admin/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@admin/components/ui/table';
import { usePermission } from '@admin/modules/auth/context/user.context';
import { FlatCategory } from '@admin/modules/category/types/category.type';
import { Permission, ProductStatus } from '@lam-thinh-ecommerce/shared';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Package, Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { PaginatedProducts, Product } from '../types/product.type';
import { ProductColumnMeta, productColumns } from './product-columns';

const STATUS_OPTIONS = [
  { value: ProductStatus.ACTIVE, label: 'Đang bán' },
  { value: ProductStatus.DRAFT, label: 'Nháp' },
  { value: ProductStatus.ARCHIVED, label: 'Lưu trữ' },
];

interface ProductTableProps {
  data: PaginatedProducts;
  categories: FlatCategory[];
  onEdit: (product: Product) => void;
}

export function ProductTable({ data, categories, onEdit }: ProductTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const canUpdate = usePermission(Permission.UPDATE_PRODUCT);
  const canDelete = usePermission(Permission.DELETE_PRODUCT);

  const currentSearch = searchParams.get('search') ?? '';
  const currentStatus = searchParams.get('status') ?? '';
  const currentCategoryId = searchParams.get('categoryId') ?? '';
  const currentPage = Number(searchParams.get('page') ?? '1');

  const [searchInput, setSearchInput] = useState(currentSearch);

  // Sync search input when URL changes externally
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  // Debounce search → URL update
  useEffect(() => {
    if (searchInput === currentSearch) return;
    const timer = setTimeout(() => {
      updateParams({ search: searchInput, page: '' });
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  const meta: ProductColumnMeta = { canUpdate, canDelete, onEdit };

  const table = useReactTable({
    data: data.items,
    columns: productColumns,
    getCoreRowModel: getCoreRowModel(),
    meta,
  });

  const totalPages = Math.ceil(data.total / data.limit);

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
    depth: c.depth,
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Tìm tên hoặc SKU..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <LSelect
          value={currentStatus}
          onValueChange={(val) => updateParams({ status: val, page: '' })}
          options={STATUS_OPTIONS}
          placeholder="Tất cả trạng thái"
          className="w-44"
        />

        <LSelect
          value={currentCategoryId}
          onValueChange={(val) => updateParams({ categoryId: val, page: '' })}
          options={categoryOptions}
          placeholder="Tất cả danh mục"
          className="w-48"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <Package className="size-8 opacity-40" />
              <p className="text-sm">Không tìm thấy sản phẩm nào</p>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data.total > 0 && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          total={data.total}
          limit={data.limit}
          onPageChange={(page) => updateParams({ page: String(page) })}
          itemLabel="sản phẩm"
        />
      )}
    </div>
  );
}
