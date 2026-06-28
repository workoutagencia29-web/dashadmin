import { useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useDialog } from '../../lib/useDialog'

export function Drawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = 'md',
}: {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: 'md' | 'lg'
}) {
  const ref = useRef<HTMLDivElement>(null)
  useDialog(open, onClose, ref)

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        ref={ref}
        tabIndex={-1}
        className={cn(
          'scrollbar-thin absolute right-0 top-0 flex h-full w-full flex-col border-l border-border bg-card shadow-2xl animate-fade-in focus:outline-none',
          width === 'lg' ? 'max-w-xl' : 'max-w-md',
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-card-muted hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="border-t border-border p-4">{footer}</div>}
      </div>
    </div>
  )
}

/** Lista de campos rótulo→valor (usada nos drawers). */
export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2.5 last:border-0">
      <span className="shrink-0 text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

export function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">{title}</h4>
      {children}
    </div>
  )
}

/** Timeline vertical (status de transação/disputa/saque). */
export function Timeline({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const done = i <= current
        const last = i === steps.length - 1
        return (
          <div key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex h-4 w-4 items-center justify-center rounded-full',
                  done ? 'bg-primary' : 'bg-card-muted',
                )}
              >
                {done && (
                  <svg className="h-2.5 w-2.5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </span>
              {!last && (
                <span
                  className={cn('w-px flex-1', i < current ? 'bg-primary' : 'bg-border')}
                  style={{ minHeight: 20 }}
                />
              )}
            </div>
            <span className={cn('pb-4 text-sm', done ? 'font-medium text-foreground' : 'text-muted')}>
              {step}
            </span>
          </div>
        )
      })}
    </div>
  )
}
