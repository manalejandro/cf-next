import { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  empty?: ReactNode;
  className?: string;
}

export function Table<T>({ columns, data, keyExtractor, loading, empty, className = "" }: TableProps<T>) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-[var(--border)] ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide whitespace-nowrap"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="bg-[var(--bg-surface)]">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 rounded bg-[var(--bg-elevated)] animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-[var(--text-tertiary)]">
                {empty ?? "No data available"}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-[var(--text-primary)]">
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}

export function Pagination({ page, totalPages, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
      <span>Page {page} of {totalPages}</span>
      <div className="flex gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] disabled:opacity-40 hover:bg-[var(--bg-overlay)] transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] disabled:opacity-40 hover:bg-[var(--bg-overlay)] transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
