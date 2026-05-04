'use client';

import { Select } from '@admin/components/atoms';
import { Alert, AlertDescription } from '@admin/components/ui/alert';
import { Button } from '@admin/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@admin/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@admin/components/ui/field';
import { Input } from '@admin/components/ui/input';
import { handleApiFormError } from '@admin/lib/utils';
import { ImageUploadField } from '@admin/modules/upload';
import { zodResolver } from '@hookform/resolvers/zod';
import { getDirtyFields } from '@lam-thinh-ecommerce/shared';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { createCategoryAction, updateCategoryAction } from '../actions';
import { CategorySchema, categorySchema } from '../schemas/category.schema';
import { FlatCategory } from '../types/category.type';

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editCategory?: FlatCategory | null;
  allCategories: FlatCategory[];
}

export function CategoryDialog({
  open,
  onOpenChange,
  editCategory,
  allCategories,
}: CategoryDialogProps) {
  const isEdit = !!editCategory;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const prevOpenRef = useRef(false);

  const { control, handleSubmit, reset, setValue, setError, formState } =
    useForm<CategorySchema>({
      // @ts-expect-error zodResolver generic mismatch with current zod version
      resolver: zodResolver(categorySchema),
      defaultValues: {
        name: '',
        displayOrder: 0,
        parentId: null,
        imageId: null,
      },
    });

  const isBusy = isPending || isUploading || formState.isSubmitting;

  // Reset form on open → true edge
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      reset({
        name: editCategory?.name ?? '',
        displayOrder: editCategory?.displayOrder ?? 0,
        parentId: editCategory?.parentId ?? null,
        imageId: null,
      });
    }
    prevOpenRef.current = open;
  }, [open, editCategory, reset]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setErrorMessage(null);
    }
    onOpenChange(next);
  };

  const onSubmit = (data: CategorySchema) => {
    setErrorMessage(null);
    startTransition(async () => {
      let result;

      if (isEdit) {
        result = await updateCategoryAction(
          editCategory!.id,
          getDirtyFields(data, formState.dirtyFields),
        );
      } else {
        result = await createCategoryAction(data);
      }

      if (!result.success) {
        handleApiFormError(result, setError, setErrorMessage);
        return;
      }

      // Clear imageId before closing so handleOpenChange skips the cancel —
      // the tempId was already consumed by the API.
      setValue('imageId', null);
      handleOpenChange(false);
    });
  };

  // Exclude the category being edited from parent options
  const parentOptions = allCategories
    .filter((c) => c.id !== editCategory?.id && c.parentId !== editCategory?.id)
    .map((c) => ({
      value: c.id,
      label: c.name,
      depth: c.depth,
    }));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? 'Cập nhật thông tin danh mục.' : 'Tạo danh mục mới.'}
          </DialogDescription>
        </DialogHeader>

        <form
          // @ts-expect-error zodResolver generic mismatch with current zod version
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto"
        >
          <Controller
            name="imageId"
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Ảnh danh mục</FieldLabel>
                <ImageUploadField
                  isUploading={isUploading}
                  setIsUploading={setIsUploading}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  currentImageUrl={editCategory?.image?.secureUrl}
                  disabled={isBusy}
                />
              </Field>
            )}
          />

          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Tên danh mục</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="Ví dụ: Dầu nhớt"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="displayOrder"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Thứ tự hiển thị</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="number"
                  min={0}
                  placeholder="0"
                  aria-invalid={fieldState.invalid}
                  value={field.value ?? 0}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="parentId"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Danh mục cha</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={(val) => field.onChange(val)}
                  options={parentOptions}
                  name={field.name}
                  invalid={fieldState.invalid}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isBusy}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isBusy} aria-busy={isBusy}>
              {isPending && (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              )}
              {isEdit ? 'Lưu thay đổi' : 'Thêm danh mục'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
