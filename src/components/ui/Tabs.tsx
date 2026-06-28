import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'

/** Tabs segmentadas (pill) — controladas por estado. */
export function SegmentTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[]
  active: string
  onChange: (t: string) => void
}) {
  return (
    <div className="inline-flex gap-1 rounded-xl bg-card-muted/60 p-1">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            active === t ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground',
          )}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

/** Tabs com sublinhado — navegáveis por rota (NavLink). */
export function UnderlineTabs({ tabs }: { tabs: { label: string; path: string; end?: boolean }[] }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border no-scrollbar">
      {tabs.map((t) => (
        <NavLink
          key={t.path}
          to={t.path}
          end={t.end}
          className={({ isActive }) =>
            cn(
              'relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted hover:text-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              {t.label}
              {isActive && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
            </>
          )}
        </NavLink>
      ))}
    </div>
  )
}

/** Tabs sublinhadas controladas por estado (sem rota). */
export function StateTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { label: string; count?: number }[]
  active: string
  onChange: (t: string) => void
  children?: ReactNode
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border no-scrollbar">
      {tabs.map((t) => {
        const isActive = active === t.label
        return (
          <button
            key={t.label}
            onClick={() => onChange(t.label)}
            className={cn(
              'relative flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted hover:text-foreground',
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  isActive ? 'bg-primary/15 text-primary' : 'bg-card-muted text-muted',
                )}
              >
                {t.count}
              </span>
            )}
            {isActive && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        )
      })}
    </div>
  )
}
