import type { ReactNode } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import Button from './Button'
import { EmptyState } from './States'

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  className?: string
  render: (row: T) => ReactNode
}

interface Props<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  total,
  page,
  pageSize,
  onPageChange,
  sortBy,
  sortDir,
  onSort,
  loading = false,
  emptyTitle = 'No results found',
  emptyDescription = 'Try changing your search or filters.',
}: Props<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  const windowStart = Math.max(1, Math.min(page - 2, totalPages - 4))
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => windowStart + i,
  )

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className={`overflow-x-auto transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              {columns.map((col) => {
                const isSorted = sortBy === col.key
                return (
                  <th key={col.key} className={`px-4 py-3 font-medium ${col.className ?? ''}`}>
                    {col.sortable && onSort ? (
                      <button
                        onClick={() => onSort(col.key)}
                        className="inline-flex items-center gap-1 uppercase hover:text-gray-800"
                      >
                        {col.header}
                        {isSorted ? (
                          sortDir === 'asc' ? (
                            <ChevronUp size={14} className="text-brand" />
                          ) : (
                            <ChevronDown size={14} className="text-brand" />
                          )
                        ) : (
                          <ChevronsUpDown size={14} className="text-gray-400" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 ${col.className ?? ''}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && !loading && (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        )}
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row">
        <p className="text-sm text-gray-500">
          Showing {start}–{end} of {total}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            className="px-3 py-1.5"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </Button>
          {pageNumbers.map((n) => (
            <button
              key={n}
              onClick={() => onPageChange(n)}
              className={`h-8 min-w-8 rounded-lg px-2 text-sm font-medium ${
                n === page ? 'bg-brand text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {n}
            </button>
          ))}
          <Button
            variant="outline"
            className="px-3 py-1.5"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}