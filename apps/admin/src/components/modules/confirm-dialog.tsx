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

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  errorTitle?: string;
  onConfirm: () => Promise<{ success: boolean; message?: string | null }>;
  onSuccess?: () => void;
}

/**
 * Generic controlled confirmation dialog with built-in pending state,
 * error toasting, and success callback. Use this instead of writing
 * AlertDialog + useTransition + toast boilerplate for every destructive action.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  errorTitle = 'Đã xảy ra lỗi',
  onConfirm,
  onSuccess,
}: ConfirmDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await onConfirm();

      if (!result.success) {
        toast.error(errorTitle, {
          description: result.message ?? 'Đã xảy ra lỗi. Vui lòng thử lại.',
        });
        return;
      }

      onSuccess?.();
      onOpenChange(false);
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
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
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
