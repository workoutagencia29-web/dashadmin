import { useMemo, useState } from 'react'
import { ShieldAlert, Ban, ShieldCheck, Gauge, ShieldX } from 'lucide-react'
import {
  PageHeader,
  KpiCard,
  SectionCard,
  SearchInput,
  Select,
  Toolbar,
  DataTable,
  StatusBadge,
  MethodBadge,
  Badge,
  ProgressBar,
  Avatar,
  Switch,
  Drawer,
  DetailRow,
  DrawerSection,
  Button,
  type Column,
  type BadgeTone,
} from '../../components/ui'
import { BarsChart } from '../../components/charts/Charts'
import {
  fraudKpis,
  flaggedTx,
  fraudRules,
  blocksByReason,
  type FlaggedTx,
  type FlaggedStatus,
  type RuleAction,
  type FraudKpi,
} from '../../data/riscoData'
import { formatCurrency, formatNumber } from '../../lib/utils'
import { formatDateTime } from '../../lib/date'
import { useToast } from '../../components/ui/Toast'

const KPI_ICONS: Record<string, typeof ShieldAlert> = {
  alertas: ShieldAlert,
  bloqueadas: Ban,
  evitado: ShieldCheck,
  score: Gauge,
}

function kpiValue(k: FraudKpi): string {
  switch (k.format) {
    case 'currencyCompact':
      return formatCurrency(k.value)
    case 'score':
      return `${k.value}/100`
    default:
      return formatNumber(k.value)
  }
}

const ACTION_TONE: Record<RuleAction, BadgeTone> = {
  Bloquear: 'danger',
  Revisar: 'warning',
  'Score+': 'violet',
}

const STATUSES: FlaggedStatus[] = ['Em Análise', 'Bloqueado', 'Liberado']

function scoreTone(score: number): 'success' | 'warning' | 'danger' {
  if (score < 40) return 'success'
  if (score < 70) return 'warning'
  return 'danger'
}

