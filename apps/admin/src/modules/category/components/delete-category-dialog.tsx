'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@admin/components/ui/alert-dialog';
import { Button } from '@admin/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { deleteCategoryAction } from '../actions';

interface DeleteCategoryDialogProps {
  categoryId: string;
  categoryName: string;
  disabled?: boolean;
}

export function DeleteCategoryDialog({
  categoryId,
  categoryName,
  disabled,
}: DeleteCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await deleteCategoryAction(categoryId);

      if (!result.success) {
        toast.error('Xóa danh mục thất bại', {
          description: result.message ?? 'Đã xảy ra lỗi. Vui lòng thử lại.',
        });
        return;
      }

      setOpen(false);
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="icon-xs"
          variant="ghost"
          className="text-muted-foreground hover:text-destructive"
          disabled={disabled}
          aria-label={`Xóa ${categoryName}`}
        >
          <Trash2 />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa danh mục</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn xóa danh mục{' '}
            <span className="font-medium text-foreground">{categoryName}</span>?
            Hành động này không thể hoàn tác.
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
            Xóa
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
