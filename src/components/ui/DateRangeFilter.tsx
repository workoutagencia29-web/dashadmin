import { useEffect, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { Calendar, ChevronDown } from 'lucide-react'
import {
  PRESET_LABELS,
  formatShort,
  type DateRange,
  type RangePreset,
} from '../../lib/date'
import { cn } from '../../lib/utils'

const PRESETS: RangePreset[] = ['today', 'yesterday', 'last7', 'last15', 'last30', 'thisMonth', 'all']

export function DateRangeFilter({
  preset,
  customRange,
  onChange,
}: {
  preset: RangePreset
  customRange: DateRange | null
  onChange: (preset: RangePreset, custom?: DateRange) => void
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

  const label =
    preset === 'custom' && customRange
      ? `${formatShort(customRange.from)} – ${formatShort(customRange.to)}`
      : PRESET_LABELS[preset]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-border bg-input/60 px-3.5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-input"
      >
        <Calendar className="h-4 w-4 text-muted" />
        <span>{label}</span>
        <ChevronDown className={cn('h-4 w-4 text-muted transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[280px] overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-xl shadow-black/20 animate-fade-in">
          <div className="space-y-0.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  onChange(p)
                  setOpen(false)
                }}
                className={cn(
                  'block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  preset === p
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted hover:bg-card-muted hover:text-foreground',
                )}
              >
                {PRESET_LABELS[p]}
              </button>
            ))}
          </div>

          <div className="mt-2 border-t border-border pt-2">
            <p className="px-3 pb-1 text-xs font-medium text-faint">{PRESET_LABELS.custom}</p>
            <DayPicker
              mode="range"
              selected={customRange ? { from: customRange.from, to: customRange.to } : undefined}
              onSelect={(r) => {
                if (r?.from && r?.to) onChange('custom', { from: r.from, to: r.to })
              }}
              locale={undefined}
            />
          </div>
        </div>
      )}
    </div>
  )
}
