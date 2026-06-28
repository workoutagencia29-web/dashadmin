import { useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useDialog } from '../../lib/useDialog'

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  const ref = useRef<HTMLDivElement>(null)
  useDialog(open, onClose, ref)

  if (!open) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' }
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        ref={ref}
        tabIndex={-1}
        className={cn(
          'relative z-10 max-h-[90vh] w-full overflow-y-auto scrollbar-thin rounded-2xl border border-border bg-card p-6 shadow-2xl animate-scale-in focus:outline-none',
          widths[size],
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-card-muted hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}
