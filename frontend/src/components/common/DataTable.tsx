import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  total?: number;
  page?: number;
  limit?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string }>({
  columns, data, loading, total, page = 1, limit = 10,
  hasNextPage, hasPreviousPage, onPageChange, emptyMessage = 'No data found',
}: DataTableProps<T>) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {columns.map(col => (
                <th key={col.key} className={cn('text-left px-4 py-3 font-semibold text-muted-foreground', col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={row.id} className={cn('border-t hover:bg-muted/30 transition-colors', idx % 2 === 0 ? '' : 'bg-muted/10')}>
                  {columns.map(col => (
                    <td key={col.key} className={cn('px-4 py-3', col.className)}>
                      {col.render ? col.render(row) : String((row as any)[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total !== undefined && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total} records</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPreviousPage}
              onClick={() => onPageChange?.(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="font-medium">Page {page}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNextPage}
              onClick={() => onPageChange?.(page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
