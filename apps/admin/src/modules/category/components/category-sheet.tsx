'use client';

import { LSelect } from '@admin/components/atoms';
import { Alert, AlertDescription } from '@admin/components/ui/alert';
import { Button } from '@admin/components/ui/button';
import { Field, FieldError, FieldLabel } from '@admin/components/ui/field';
import { Input } from '@admin/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@admin/components/ui/sheet';
import { cancelUploadAction, ImageUploadField } from '@admin/modules/upload';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { createCategoryAction, updateCategoryAction } from '../actions';
import { CategorySchema, categorySchema } from '../schemas/category.schema';
import { FlatCategory } from '../types/category.type';

interface CategorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editCategory?: FlatCategory | null;
  allCategories: FlatCategory[];
}

export function CategorySheet({
  open,
  onOpenChange,
  editCategory,
  allCategories,
}: CategorySheetProps) {
  const isEdit = !!editCategory;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const prevOpenRef = useRef(false);

  const { control, handleSubmit, reset, getValues, setValue, formState } =
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
        parentId: editCategory?.parentId ?? '',
        imageId: '',
      });
    }
    prevOpenRef.current = open;
  }, [open, editCategory, reset]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      // Cancel any staged (not yet submitted) temp upload
      const tempId = getValues('imageId');
      if (tempId) cancelUploadAction(tempId);
      setErrorMessage(null);
    }
    onOpenChange(next);
  };

  const onSubmit = (data: CategorySchema) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = isEdit
        ? await updateCategoryAction(editCategory!.id, data)
        : await createCategoryAction(data);

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      // Clear imageId before closing so handleOpenChange skips the cancel —
      // the tempId was already consumed by the API.
      setValue('imageId', '');
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
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}
          </SheetTitle>
        </SheetHeader>

        <form
          // @ts-expect-error zodResolver generic mismatch with current zod version
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
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
                  currentImageUrl={editCategory?.imageUrl}
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
                <LSelect
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

          <SheetFooter className="px-0">
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
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
