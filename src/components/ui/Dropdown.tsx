import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

export interface DropdownItem {
  label: string
  icon?: ReactNode
  onClick?: () => void
  tone?: 'default' | 'danger'
}

/** Menu de contexto/ações (kebab). `trigger` é o botão; `items` o menu. */
export function Dropdown({
  trigger,
  items,
  align = 'right',
}: {
  trigger: ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <span onClick={() => setOpen((o) => !o)}>{trigger}</span>
      {open && (
        <div
          className={cn(
            'absolute z-40 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-xl shadow-black/20 animate-fade-in',
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
          )}
        >
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => {
                it.onClick?.()
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-card-muted',
                it.tone === 'danger' ? 'text-danger hover:bg-danger/10' : 'text-foreground',
              )}
            >
              {it.icon && <span className="shrink-0">{it.icon}</span>}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
