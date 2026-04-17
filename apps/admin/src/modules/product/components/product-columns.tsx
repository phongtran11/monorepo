'use client';

import { Button } from '@admin/components/ui/button';
import { Checkbox } from '@admin/components/ui/checkbox';
import { formatVND } from '@lam-thinh-ecommerce/shared';
import { ColumnDef } from '@tanstack/react-table';
import { Pencil } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Product, PRODUCT_STATUS_CONFIG } from '../types/product.type';

export interface ProductColumnMeta {
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (product: Product) => void;
}

export const productColumns: ColumnDef<Product>[] = [
  {
    id: 'select',
    header: ({ table }) => {
      const { canDelete } = table.options.meta as ProductColumnMeta;
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
      const { canDelete } = table.options.meta as ProductColumnMeta;
      if (!canDelete) return null;
      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(checked === true)}
          aria-label="Chọn hàng"
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'product',
    header: 'Sản phẩm',
    cell: ({ row }) => {
      const product = row.original;
      const thumbnail = product.images[0]?.imageUrl;

      return (
        <div className="flex items-center gap-3">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={product.name}
              width={40}
              height={40}
              className="size-10 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="flex size-10 shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold uppercase text-muted-foreground">
              {product.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <Link
              href={`/products/${product.id}`}
              className="truncate text-sm font-medium hover:underline"
            >
              {product.name}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {product.sku}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    id: 'price',
    header: 'Giá',
    cell: ({ row }) => {
      const { price, compareAtPrice } = row.original;
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{formatVND(price)}</span>
          {compareAtPrice !== null && (
            <span className="text-xs text-muted-foreground line-through">
              {formatVND(compareAtPrice)}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'stock',
    header: () => <div className="text-center">Tồn kho</div>,
    cell: ({ getValue }) => {
      const stock = getValue() as number;
      return (
        <div className="text-center">
          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {stock}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Trạng thái',
    cell: ({ getValue }) => {
      const status = getValue() as Product['status'];
      const config = PRODUCT_STATUS_CONFIG[status];
      return (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
        >
          {config.label}
        </span>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const { canUpdate, onEdit } = table.options.meta as ProductColumnMeta;
      if (!canUpdate) return null;

      return (
        <div className="flex items-center justify-end">
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={() => onEdit(row.original)}
            aria-label={`Sửa ${row.original.name}`}
          >
            <Pencil />
          </Button>
        </div>
      );
    },
  },
];
