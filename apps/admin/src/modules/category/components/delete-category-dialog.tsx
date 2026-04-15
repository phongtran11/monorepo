'use client';

import { ConfirmDialog } from '@admin/components/modules/confirm-dialog';
import { Button } from '@admin/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

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

  return (
    <>
      <Button
        size="icon-xs"
        variant="ghost"
        className="text-muted-foreground hover:text-destructive"
        disabled={disabled}
        aria-label={`Xóa ${categoryName}`}
        onClick={() => setOpen(true)}
      >
        <Trash2 />
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Xóa danh mục"
        description={
          <>
            Bạn có chắc muốn xóa danh mục{' '}
            <span className="font-medium text-foreground">{categoryName}</span>?
            Hành động này không thể hoàn tác.
          </>
        }
        confirmLabel="Xóa"
        errorTitle="Xóa danh mục thất bại"
        onConfirm={() => deleteCategoryAction(categoryId)}
      />
    </>
  );
}
