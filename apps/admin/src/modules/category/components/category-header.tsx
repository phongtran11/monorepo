'use client';

import { Button } from '@admin/components/ui/button';
import { Skeleton } from '@admin/components/ui/skeleton';
import { FolderTree, Plus } from 'lucide-react';

interface CategoryHeaderProps {
  loading?: boolean;
  count?: number;
  canCreate?: boolean;
  onCreateClick?: () => void;
}

export function CategoryHeader({
  loading = false,
  count,
  canCreate,
  onCreateClick,
}: CategoryHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <FolderTree className="size-5" />
        <h1 className="text-xl font-semibold">Danh mục</h1>
        {loading ? (
          <Skeleton className="h-5 w-6 rounded-full" />
        ) : (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {loading || canCreate ? (
        <Button size="sm" disabled={loading} onClick={onCreateClick}>
          <Plus data-icon="inline-start" />
          Thêm danh mục
        </Button>
      ) : null}
    </div>
  );
}
