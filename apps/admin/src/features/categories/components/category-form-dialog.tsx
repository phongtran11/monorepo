import { useRef } from 'react';

import { ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { Controller } from 'react-hook-form';

import { Alert, AlertDescription } from '@admin/components/ui/alert';
import { Button } from '@admin/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@admin/components/ui/dialog';
import { Input } from '@admin/components/ui/input';
import { Label } from '@admin/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@admin/components/ui/select';
import { useCategoryForm } from '../hooks/use-category-form';
import type { CategoryResponseDto } from '../category.type';

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryResponseDto;
  categories: CategoryResponseDto[];
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  categories,
}: CategoryFormDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    form,
    onSubmit,
    serverError,
    isUploading,
    tempImageUrl,
    handleFileChange,
    handleRemoveImage,
    handleClose,
    isSubmitting,
  } = useCategoryForm({
    category,
    onSuccess: () => onOpenChange(false),
  });

  const {
    register,
    control,
    formState: { errors },
  } = form;

  const parentOptions = categories.filter((c) => c.id !== category?.id);

  const handleDialogClose = async (isOpen: boolean) => {
    if (!isOpen) {
      await handleClose();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent aria-describedby="" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Tên danh mục <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Nhập tên danh mục"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-destructive text-xs">{errors.name.message}</p>
            )}
          </div>

          {/* Display Order */}
          <div className="space-y-1.5">
            <Label htmlFor="displayOrder">
              Thứ tự hiển thị <span className="text-destructive">*</span>
            </Label>
            <Input
              id="displayOrder"
              type="number"
              min={0}
              placeholder="0"
              {...register('displayOrder')}
            />
            {errors.displayOrder && (
              <p className="text-destructive text-xs">
                {errors.displayOrder.message}
              </p>
            )}
          </div>

          {/* Parent Category */}
          <div className="space-y-1.5">
            <Label>Danh mục cha</Label>
            <Controller
              control={control}
              name="parentId"
              render={({ field }) => (
                <Select
                  value={field.value ?? '__none__'}
                  onValueChange={(v) =>
                    field.onChange(v === '__none__' ? null : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Không có (danh mục gốc)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      Không có (danh mục gốc)
                    </SelectItem>
                    {parentOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-1.5">
            <Label>Ảnh danh mục</Label>
            <div
              className="border-border hover:border-primary/50 group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  <Loader2 className="text-muted-foreground size-8 animate-spin" />
                  <p className="text-muted-foreground text-sm">
                    Đang tải ảnh...
                  </p>
                </div>
              ) : tempImageUrl ? (
                <div className="relative">
                  <img
                    src={tempImageUrl}
                    alt="Preview"
                    className="max-h-32 rounded-md object-contain"
                  />
                  <Button
                    variant="destructive"
                    className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2"
                    size="icon-xs"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="bg-muted rounded-full p-2">
                    <ImageIcon className="text-muted-foreground size-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      <Upload className="mr-1 inline size-3.5" />
                      Chọn ảnh
                    </p>
                    <p className="text-muted-foreground text-xs">
                      PNG, JPG, WEBP (tối đa 5MB)
                    </p>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChange(file);
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={isSubmitting || isUploading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {category ? 'Lưu thay đổi' : 'Tạo danh mục'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
