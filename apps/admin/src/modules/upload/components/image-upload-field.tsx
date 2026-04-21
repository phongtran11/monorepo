'use client';

import { Button } from '@admin/components/ui/button';
import { cn } from '@admin/lib/utils';
import { Camera, Clipboard, ImageIcon, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

import { uploadToCloudinary } from '../utils/cloudinary-upload';

interface ImageUploadFieldProps {
  /** The current imageId value from the form (empty string = no staged upload). */
  value: string;
  /** Called with the new imageId after a successful upload, or '' when removed. */
  onChange: (imageId: string) => void;
  /** Existing image URL from the server (shown when no upload is staged). */
  currentImageUrl?: string | null;
  disabled?: boolean;
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
}

export function ImageUploadField({
  value,
  onChange,
  currentImageUrl,
  disabled,
  isUploading,
  setIsUploading,
}: ImageUploadFieldProps) {
  // Tracks the currently staged upload: imageId + its preview URL.
  // Kept as a single object so they stay in sync without an effect.
  const [staged, setStaged] = useState<{
    imageId: string;
    previewUrl: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPasteHovered, setIsPasteHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Show the staged preview when the form value matches our staged imageId;
  // otherwise fall back to the existing server image.
  const displayUrl =
    staged && staged.imageId === value
      ? staged.previewUrl
      : (currentImageUrl ?? null);
  const hasImage = !!displayUrl;

  const uploadFile = useCallback(
    async (file: File) => {
      if (disabled || isUploading) return;

      // Clear previous staged state before starting a replacement
      if (staged) {
        setStaged(null);
      }

      setIsUploading(true);
      setError(null);
      onChange('');

      const result = await uploadToCloudinary(file);

      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (!result) {
        setError('Tải ảnh thất bại. Vui lòng thử lại.');
        return;
      }

      setStaged({ imageId: result.imageId, previewUrl: result.previewUrl });
      onChange(result.imageId);
    },
    [disabled, isUploading, staged, onChange, setIsUploading],
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  // Listen for paste events on the container element
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) await uploadFile(file);
          break;
        }
      }
    };

    container.addEventListener('paste', handlePaste);
    return () => container.removeEventListener('paste', handlePaste);
  }, [uploadFile]);

  const handleRemove = () => {
    setStaged(null);
    onChange('');
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div
        ref={containerRef}
        className="flex items-end gap-2"
        // Make the container focusable so paste events fire when it or a child is focused
        tabIndex={-1}
        style={{ outline: 'none' }}
      >
        {/* Image picker button */}
        <div className="relative w-fit">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            aria-label="Chọn ảnh danh mục"
            className={cn(
              'relative flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-input transition-colors',
              'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50',
              hasImage ? 'border-transparent' : 'bg-muted/30',
            )}
          >
            {isUploading ? (
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            ) : hasImage ? (
              <>
                <Image
                  src={displayUrl}
                  alt="Category image preview"
                  fill
                  className="object-conatain"
                  sizes="96px"
                  priority
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                  <Camera className="size-5 text-white" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <ImageIcon className="size-7 opacity-40" />
                <span className="text-xs">Chọn ảnh</span>
              </div>
            )}
          </button>

          {/* Remove button — only shown when a new image is staged */}
          {value && !isUploading && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleRemove}
              disabled={disabled}
              aria-label="Xóa ảnh đã chọn"
              className="absolute -right-2 -top-2 size-5"
            >
              <X className="size-3" />
            </Button>
          )}
        </div>

        {/* Paste from clipboard button */}
        <button
          type="button"
          disabled={disabled || isUploading}
          aria-label="Dán ảnh từ clipboard"
          onMouseEnter={() => setIsPasteHovered(true)}
          onMouseLeave={() => setIsPasteHovered(false)}
          onClick={async () => {
            try {
              const clipboardItems = await navigator.clipboard.read();
              for (const clipboardItem of clipboardItems) {
                for (const type of clipboardItem.types) {
                  if (type.startsWith('image/')) {
                    const blob = await clipboardItem.getType(type);
                    const file = new File([blob], 'paste.png', { type });
                    await uploadFile(file);
                    return;
                  }
                }
              }
              setError('Không tìm thấy ảnh trong clipboard.');
            } catch {
              setError('Không thể đọc clipboard. Hãy dùng Ctrl+V.');
            }
          }}
          className={cn(
            'flex size-8 items-center justify-center rounded-md border border-dashed border-input transition-colors',
            'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            isPasteHovered ? 'bg-muted/50' : 'bg-muted/20',
          )}
          title="Dán ảnh từ clipboard (Ctrl+V)"
        >
          <Clipboard className="size-4 text-muted-foreground" />
        </button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />
    </div>
  );
}
