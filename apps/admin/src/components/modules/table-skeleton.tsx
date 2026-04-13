import { Card, CardContent } from '@admin/components/ui/card';
import { Skeleton } from '@admin/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@admin/components/ui/table';

/** Preset skeleton cell types that cover common table column patterns. */
export type SkeletonCellType =
  /** A 4×4 checkbox square. */
  | { type: 'checkbox' }
  /** A single text line. Optionally control the width. */
  | { type: 'text'; width?: string }
  /** Expand-chevron icon + avatar thumbnail + two stacked text lines. */
  | { type: 'avatar-text' }
  /** A small centered badge (e.g. order number, status). */
  | { type: 'badge'; width?: string }
  /** N right-aligned icon-button squares. */
  | { type: 'actions'; count?: number };

export interface TableSkeletonColumn {
  /** Text rendered in the `<TableHead>`. Omit for icon-only or spacer columns. */
  header?: string;
  /** Tailwind width class applied to `<TableHead>` (e.g. `'w-10'`). */
  width?: string;
  /** Horizontal alignment of both the header and skeleton cell content. */
  align?: 'left' | 'center' | 'right';
  /** Which skeleton pattern to render inside each body cell. */
  cell: SkeletonCellType;
}

interface TableSkeletonProps {
  columns: TableSkeletonColumn[];
  /** Number of placeholder rows to render. Defaults to 6. */
  rows?: number;
}

function SkeletonCell({ cell }: { cell: SkeletonCellType }) {
  switch (cell.type) {
    case 'checkbox':
      return <Skeleton className="size-4" />;

    case 'text':
      return <Skeleton className={`h-4 ${cell.width ?? 'w-32'}`} />;

    case 'avatar-text':
      return (
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 shrink-0" />
          <Skeleton className="size-8 shrink-0 rounded" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      );

    case 'badge':
      return (
        <Skeleton className={`mx-auto h-5 rounded ${cell.width ?? 'w-8'}`} />
      );

    case 'actions': {
      const count = cell.count ?? 1;
      return (
        <div className="flex items-center justify-end gap-1">
          {Array.from({ length: count }).map((_, i) => (
            <Skeleton key={i} className="size-6 rounded" />
          ))}
        </div>
      );
    }
  }
}

const alignClass = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

export function TableSkeleton({ columns, rows = 6 }: TableSkeletonProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, i) => (
                <TableHead
                  key={i}
                  className={[
                    col.width,
                    col.align ? alignClass[col.align] : undefined,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {col.header ??
                    (col.cell.type === 'checkbox' ? (
                      <Skeleton className="size-4" />
                    ) : null)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <TableRow key={rowIdx}>
                {columns.map((col, colIdx) => (
                  <TableCell
                    key={colIdx}
                    className={col.align ? alignClass[col.align] : undefined}
                  >
                    <SkeletonCell cell={col.cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
