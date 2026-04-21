'use client';

import { ImageViewer } from '@admin/components/modules/image-viewer';
import { Button } from '@admin/components/ui/button';
import { cn } from '@admin/lib/utils';
import { Loader2, Plus, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { uploadToCloudinary } from '../utils/cloudinary-upload';

interface MultiImageUploadFieldProps {
  /** Array of imageIds currently staged in the form. */
  value: string[];
  /** Called with the updated array after each add or remove. */
  onChange: (imageIds: string[]) => void;
  disabled?: boolean;
  isUploading: boolean;
  setIsUploading: (v: boolean) => void;
  /** Maximum number of images allowed. Defaults to 10. */
  maxImages?: number;
  /** Map of existing image ID → URL for images already saved in the backend */
  existingImages?: Record<string, string>;
}

export function MultiImageUploadField({
  value,
  onChange,
  disabled,
  isUploading,
  setIsUploading,
  maxImages = 10,
  existingImages = {},
}: MultiImageUploadFieldProps) {
  /**
   * Map from imageId → preview URL. Updated progressively as each concurrent
   * upload completes so thumbnails appear one-by-one rather than all at once.
   */
  const [previews, setPreviews] =
    useState<Record<string, string>>(existingImages);

  // Initialize previews with existing image URLs when component mounts or existingImages changes
  useEffect(() => {
    if (Object.keys(existingImages).length > 0) {
      setPreviews((prev) => ({ ...existingImages, ...prev }));
    }
  }, [existingImages]);
  /**
   * Number of uploads currently in-flight. Drives the skeleton placeholder
   * tiles so the user sees something happening immediately after picking files.
   */
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [viewingSrc, setViewingSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Clamp to remaining slots
    const slots = Math.min(files.length, maxImages - value.length);
    if (slots <= 0) return;

    setError(null);
    setIsUploading(true);
    setUploadingCount(slots); // show N skeleton tiles immediately

    const newIds: string[] = [];

    // Upload all files concurrently. Each upload updates previews progressively
    // as it lands. A local `newIds` collector avoids stale-closure on the
    // `value` prop — we do a single onChange at the end.
    await Promise.all(
      files.slice(0, slots).map(async (file) => {
        try {
          const result = await uploadToCloudinary(file);

          if (!result) {
            setError('Tải ảnh thất bại. Vui lòng thử lại.');
            return;
          }

          const { imageId, previewUrl } = result;

          // Update preview map immediately so this thumbnail appears
          // without waiting for the other concurrent uploads to finish.
          setPreviews((prev) => ({ ...prev, [imageId]: previewUrl }));
          newIds.push(imageId);
        } finally {
          // Decrement the skeleton count as each upload settles (success or failure)
          setUploadingCount((c) => c - 1);
        }
      }),
    );

    // Single onChange call after all uploads complete to avoid stale value
    onChange([...value, ...newIds]);
    setIsUploading(false);
  };

  const handleRemove = (imageId: string) => {
    setPreviews((prev) => {
      const next = { ...prev };
      delete next[imageId];
      return next;
    });
    onChange(value.filter((id) => id !== imageId));
  };

  const canAddMore = value.length + uploadingCount < maxImages && !disabled;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        {/* Completed uploads */}
        {value.map((imageId) => (
          <div key={imageId} className="relative size-24 shrink-0">
            <button
              type="button"
              onClick={() =>
                previews[imageId] && setViewingSrc(previews[imageId])
              }
              className="relative size-24 cursor-zoom-in overflow-hidden rounded-lg border transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Xem ảnh"
            >
              <Image
                src={previews[imageId]}
                alt="Product image preview"
                fill
                className="object-cover"
                sizes="96px"
                priority
              />
            </button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => handleRemove(imageId)}
              disabled={disabled}
              aria-label="Xóa ảnh"
              className="absolute -right-2 -top-2 size-5"
            >
              <X className="size-3" />
            </Button>
          </div>
        ))}

        <ImageViewer
          open={!!viewingSrc}
          onOpenChange={(open) => {
            if (!open) setViewingSrc(null);
          }}
          src={viewingSrc ?? ''}
          alt="Product image preview"
        />

        {/* Skeleton placeholders — one per in-flight upload */}
        {Array.from({ length: uploadingCount }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="flex size-24 shrink-0 items-center justify-center rounded-lg border bg-muted"
          >
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ))}

        {/* Add-more tile — hidden once the limit is reached */}
        {canAddMore && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            aria-label="Thêm ảnh"
            className={cn(
              'flex size-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-input bg-muted/30 text-muted-foreground transition-colors',
              'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            <Plus className="size-5 opacity-60" />
            <span className="text-xs">Thêm ảnh</span>
          </button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />
    </div>
  );
}
