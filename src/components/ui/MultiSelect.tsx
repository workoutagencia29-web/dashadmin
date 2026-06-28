import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '../../lib/utils'

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
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

  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt])
  }

  const summary =
    selected.length === 0 ? label : selected.length === 1 ? selected[0] : `${label}: ${selected.length}`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors',
          selected.length
            ? 'border-primary/50 bg-primary/5 text-foreground'
            : 'border-border bg-input/60 text-foreground hover:bg-input',
        )}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute left-0 z-30 mt-2 w-56 origin-top overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-xl shadow-black/20 animate-fade-in">
          {options.map((opt) => {
            const on = selected.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-card-muted"
              >
                {opt}
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded border',
                    on ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                  )}
                >
                  {on && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
              </button>
            )
          })}
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="mt-1 w-full rounded-lg px-3 py-1.5 text-left text-xs text-muted hover:bg-card-muted hover:text-foreground"
            >
              Limpar
            </button>
          )}
        </div>
      )}
    </div>
  )
}
