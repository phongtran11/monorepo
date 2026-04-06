import { useCallback, useRef, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';

import { cancelUploadAction } from '../actions/cancel-upload.action';
import { createCategoryAction } from '../actions/create-category.action';
import { updateCategoryAction } from '../actions/update-category.action';
import { uploadTempAction } from '../actions/upload-temp.action';
import { categorySchema } from '../category.schema';
import type { CategoryFormValues } from '../category.schema';
import type { CategoryResponseDto } from '../category.type';

interface UseCategoryFormOptions {
  category?: CategoryResponseDto;
  onSuccess: () => void;
}

export function useCategoryForm({
  category,
  onSuccess,
}: UseCategoryFormOptions) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(
    category?.image?.url ?? null,
  );
  const pendingTempId = useRef<string | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema) as Resolver<CategoryFormValues>,
    defaultValues: {
      name: category?.name ?? '',
      displayOrder: category?.displayOrder ?? 0,
      parentId: category?.parentId ?? null,
      imageId: null,
    },
  });

  const handleFileChange = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setServerError(null);

      // Cancel previously uploaded temp if any
      if (pendingTempId.current) {
        try {
          await cancelUploadAction({ data: { tempId: pendingTempId.current } });
        } catch {
          // ignore cancel errors
        }
        pendingTempId.current = null;
      }

      try {
        const fileData = await fileToBase64(file);
        const result = await uploadTempAction({
          data: {
            fileName: file.name,
            fileType: file.type,
            fileData,
          },
        });
        pendingTempId.current = result.tempId;
        setTempImageUrl(result.tempUrl);
        form.setValue('imageId', result.tempId);
      } catch (error) {
        setServerError(
          error instanceof Error ? error.message : 'Upload ảnh thất bại',
        );
      } finally {
        setIsUploading(false);
      }
    },
    [form],
  );

  const onSubmit = form.handleSubmit(async (values: CategoryFormValues) => {
    setServerError(null);
    try {
      if (category) {
        await updateCategoryAction({
          data: {
            id: category.id,
            name: values.name,
            displayOrder: values.displayOrder,
            parentId: values.parentId,
            imageId: values.imageId,
          },
        });
      } else {
        await createCategoryAction({ data: values });
      }
      pendingTempId.current = null;
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      onSuccess();
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
      );
    }
  });

  const handleRemoveImage = useCallback(async () => {
    if (pendingTempId.current) {
      try {
        await cancelUploadAction({ data: { tempId: pendingTempId.current } });
      } catch {
        // ignore
      }
      pendingTempId.current = null;
    }
    setTempImageUrl(null);
    form.setValue('imageId', null);
  }, [form]);

  const handleClose = useCallback(async () => {
    if (pendingTempId.current) {
      try {
        await cancelUploadAction({ data: { tempId: pendingTempId.current } });
      } catch {
        // ignore
      }
      pendingTempId.current = null;
    }
    form.reset();
    setServerError(null);
    setTempImageUrl(null);
  }, [form]);

  return {
    form,
    onSubmit,
    serverError,
    isUploading,
    tempImageUrl,
    handleFileChange,
    handleRemoveImage,
    handleClose,
    isSubmitting: form.formState.isSubmitting,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // strip data URL prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
