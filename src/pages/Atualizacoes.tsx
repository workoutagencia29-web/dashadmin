import { Sparkles, ArrowUpCircle, Wrench, type LucideIcon } from 'lucide-react'
import { PageHeader, Badge, type BadgeTone } from '../components/ui'
import { formatShort } from '../lib/date'
import { changelog, type ChangelogType } from '../data/changelogData'

const TYPE_TONE: Record<ChangelogType, BadgeTone> = {
  Novidade: 'info',
  Melhoria: 'success',
  Correção: 'warning',
}

const TYPE_ICON: Record<ChangelogType, LucideIcon> = {
  Novidade: Sparkles,
  Melhoria: ArrowUpCircle,
  Correção: Wrench,
}

const TYPE_STYLE: Record<ChangelogType, string> = {
  Novidade: 'bg-primary/10 text-primary',
  Melhoria: 'bg-success/15 text-success',
  Correção: 'bg-warning/15 text-warning',
}

export default function Atualizacoes() {
  const releases = [...changelog].sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <>
      <PageHeader title="Atualizações" subtitle="Novidades e melhorias da plataforma" />

      <div className="space-y-6">
        <div className="relative">
          {/* Linha vertical conectando as versões */}
          <span className="absolute left-[19px] top-3 bottom-3 w-px bg-border" aria-hidden="true" />

          <ol className="space-y-5">
            {releases.map((r) => {
              const Icon = TYPE_ICON[r.tipo]
              return (
                <li key={r.version} className="relative pl-14">
                  {/* Marcador da timeline */}
                  <span
                    className={`absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full border border-border ${TYPE_STYLE[r.tipo]}`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>

                  <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold tracking-tight text-foreground">{r.version}</h3>
                      <Badge tone={TYPE_TONE[r.tipo]}>{r.tipo}</Badge>
                      <span className="ml-auto text-sm text-muted">{formatShort(r.date)}</span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-foreground">{r.titulo}</p>

                    <ul className="mt-4 space-y-2">
                      {r.itens.map((item, i) => (
                        <li key={i} className="flex gap-2.5 text-sm text-muted">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </>
  )
}
