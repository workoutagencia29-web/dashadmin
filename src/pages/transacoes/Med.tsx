import { useMemo, useState } from 'react'
import { ShieldAlert, Banknote, Trophy, Clock, ShieldCheck, Send } from 'lucide-react'
import {
  PageHeader,
  KpiCard,
  SectionCard,
  SearchInput,
  MultiSelect,
  StateTabs,
  DataTable,
  StatusBadge,
  Badge,
  Avatar,
  Drawer,
  DetailRow,
  DrawerSection,
  Timeline,
  Toolbar,
  Button,
  type Column,
} from '../../components/ui'
import { BarsChart } from '../../components/charts/Charts'
import { disputes, type Dispute, type DisputeStatus } from '../../data/transacoesData'
import { formatCurrency, formatNumber, formatPercent } from '../../lib/utils'
import { formatDateTime } from '../../lib/date'
import { useToast } from '../../components/ui/Toast'

const STATUSES: DisputeStatus[] = ['Aberta', 'Em Análise', 'Defesa Enviada', 'Ganha', 'Perdida', 'Acatada']
const DISPUTE_TYPES = ['MED (Pix)', 'Chargeback (Cartão)']
const OPEN_STATUSES: DisputeStatus[] = ['Aberta', 'Em Análise', 'Defesa Enviada']

/** Quão perto do prazo a disputa está (dias restantes a partir de hoje). */
function daysLeft(deadline: Date): number {
  return Math.ceil((deadline.getTime() - Date.now()) / 86400000)
}

function disputeStep(s: DisputeStatus): number {
  const map: Record<DisputeStatus, number> = {
    Aberta: 0,
    'Em Análise': 0,
    'Defesa Enviada': 1,
    Ganha: 2,
    Perdida: 2,
    Acatada: 2,
  }
  return map[s]
}

