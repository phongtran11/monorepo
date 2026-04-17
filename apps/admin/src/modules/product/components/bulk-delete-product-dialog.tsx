'use client';

import { ConfirmDialog } from '@admin/components/modules/confirm-dialog';

import { bulkDeleteProductAction } from '../actions';

interface BulkDeleteProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSuccess: () => void;
}

export function BulkDeleteProductDialog({
  open,
  onOpenChange,
  selectedIds,
  onSuccess,
}: BulkDeleteProductDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Xóa sản phẩm đã chọn"
      description={
        <>
          Bạn có chắc muốn xóa{' '}
          <span className="font-medium text-foreground">
            {selectedIds.length} sản phẩm
          </span>
          ? Hành động này không thể hoàn tác.
        </>
      }
      confirmLabel={`Xóa ${selectedIds.length} sản phẩm`}
      errorTitle="Xóa sản phẩm thất bại"
      onConfirm={() => bulkDeleteProductAction(selectedIds)}
      onSuccess={onSuccess}
    />
  );
}