export default function Antifraude() {
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Todos')
  const [selected, setSelected] = useState<FlaggedTx | null>(null)
  const [rules, setRules] = useState(() => fraudRules.map((r) => ({ id: r.id, ativo: r.ativo })))

  function toggleRule(id: string, value: boolean) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ativo: value } : r)))
    const rule = fraudRules.find((r) => r.id === id)
    toast(`Regra "${rule?.nome}" ${value ? 'ativada' : 'desativada'}`, value ? 'success' : 'info')
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return flaggedTx.filter((t) => {
      if (q && !`${t.customer} ${t.sellerName} ${t.id} ${t.reason}`.toLowerCase().includes(q)) return false
      if (status !== 'Todos' && t.status !== status) return false
      return true
    })
  }, [query, status])

  const columns: Column<FlaggedTx>[] = [
    {
      header: 'Transação',
      cell: (t) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={t.customer} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{t.customer}</p>
            <p className="truncate text-xs text-muted">{t.id}</p>
          </div>
        </div>
      ),
    },
    { header: 'Seller', cell: (t) => <span className="text-muted">{t.sellerName}</span>, nowrap: true },
    {
      header: 'Valor',
      align: 'right',
      cell: (t) => (
        <div>
          <p className="font-semibold text-foreground">{formatCurrency(t.amount)}</p>
          <p className="text-xs text-muted">{formatDateTime(t.date)}</p>
        </div>
      ),
      nowrap: true,
    },
    {
      header: 'Motivo',
      cell: (t) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">{t.reason}</span>
          <MethodBadge method={t.method} />
        </div>
      ),
    },
    {
      header: 'Score',
      cell: (t) => (
        <div className="w-28">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted">risco</span>
            <span className="font-semibold text-foreground">{t.score}</span>
          </div>
          <ProgressBar value={t.score} tone={scoreTone(t.score)} />
        </div>
      ),
      nowrap: true,
    },
    { header: 'Status', cell: (t) => <StatusBadge status={t.status} />, nowrap: true },
  ]

  return (
    <>
      <PageHeader
        title="Antifraude"
        subtitle="Monitoramento de risco e regras de bloqueio em tempo real"
      />

      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {fraudKpis.map((k) => (
            <KpiCard
              key={k.id}
              label={k.label}
              value={kpiValue(k)}
              delta={k.delta}
              invertDelta={k.invert}
              icon={KPI_ICONS[k.id] ?? ShieldAlert}
              hint={k.hint}
            />
          ))}
        </div>

        {/* Regras + bloqueios por motivo */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <SectionCard title="Regras ativas" description="Motores de decisão antifraude">
            <div className="divide-y divide-border">
              {fraudRules.map((rule) => {
                const ativo = rules.find((r) => r.id === rule.id)?.ativo ?? rule.ativo
                return (
                  <div key={rule.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{rule.nome}</p>
                        <Badge tone={ACTION_TONE[rule.acao]}>{rule.acao}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">{rule.descricao}</p>
                      <p className="mt-1 text-[11px] text-faint">
                        {formatNumber(rule.disparos30d)} disparos · 30 dias
                      </p>
                    </div>
                    <Switch checked={ativo} onChange={(v) => toggleRule(rule.id, v)} />
                  </div>
                )
              })}
            </div>
          </SectionCard>

          <SectionCard title="Bloqueios por motivo" description="Distribuição dos últimos 30 dias">
            <BarsChart
              data={blocksByReason.map((b) => ({ label: b.label, Bloqueios: b.value }))}
              series={[{ key: 'Bloqueios', name: 'Bloqueios', color: '#f43f5e' }]}
              height={300}
              valueFormatter={(v) => formatNumber(v)}
            />
          </SectionCard>
        </div>

        {/* Transações sinalizadas */}
        <SectionCard title="Transações sinalizadas" description="Avaliações que pedem decisão manual">
          <Toolbar
            left={
              <>
                <SearchInput value={query} onChange={setQuery} placeholder="Cliente, seller, ID, motivo…" />
                <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
                  <option value="Todos">Todos os status</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </>
            }
            right={<span className="text-sm text-muted">{filtered.length} resultados</span>}
          />

          <div className="mt-5">
            <DataTable
              columns={columns}
              rows={filtered}
              keyField={(t) => t.id}
              onRowClick={setSelected}
              pageSize={10}
              minWidth={920}
              emptyLabel="Nenhuma transação sinalizada para os filtros."
              emptyIcon={<ShieldCheck className="h-8 w-8" />}
            />
          </div>
        </SectionCard>
      </div>

      {/* Drawer de detalhe */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.id ?? ''}
        subtitle={selected ? `${selected.customer} · ${formatDateTime(selected.date)}` : ''}
        footer={
          selected && (
            <div className="flex gap-2">
              <Button
                variant="success"
                size="sm"
                className="flex-1"
                onClick={() => {
                  toast(`Transação ${selected.id} liberada`, 'success')
                  setSelected(null)
                }}
              >
                <ShieldCheck className="h-4 w-4" /> Liberar
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="flex-1"
                onClick={() => {
                  toast(`Transação ${selected.id} bloqueada`, 'error')
                  setSelected(null)
                }}
              >
                <ShieldX className="h-4 w-4" /> Bloquear
              </Button>
            </div>
          )
        }
      >
        {selected && (
          <>
            <div className="mb-6 flex items-center justify-between rounded-2xl border border-border bg-card-muted/40 p-4">
              <div>
                <p className="text-xs text-muted">Valor bruto</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(selected.amount)}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <DrawerSection title="Avaliação de risco">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-muted">Score de risco</span>
                <span className="font-semibold text-foreground">{selected.score}/100</span>
              </div>
              <ProgressBar value={selected.score} tone={scoreTone(selected.score)} />
              <p className="mt-3 text-sm text-foreground">
                Motivo: <span className="font-semibold">{selected.reason}</span>
              </p>
            </DrawerSection>

            <DrawerSection title="Pagamento">
              <DetailRow label="Método" value={selected.method} />
              <DetailRow label="Valor" value={formatCurrency(selected.amount)} />
              <DetailRow label="Data" value={formatDateTime(selected.date)} />
            </DrawerSection>

            <DrawerSection title="Cliente & Seller">
              <DetailRow label="Cliente" value={selected.customer} />
              <DetailRow label="Seller" value={selected.sellerName} />
            </DrawerSection>
          </>
        )}
      </Drawer>
    </>
  )
}
