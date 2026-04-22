'use client';

import { ImageViewer } from '@admin/components/modules/image-viewer';
import { Button } from '@admin/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@admin/components/ui/card';
import { FieldLabel } from '@admin/components/ui/field';
import { usePermission } from '@admin/modules/auth/context/user.context';
import { FlatCategory } from '@admin/modules/category/types/category.type';
import { formatVND, Permission } from '@lam-thinh-ecommerce/shared';
import { ArrowLeft, Pencil } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Product, PRODUCT_STATUS_CONFIG } from '../types/product.type';

interface DetailProductPageProps {
  product: Product;
  categories: FlatCategory[];
}

export function DetailProductPage({
  product,
  categories,
}: DetailProductPageProps) {
  const router = useRouter();
  const canUpdate = usePermission(Permission.UPDATE_PRODUCT);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  const categoryName =
    categories.find((c) => c.id === product.categoryId)?.name ??
    product.categoryId;

  const statusConfig = PRODUCT_STATUS_CONFIG[product.status];

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-xs"
            type="button"
            onClick={() => router.push('/products')}
            aria-label="Quay lại danh sách sản phẩm"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-xl font-semibold">Chi tiết sản phẩm</h1>
        </div>
        {canUpdate && (
          <Button
            type="button"
            onClick={() => router.push(`/products/${product.id}/edit`)}
          >
            <Pencil data-icon="inline-start" />
            Sửa
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-5">
        {/* ── Left column ── */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <FieldLabel>Tên sản phẩm</FieldLabel>
                <p className="text-sm">{product.name}</p>
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>SKU</FieldLabel>
                <p className="text-sm">{product.sku}</p>
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>Mô tả ngắn</FieldLabel>
                {product.shortDescription ? (
                  <p className="text-sm">{product.shortDescription}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>Mô tả đầy đủ</FieldLabel>
                {product.description ? (
                  <div
                    className="text-sm [&_h2]:mb-1 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-4"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Hình ảnh</CardTitle>
            </CardHeader>
            <CardContent>
              {product.images.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-3">
                    {product.images.map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setSelectedImage(img.secureUrl)}
                        className="relative size-24 shrink-0 cursor-zoom-in overflow-hidden rounded-lg border transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Xem ảnh lớn"
                      >
                        <Image
                          src={img.secureUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </button>
                    ))}
                  </div>
                  <ImageViewer
                    open={!!selectedImage}
                    onOpenChange={(open) => {
                      if (!open) setSelectedImage(null);
                    }}
                    src={selectedImage ?? ''}
                    alt={product.name}
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Không có hình ảnh
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right sidebar ── */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.className}`}
              >
                {statusConfig.label}
              </span>
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle>Danh mục</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{categoryName}</p>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Giá</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <FieldLabel>Giá bán</FieldLabel>
                <p className="text-sm font-medium">
                  {formatVND(product.price)}
                </p>
              </div>
              {product.compareAtPrice !== null && (
                <div className="flex flex-col gap-1">
                  <FieldLabel>Giá gốc</FieldLabel>
                  <p className="text-sm text-muted-foreground line-through">
                    {formatVND(product.compareAtPrice)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Tồn kho</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1">
                <FieldLabel>Số lượng</FieldLabel>
                <p className="text-sm">{product.stock}</p>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Thời gian</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <FieldLabel>Ngày tạo</FieldLabel>
                <p className="text-sm">
                  {new Date(product.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel>Cập nhật lần cuối</FieldLabel>
                <p className="text-sm">
                  {new Date(product.updatedAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
