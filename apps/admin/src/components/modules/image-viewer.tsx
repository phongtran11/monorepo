'use client';

import { Button } from '@admin/components/ui/button';
import { cn } from '@admin/lib/utils';
import { Minus, Plus, RotateCcw, X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import * as React from 'react';

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const STEP = 0.25;

interface ImageViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt: string;
}

/**
 * Full-screen image viewer with zoom controls.
 * Consumer owns the open state. Zoom resets to 100% when closed.
 */
export function ImageViewer({
  open,
  onOpenChange,
  src,
  alt,
}: ImageViewerProps) {
  const [scale, setScale] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const isDragging = React.useRef(false);
  const dragStart = React.useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  React.useEffect(() => {
    if (!open) {
      setScale(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [open]);

  const zoomIn = () =>
    setScale((s) => Math.min(+(s + STEP).toFixed(2), MAX_SCALE));
  const zoomOut = () =>
    setScale((s) => Math.max(+(s - STEP).toFixed(2), MIN_SCALE));
  const reset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (scale <= 1) return;
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          data-slot="image-viewer-overlay"
          className="fixed inset-0 z-50 bg-black/80 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <Dialog.Content
          data-slot="image-viewer-content"
          className={cn(
            'fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 outline-none',
            'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
          )}
        >
          <Dialog.Title className="text-white">{alt}</Dialog.Title>
          <Dialog.Description className="sr-only">{alt}</Dialog.Description>
          {/* Close button */}
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 text-white hover:bg-white/20 hover:text-white"
              aria-label="Đóng"
            >
              <X className="size-5" />
            </Button>
          </Dialog.Close>

          {/* Image — drag container */}
          <div
            className="flex max-h-[85vh] max-w-[90vw] items-center justify-center overflow-hidden"
            style={{
              cursor:
                scale > 1
                  ? isDragging.current
                    ? 'grabbing'
                    : 'grab'
                  : 'default',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src || undefined}
              alt={alt}
              width={1024}
              height={1024}
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transition: isDragging.current
                  ? 'none'
                  : 'transform 150ms ease',
              }}
              className="max-h-[85vh] max-w-[90vw] rounded-md object-contain"
              draggable={false}
            />
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={zoomOut}
              disabled={scale <= MIN_SCALE}
              aria-label="Thu nhỏ"
              className="text-white hover:bg-white/20 hover:text-white disabled:opacity-40"
            >
              <Minus className="size-4" />
            </Button>

            <button
              type="button"
              onClick={reset}
              className="min-w-[3.5rem] text-center text-sm font-medium text-white hover:text-white/80"
              aria-label="Đặt lại zoom"
            >
              {Math.round(scale * 100)}%
            </button>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={zoomIn}
              disabled={scale >= MAX_SCALE}
              aria-label="Phóng to"
              className="text-white hover:bg-white/20 hover:text-white disabled:opacity-40"
            >
              <Plus className="size-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={reset}
              aria-label="Đặt lại zoom"
              className="text-white hover:bg-white/20 hover:text-white"
            >
              <RotateCcw className="size-4" />
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
