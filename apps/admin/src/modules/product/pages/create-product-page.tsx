'use client';

import { CurrencyInput, LSelect } from '@admin/components/atoms';
import { Alert, AlertDescription } from '@admin/components/ui/alert';
import { Button } from '@admin/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@admin/components/ui/card';
import { Field, FieldError, FieldLabel } from '@admin/components/ui/field';
import { Input } from '@admin/components/ui/input';
import { RichTextEditor } from '@admin/components/ui/rich-text-editor';
import { FlatCategory } from '@admin/modules/category/types/category.type';
import { MultiImageUploadField } from '@admin/modules/upload';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductStatus } from '@lam-thinh-ecommerce/shared';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { createProductAction } from '../actions';
import { ProductSchema, productSchema } from '../schemas/product.schema';

const STATUS_OPTIONS = [
  { value: ProductStatus.DRAFT, label: 'Nháp' },
  { value: ProductStatus.ACTIVE, label: 'Đang bán' },
  { value: ProductStatus.ARCHIVED, label: 'Lưu trữ' },
];

const FORM_ID = 'create-product-form';

interface CreateProductPageProps {
  categories: FlatCategory[];
}

export function CreateProductPage({ categories }: CreateProductPageProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);

  const { control, handleSubmit, setValue, formState } = useForm<ProductSchema>(
    {
      // @ts-expect-error zodResolver generic mismatch with current zod version
      resolver: zodResolver(productSchema),
      defaultValues: {
        name: '',
        sku: '',
        price: 0,
        compareAtPrice: null,
        stock: 0,
        status: ProductStatus.DRAFT,
        categoryId: '',
        shortDescription: '',
        description: '',
        imageIds: [],
      },
    },
  );

  const isBusy = isPending || isUploading || formState.isSubmitting;

  const onSubmit = (data: ProductSchema) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await createProductAction(data);
      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }
      // Uploaded image was consumed by the API — no need to cancel
      setValue('imageIds', []);
      router.push('/products');
    });
  };

  const handleCancel = () => {
    router.push('/products');
  };

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
    depth: c.depth,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-xs"
            type="button"
            onClick={handleCancel}
            aria-label="Quay lại danh sách sản phẩm"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-xl font-semibold">Thêm sản phẩm</h1>
        </div>
        <Button
          type="submit"
          form={FORM_ID}
          disabled={isBusy}
          aria-busy={isBusy}
        >
          {isPending && (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          )}
          Lưu
        </Button>
      </div>

      <form
        id={FORM_ID}
        // @ts-expect-error zodResolver generic mismatch with current zod version
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 items-start gap-4 lg:grid-cols-5"
      >
        {/* ── Left column ── */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Tên sản phẩm <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="Ví dụ: Dầu nhớt Motul 10W-40"
                      aria-invalid={fieldState.invalid}
                      disabled={isBusy}
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="sku"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      SKU <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="Ví dụ: MOTUL-10W40-1L"
                      aria-invalid={fieldState.invalid}
                      disabled={isBusy}
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="shortDescription"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Mô tả ngắn</FieldLabel>
                    <textarea
                      {...field}
                      id={field.name}
                      rows={3}
                      placeholder="Mô tả ngắn hiển thị trên thẻ sản phẩm..."
                      aria-invalid={fieldState.invalid}
                      disabled={isBusy}
                      className="w-full resize-none rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="description"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Mô tả đầy đủ</FieldLabel>
                    <RichTextEditor
                      id={field.name}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      placeholder="Mô tả chi tiết sản phẩm..."
                      disabled={isBusy}
                      invalid={fieldState.invalid}
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Hình ảnh</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="imageIds"
                control={control}
                render={({ field }) => (
                  <MultiImageUploadField
                    isUploading={isUploading}
                    setIsUploading={setIsUploading}
                    value={field.value ?? []}
                    onChange={field.onChange}
                    disabled={isBusy}
                  />
                )}
              />
            </CardContent>
          </Card>

          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="status"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <LSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      options={STATUS_OPTIONS}
                      name={field.name}
                      invalid={fieldState.invalid}
                      showEmpty={false}
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle>
                Danh mục <span className="text-destructive">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="categoryId"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <LSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      options={categoryOptions}
                      name={field.name}
                      invalid={fieldState.invalid}
                      placeholder="Chọn danh mục"
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Giá</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Controller
                name="price"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Giá bán <span className="text-destructive">*</span>
                    </FieldLabel>
                    <CurrencyInput
                      id={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="250.000"
                      aria-invalid={fieldState.invalid}
                      disabled={isBusy}
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="compareAtPrice"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Giá gốc</FieldLabel>
                    <CurrencyInput
                      id={field.name}
                      value={field.value ?? null}
                      onChange={field.onChange}
                      placeholder="300.000"
                      aria-invalid={fieldState.invalid}
                      disabled={isBusy}
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Tồn kho</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="stock"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Số lượng</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="number"
                      min={0}
                      placeholder="0"
                      aria-invalid={fieldState.invalid}
                      disabled={isBusy}
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </CardContent>
          </Card>

          {/* Cancel — visible on mobile at the bottom */}
          <Button
            type="button"
            variant="outline"
            className="lg:hidden"
            onClick={handleCancel}
            disabled={isBusy}
          >
            Hủy
          </Button>
        </div>
      </form>
    </div>
  );
}
