import { useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface Column<T> {
  /** Cabeçalho da coluna. */
  header: ReactNode
  /** Render da célula. */
  cell: (row: T) => ReactNode
  /** Alinhamento (default left). */
  align?: 'left' | 'right' | 'center'
  /** Largura mínima opcional (classe tailwind, ex: 'min-w-[160px]'). */
  className?: string
  /** Cabeçalho com whitespace-nowrap. */
  nowrap?: boolean
}

/**
 * Tabela genérica orientada a colunas, com hover, estado vazio e paginação
 * cliente opcional. Padroniza o visual de todas as listagens do admin.
 */
export function DataTable<T>({
  columns,
  rows,
  keyField,
  onRowClick,
  minWidth = 720,
  pageSize,
  emptyLabel = 'Nada encontrado.',
  emptyIcon,
}: {
  columns: Column<T>[]
  rows: T[]
  keyField: (row: T) => string | number
  onRowClick?: (row: T) => void
  minWidth?: number
  pageSize?: number
  emptyLabel?: string
  emptyIcon?: ReactNode
}) {
  const [page, setPage] = useState(0)
  const totalPages = pageSize ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1
  const safePage = Math.min(page, totalPages - 1)
  const visible = pageSize ? rows.slice(safePage * pageSize, safePage * pageSize + pageSize) : rows

  const alignClass = (a?: 'left' | 'right' | 'center') =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left'

  return (
    <div className="flex flex-col">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full border-collapse text-sm" style={{ minWidth }}>
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              {columns.map((c, i) => (
                <th
                  key={i}
                  className={cn(
                    'px-3 py-3 font-semibold first:pl-0 last:pr-0',
                    alignClass(c.align),
                    c.nowrap && 'whitespace-nowrap',
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={keyField(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-border/60 last:border-0 transition-colors hover:bg-card-muted/40',
                  onRowClick && 'cursor-pointer',
                )}
              >
                {columns.map((c, i) => (
                  <td
                    key={i}
                    className={cn('px-3 py-3.5 first:pl-0 last:pr-0', alignClass(c.align), c.className)}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
          <span className="text-faint">{emptyIcon ?? <Inbox className="h-8 w-8" />}</span>
          <p className="text-sm text-muted">{emptyLabel}</p>
        </div>
      )}

      {pageSize && rows.length > pageSize && (
        <div className="mt-4 flex items-center justify-between gap-3 text-sm text-muted">
          <span>
            {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, rows.length)} de {rows.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="rounded-lg border border-border p-1.5 transition-colors hover:bg-card-muted disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-medium text-foreground">
              {safePage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="rounded-lg border border-border p-1.5 transition-colors hover:bg-card-muted disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