export default function Med() {
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [types, setTypes] = useState<string[]>([])
  const [tab, setTab] = useState<string>('Todas')
  const [selected, setSelected] = useState<Dispute | null>(null)

  const summary = useMemo(() => {
    const open = disputes.filter((d) => OPEN_STATUSES.includes(d.status))
    const decided = disputes.filter((d) => d.status === 'Ganha' || d.status === 'Perdida')
    const won = disputes.filter((d) => d.status === 'Ganha').length
    const inDispute = open.reduce((s, d) => s + d.amount, 0)
    const avgResponse = Math.round(
      disputes.reduce((s, d) => s + Math.max(1, Math.round((d.deadline.getTime() - d.openedAt.getTime()) / 86400000)), 0) /
        disputes.length,
    )
    return {
      open: open.length,
      inDispute,
      winRate: decided.length ? (won / decided.length) * 100 : 0,
      avgResponse,
    }
  }, [])

  const tabs = useMemo(() => {
    const counts: { label: string; count?: number }[] = [{ label: 'Todas', count: disputes.length }]
    for (const s of STATUSES) counts.push({ label: s, count: disputes.filter((d) => d.status === s).length })
    return counts
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return disputes.filter((d) => {
      if (q && !`${d.id} ${d.txId} ${d.customer} ${d.sellerName} ${d.reason}`.toLowerCase().includes(q)) return false
      if (types.length && !types.includes(d.type)) return false
      if (tab !== 'Todas' && d.status !== tab) return false
      return true
    })
  }, [query, types, tab])

  const byReason = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of disputes) map.set(d.reason, (map.get(d.reason) ?? 0) + 1)
    return [...map.entries()]
      .map(([label, value]) => ({ label, Disputas: value }))
      .sort((a, b) => b.Disputas - a.Disputas)
  }, [])

  const columns: Column<Dispute>[] = [
    {
      header: 'Disputa',
      cell: (d) => (
        <div>
          <p className="font-medium text-foreground">{d.id}</p>
          <p className="text-xs text-muted">{d.txId}</p>
        </div>
      ),
      nowrap: true,
    },
    {
      header: 'Cliente',
      cell: (d) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={d.customer} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{d.customer}</p>
            <p className="truncate text-xs text-muted">{d.sellerName}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Tipo',
      cell: (d) => <Badge tone={d.type === 'MED (Pix)' ? 'info' : 'violet'}>{d.type}</Badge>,
      nowrap: true,
    },
    { header: 'Motivo', cell: (d) => <span className="text-muted">{d.reason}</span> },
    {
      header: 'Valor',
      align: 'right',
      cell: (d) => <span className="font-semibold text-foreground">{formatCurrency(d.amount)}</span>,
      nowrap: true,
    },
    {
      header: 'Prazo',
      cell: (d) => {
        const dl = daysLeft(d.deadline)
        const open = OPEN_STATUSES.includes(d.status)
        const tone = !open ? 'text-muted' : dl <= 0 ? 'text-danger' : dl <= 3 ? 'text-warning' : 'text-muted'
        const label = !open ? '—' : dl <= 0 ? 'Vencido' : `${dl} ${dl === 1 ? 'dia' : 'dias'}`
        return (
          <div className={tone}>
            <p className="font-medium">{label}</p>
            <p className="text-xs text-faint">{formatDateTime(d.deadline)}</p>
          </div>
        )
      },
      nowrap: true,
    },
    { header: 'Status', cell: (d) => <StatusBadge status={d.status} />, nowrap: true },
  ]

  return (
    <>
      <PageHeader title="MED & Chargebacks" subtitle="Disputas de Pix (MED) e cartão sob defesa" />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Disputas abertas" value={formatNumber(summary.open)} icon={ShieldAlert} hint="Aguardando ação" />
          <KpiCard label="Valor em disputa" value={formatCurrency(summary.inDispute)} icon={Banknote} />
          <KpiCard label="Taxa de vitória" value={formatPercent(summary.winRate)} icon={Trophy} hint="Ganhas / decididas" />
          <KpiCard label="Prazo médio de resposta" value={`${summary.avgResponse} dias`} icon={Clock} />
        </div>

        <SectionCard bodyClassName="space-y-5">
          <StateTabs tabs={tabs} active={tab} onChange={setTab} />

          <Toolbar
            left={
              <>
                <SearchInput value={query} onChange={setQuery} placeholder="ID, transação, cliente, seller…" />
                <MultiSelect label="Tipo" options={DISPUTE_TYPES} selected={types} onChange={setTypes} />
              </>
            }
            right={<span className="text-sm text-muted">{filtered.length} resultados</span>}
          />

          <DataTable
            columns={columns}
            rows={filtered}
            keyField={(d) => d.id}
            onRowClick={setSelected}
            pageSize={10}
            minWidth={920}
            emptyLabel="Nenhuma disputa para os filtros."
          />
        </SectionCard>

        <SectionCard title="Disputas por motivo" description="Distribuição das contestações abertas">
          <BarsChart
            data={byReason}
            height={280}
            series={[{ key: 'Disputas', name: 'Disputas', color: '#f43f5e' }]}
            valueFormatter={(v) => formatNumber(v)}
          />
        </SectionCard>
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.id ?? ''}
        subtitle={selected ? `${selected.type} · ${selected.txId}` : ''}
        footer={
          selected &&
          OPEN_STATUSES.includes(selected.status) && (
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  toast('Defesa enviada à adquirente')
                  setSelected(null)
                }}
              >
                <Send className="h-4 w-4" /> Enviar defesa
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="flex-1"
                onClick={() => {
                  toast('Disputa acatada — valor devolvido', 'info')
                  setSelected(null)
                }}
              >
                <ShieldCheck className="h-4 w-4" /> Acatar
              </Button>
            </div>
          )
        }
      >
        {selected && (
          <>
            <div className="mb-6 flex items-center justify-between rounded-2xl border border-border bg-card-muted/40 p-4">
              <div>
                <p className="text-xs text-muted">Valor contestado</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(selected.amount)}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <DrawerSection title="Andamento">
              <Timeline steps={['Aberta', 'Defesa', 'Decisão']} current={disputeStep(selected.status)} />
            </DrawerSection>

            <DrawerSection title="Disputa">
              <DetailRow label="Tipo" value={selected.type} />
              <DetailRow label="Motivo" value={selected.reason} />
              <DetailRow label="Método" value={selected.method} />
              <DetailRow label="Transação" value={selected.txId} />
              <DetailRow label="Aberta em" value={formatDateTime(selected.openedAt)} />
              <DetailRow
                label="Prazo de defesa"
                value={(() => {
                  const dl = daysLeft(selected.deadline)
                  const open = OPEN_STATUSES.includes(selected.status)
                  const tone = !open ? 'text-foreground' : dl <= 0 ? 'text-danger' : dl <= 3 ? 'text-warning' : 'text-foreground'
                  return <span className={tone}>{formatDateTime(selected.deadline)}</span>
                })()}
              />
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
