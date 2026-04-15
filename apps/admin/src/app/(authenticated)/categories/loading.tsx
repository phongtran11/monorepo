import { TableSkeleton, TableSkeletonColumn } from '@admin/components/modules';
import { CategoryHeader } from '@admin/modules/category/components/category-header';

const CATEGORY_SKELETON_COLUMNS: TableSkeletonColumn[] = [
  { width: 'w-10', cell: { type: 'checkbox' } },
  { header: 'Tên danh mục', cell: { type: 'avatar-text' } },
  { header: 'Thứ tự', align: 'center', cell: { type: 'badge' } },
  { cell: { type: 'actions', count: 2 } },
];

export default function CategoriesLoading() {
  return (
    <div className="flex flex-col gap-4">
      <CategoryHeader loading />
      <TableSkeleton columns={CATEGORY_SKELETON_COLUMNS} />
    </div>
  );
}
