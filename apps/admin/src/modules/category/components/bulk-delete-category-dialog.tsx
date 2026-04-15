'use client';

import { ConfirmDialog } from '@admin/components/modules/confirm-dialog';

import { bulkDeleteCategoryAction } from '../actions';

interface BulkDeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSuccess: () => void;
}

export function BulkDeleteCategoryDialog({
  open,
  onOpenChange,
  selectedIds,
  onSuccess,
}: BulkDeleteCategoryDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Xóa danh mục đã chọn"
      description={
        <>
          Bạn có chắc muốn xóa{' '}
          <span className="font-medium text-foreground">
            {selectedIds.length} danh mục
          </span>
          ? Hành động này không thể hoàn tác.
        </>
      }
      confirmLabel={`Xóa ${selectedIds.length} danh mục`}
      errorTitle="Xóa danh mục thất bại"
      onConfirm={() => bulkDeleteCategoryAction(selectedIds)}
      onSuccess={onSuccess}
    />
  );
}
