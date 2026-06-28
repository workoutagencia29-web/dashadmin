import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { cn } from '../../lib/utils'

/* ------------------------------- Card -------------------------------- */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card', className)}>{children}</div>
  )
}

/** Card com título (barrinha azul) + descrição + ação opcional. */
export function SectionCard({
  id,
  title,
  description,
  action,
  className,
  bodyClassName,
  children,
}: {
  id?: string
  title?: string
  description?: string
  action?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className={cn('scroll-mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6', className)}
    >
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && (
              <h3 className="flex items-center gap-2.5 text-lg font-bold text-foreground">
                <span className="h-5 w-1.5 shrink-0 rounded-full bg-primary" />
                {title}
              </h3>
            )}
            {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}

/** Bloco interno (subseção dentro de um card). */
export function SubBlock({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="border-t border-border pt-6 first:border-t-0 first:pt-0">
      {title && <h4 className="mb-4 text-sm font-semibold text-foreground">{title}</h4>}
      {children}
    </div>
  )
}

/* ------------------------------ Fields ------------------------------- */

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label?: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <label className="block text-sm font-medium text-foreground">{label}</label>}
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}

const inputBase =
  'w-full rounded-xl border border-border bg-input/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-faint transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputBase, 'min-h-[88px] resize-y', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(inputBase, 'cursor-pointer appearance-none pr-9', className)} {...props}>
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
}

/* ------------------------------ Button ------------------------------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md'
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:opacity-90 shadow-glow/0',
    outline: 'border border-border bg-transparent text-foreground hover:bg-card-muted',
    ghost: 'text-muted hover:bg-card-muted hover:text-foreground',
    danger: 'bg-danger/10 text-danger hover:bg-danger/20',
    success: 'bg-success/15 text-success hover:bg-success/25',
  }
  const sizes = { sm: 'px-3 py-1.5 text-[13px]', md: 'px-4 py-2.5 text-sm' }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50',
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/** Botão-ícone quadrado (ações em linhas de tabela, toolbars). */
export function IconButton({
  className,
  children,
  label,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label?: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'rounded-lg p-1.5 text-muted transition-colors hover:bg-card-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/* ------------------------------ Switch ------------------------------- */

export function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        checked ? 'bg-primary' : 'bg-card-muted',
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

/** Linha com label/descrição à esquerda e um switch à direita. */
export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  icon,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
  icon?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-start gap-3">
        {icon && <span className="mt-0.5 text-muted">{icon}</span>}
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  )
}

/* ------------------------------- Badge ------------------------------- */

export const badgeStyles = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/10 text-danger',
  neutral: 'bg-card-muted text-muted',
  info: 'bg-primary/10 text-primary',
  violet: 'bg-chart-violet/15 text-chart-violet',
}

export type BadgeTone = keyof typeof badgeStyles

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        badgeStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ------------------------------ Progress ----------------------------- */

export function ProgressBar({
  value,
  tone = 'primary',
  className,
}: {
  value: number // 0..100
  tone?: 'primary' | 'success' | 'warning' | 'danger'
  className?: string
}) {
  const tones = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  }
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-card-muted', className)}>
      <div
        className={cn('h-full rounded-full transition-all', tones[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

/* ------------------------------ Masks -------------------------------- */

const digits = (v: string) => v.replace(/\D/g, '')

export const maskCNPJ = (v: string) =>
  digits(v)
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')

export const maskCPF = (v: string) =>
  digits(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1-$2')

export const maskPhone = (v: string) =>
  digits(v)
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')

export const maskCEP = (v: string) => digits(v).slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
