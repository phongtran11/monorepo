'use client';

import { Button } from '@admin/components/ui/button';
import { Skeleton } from '@admin/components/ui/skeleton';
import { usePermission } from '@admin/modules/auth/context/user.context';
import { Permission } from '@lam-thinh-ecommerce/shared';
import { Package, Plus } from 'lucide-react';

interface ProductHeaderProps {
  loading?: boolean;
  count?: number;
  onCreateClick?: () => void;
}

export function ProductHeader({
  loading = false,
  count,
  onCreateClick,
}: ProductHeaderProps) {
  const canCreate = usePermission(Permission.CREATE_PRODUCT);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Package className="size-5" />
        <h1 className="text-xl font-semibold">Sản phẩm</h1>
        {loading ? (
          <Skeleton className="h-5 w-6 rounded-full" />
        ) : (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {(loading || canCreate) && (
        <Button size="sm" disabled={loading} onClick={onCreateClick}>
          <Plus data-icon="inline-start" />
          Thêm sản phẩm
        </Button>
      )}
    </div>
  );
}
