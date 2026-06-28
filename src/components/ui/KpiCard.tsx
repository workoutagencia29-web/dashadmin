import type { ReactNode } from 'react'
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react'
import { cn, formatDelta } from '../../lib/utils'

/** Escolhe o tamanho da fonte do valor conforme o comprimento — uma linha só,
 *  dimensionada para caber até nos cards mais estreitos (grid de 4 colunas).
 *  Sem upscale por viewport (as colunas ficam MAIS estreitas em telas largas). */
function kpiValueSize(value: string | number): string {
  const len = String(value).length
  if (len <= 8) return 'text-[26px]'
  if (len <= 11) return 'text-2xl'
  if (len <= 13) return 'text-xl'
  if (len <= 16) return 'text-lg'
  if (len <= 19) return 'text-base'
  return 'text-sm'
}

/**
 * Card de KPI: ícone em pílula, valor grande, delta colorido e label.
 * `invertDelta` (ex: chargeback, recusas) trata queda como positiva.
 */
export function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  invertDelta = false,
  hint,
  footer,
  className,
}: {
  label: string
  value: string | number
  delta?: number
  icon: LucideIcon
  invertDelta?: boolean
  hint?: string
  footer?: ReactNode
  className?: string
}) {
  const good = delta === undefined ? true : invertDelta ? delta <= 0 : delta >= 0
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card-muted text-muted">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        {delta !== undefined && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-semibold',
              good ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
            )}
          >
            {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {formatDelta(delta)}
          </span>
        )}
      </div>
      <p
        className={cn(
          'mt-4 truncate font-bold leading-tight tracking-tight tabular-nums text-foreground',
          // fonte dimensionada pelo comprimento — valor completo numa linha só, sem estourar
          kpiValueSize(value),
        )}
        title={typeof value === 'string' ? value : String(value)}
      >
        {value}
      </p>
      <p className="mt-2 text-sm text-muted">{label}</p>
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  )
}
