'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@admin/components/ui/alert-dialog';
import { Button } from '@admin/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

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
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await bulkDeleteCategoryAction(selectedIds);

      if (!result.success) {
        toast.error('Xóa danh mục thất bại', {
          description: result.message ?? 'Đã xảy ra lỗi. Vui lòng thử lại.',
        });
        return;
      }

      onSuccess();
      onOpenChange(false);
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa danh mục đã chọn</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn xóa{' '}
            <span className="font-medium text-foreground">
              {selectedIds.length} danh mục
            </span>
            ? Hành động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Hủy</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending && (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            )}
            Xóa {selectedIds.length} danh mục
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
