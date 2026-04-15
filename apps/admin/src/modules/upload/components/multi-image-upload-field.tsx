'use client';

import { Button } from '@admin/components/ui/button';
import { cn } from '@admin/lib/utils';
import { Loader2, Plus, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';

import {
  cancelUploadAction,
  getUploadSignatureAction,
  registerTempUploadAction,
} from '../actions';

interface MultiImageUploadFieldProps {
  /** Array of tempIds currently staged in the form. */
  value: string[];
  /** Called with the updated array after each add or remove. */
  onChange: (tempIds: string[]) => void;
  disabled?: boolean;
  isUploading: boolean;
  setIsUploading: (v: boolean) => void;
  /** Maximum number of images allowed. Defaults to 10. */
  maxImages?: number;
}

export function MultiImageUploadField({
  value,
  onChange,
  disabled,
  isUploading,
  setIsUploading,
  maxImages = 10,
}: MultiImageUploadFieldProps) {
  /**
   * Map from tempId → preview URL. Updated progressively as each concurrent
   * upload completes so thumbnails appear one-by-one rather than all at once.
   */
  const [previews, setPreviews] = useState<Record<string, string>>({});
  /**
   * Number of uploads currently in-flight. Drives the skeleton placeholder
   * tiles so the user sees something happening immediately after picking files.
   */
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
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
          // Step 1: get a short-lived Cloudinary signature
          const sigResult = await getUploadSignatureAction();
          if (!sigResult.success || !sigResult.data) {
            setError('Tải ảnh thất bại. Vui lòng thử lại.');
            return;
          }

          const { signature, timestamp, apiKey, cloudName, folder, tags } =
            sigResult.data;

          // Step 2: upload directly from the browser to Cloudinary
          const cloudinaryForm = new FormData();
          cloudinaryForm.append('file', file);
          cloudinaryForm.append('api_key', apiKey);
          cloudinaryForm.append('timestamp', String(timestamp));
          cloudinaryForm.append('signature', signature);
          cloudinaryForm.append('folder', folder);
          cloudinaryForm.append('tags', tags);

          const cloudRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: 'POST', body: cloudinaryForm },
          );

          if (!cloudRes.ok) {
            setError('Tải ảnh thất bại. Vui lòng thử lại.');
            return;
          }

          const { public_id, secure_url } = (await cloudRes.json()) as {
            public_id: string;
            secure_url: string;
          };

          // Step 3: register with the backend to get a tempId
          const result = await registerTempUploadAction(public_id, secure_url);
          if (!result.success || !result.data) {
            setError('Tải ảnh thất bại. Vui lòng thử lại.');
            return;
          }

          const { tempId, tempUrl } = result.data;

          // Update preview map immediately so this thumbnail appears
          // without waiting for the other concurrent uploads to finish.
          setPreviews((prev) => ({ ...prev, [tempId]: tempUrl }));
          newIds.push(tempId);
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

  const handleRemove = (tempId: string) => {
    cancelUploadAction(tempId);
    setPreviews((prev) => {
      const next = { ...prev };
      delete next[tempId];
      return next;
    });
    onChange(value.filter((id) => id !== tempId));
  };

  const canAddMore = value.length + uploadingCount < maxImages && !disabled;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        {/* Completed uploads */}
        {value.map((tempId) => (
          <div key={tempId} className="relative size-24 shrink-0">
            <div className="relative size-24 overflow-hidden rounded-lg border">
              <Image
                src={previews[tempId]}
                alt="Product image preview"
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => handleRemove(tempId)}
              disabled={disabled}
              aria-label="Xóa ảnh"
              className="absolute -right-2 -top-2 size-5"
            >
              <X className="size-3" />
            </Button>
          </div>
        ))}

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
