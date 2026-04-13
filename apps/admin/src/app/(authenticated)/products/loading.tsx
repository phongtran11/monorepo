import { TableSkeleton, TableSkeletonColumn } from '@admin/components/modules';
import { ProductHeader } from '@admin/modules/product/components/product-header';

const PRODUCT_SKELETON_COLUMNS: TableSkeletonColumn[] = [
  { header: 'Sản phẩm', cell: { type: 'avatar-text' } },
  { header: 'Giá', cell: { type: 'text', width: 'w-24' } },
  { header: 'Tồn kho', align: 'center', cell: { type: 'badge' } },
  { header: 'Trạng thái', cell: { type: 'badge', width: 'w-16' } },
  { cell: { type: 'actions', count: 1 } },
];

export default function ProductsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <ProductHeader loading />
      {/* Filter bar skeleton */}
      <div className="flex gap-2">
        <div className="h-9 flex-1 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-44 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
      </div>
      <TableSkeleton columns={PRODUCT_SKELETON_COLUMNS} />
    </div>
  );
}
