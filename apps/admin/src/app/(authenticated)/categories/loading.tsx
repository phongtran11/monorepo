import { Button } from '@admin/components/ui/button';
import { Card, CardContent } from '@admin/components/ui/card';
import { Spinner } from '@admin/components/ui/spinner';
import { FolderTree, Plus } from 'lucide-react';

export default function CategoriesLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderTree className="size-5" />
          <h1 className="text-xl font-semibold">Danh mục</h1>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            <Spinner />
          </span>
        </div>
        <Button size="sm" variant="outline" disabled>
          <Plus data-icon="inline-start" />
          Thêm danh mục
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <Spinner className="size-15" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
