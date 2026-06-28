import { useMemo, useState } from 'react'
import { Wallet, ListChecks, CheckCircle2, Timer, Check, X, Copy } from 'lucide-react'
import {
  PageHeader,
  KpiCard,
  SectionCard,
  SearchInput,
  Select,
  DataTable,
  StatusBadge,
  RiskBadge,
  Avatar,
  Drawer,
  DetailRow,
  DrawerSection,
  Timeline,
  Toolbar,
  Button,
  StateTabs,
  type Column,
} from '../../components/ui'
import { saques as initialSaques, type Saque, type SaqueStatus } from '../../data/financeiroData'
import { formatCurrency, formatNumber } from '../../lib/utils'
import { formatDateTime, timeAgo } from '../../lib/date'
import { useToast } from '../../components/ui/Toast'

const STATUSES: SaqueStatus[] = ['Solicitado', 'Em Processamento', 'Concluído', 'Rejeitado']

function statusStep(s: SaqueStatus): number {
  const map: Record<SaqueStatus, number> = {
    Solicitado: 0,
    'Em Processamento': 1,
    Concluído: 2,
    Rejeitado: 1,
  }
  return map[s]
}

export default function Saques() {
  const { toast } = useToast()
  const [list, setList] = useState<Saque[]>(initialSaques)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Todos')
  const [tab, setTab] = useState('Todos')
  const [selected, setSelected] = useState<Saque | null>(null)

  const tabs = useMemo(() => {
    const counts = (s: SaqueStatus) => list.filter((x) => x.status === s).length
    return [
      { label: 'Todos', count: list.length },
      { label: 'Solicitado', count: counts('Solicitado') },
      { label: 'Em Processamento', count: counts('Em Processamento') },
      { label: 'Concluído', count: counts('Concluído') },
      { label: 'Rejeitado', count: counts('Rejeitado') },
    ]
  }, [list])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return list.filter((s) => {
      if (tab !== 'Todos' && s.status !== tab) return false
      if (status !== 'Todos' && s.status !== status) return false
      if (q && !`${s.sellerName} ${s.pixKey} ${s.id}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [list, query, status, tab])

  const pendingValue = list
    .filter((s) => s.status === 'Solicitado')
    .reduce((sum, s) => sum + s.amount, 0)
  const queueCount = list.filter((s) => s.status === 'Solicitado').length
  const approvedToday = list.filter((s) => s.status === 'Concluído').length

  function updateStatus(id: string, next: SaqueStatus, message: string) {
    setList((prev) => prev.map((s) => (s.id === id ? { ...s, status: next } : s)))
    setSelected((cur) => (cur && cur.id === id ? { ...cur, status: next } : cur))
    toast(message, next === 'Rejeitado' ? 'error' : 'success')
  }

  function approve(s: Saque) {
    updateStatus(s.id, 'Em Processamento', `Saque de ${s.sellerName} aprovado`)
  }

  function reject(s: Saque) {
    updateStatus(s.id, 'Rejeitado', `Saque de ${s.sellerName} rejeitado`)
  }

  const columns: Column<Saque>[] = [
    {
      header: 'Seller',
      cell: (s) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={s.sellerName} size="sm" />
          <span className="truncate font-medium text-foreground">{s.sellerName}</span>
        </div>
      ),
    },
    {
      header: 'Chave Pix',
      cell: (s) => <span className="text-muted">{s.pixKey}</span>,
      nowrap: true,
    },
    {
      header: 'Valor',
      align: 'right',
      cell: (s) => <span className="font-semibold text-foreground">{formatCurrency(s.amount)}</span>,
      nowrap: true,
    },
    {
      header: 'Solicitado',
      cell: (s) => <span className="text-muted">{timeAgo(s.requestedAt)}</span>,
      nowrap: true,
    },
    { header: 'Risco', cell: (s) => <RiskBadge level={s.risk} />, nowrap: true },
    { header: 'Status', cell: (s) => <StatusBadge status={s.status} />, nowrap: true },
    {
      header: 'Ações',
      align: 'right',
      cell: (s) =>
        s.status === 'Solicitado' ? (
          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <Button variant="success" size="sm" onClick={() => approve(s)}>
              <Check className="h-4 w-4" /> Aprovar
            </Button>
            <Button variant="danger" size="sm" onClick={() => reject(s)}>
              <X className="h-4 w-4" /> Rejeitar
            </Button>
          </div>
        ) : (
          <span className="text-xs text-faint">—</span>
        ),
      nowrap: true,
    },
  ]

  return (
    <>
      <PageHeader title="Saques" subtitle="Fila de aprovação de saques dos sellers" />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Saques pendentes" value={formatCurrency(pendingValue)} icon={Wallet} hint="Valor aguardando aprovação" />
          <KpiCard label="Qtd na fila" value={formatNumber(queueCount)} icon={ListChecks} hint="Solicitações abertas" />
          <KpiCard label="Aprovados hoje" value={formatNumber(approvedToday)} icon={CheckCircle2} />
          <KpiCard label="Tempo médio" value="2h 14min" icon={Timer} hint="Da solicitação à liquidação" />
        </div>

        <SectionCard>
          <StateTabs tabs={tabs} active={tab} onChange={setTab} />

          <div className="mt-5">
            <Toolbar
              left={
                <>
                  <SearchInput value={query} onChange={setQuery} placeholder="Seller, chave Pix, ID…" />
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
                keyField={(s) => s.id}
                onRowClick={setSelected}
                pageSize={10}
                minWidth={960}
                emptyLabel="Nenhum saque para os filtros."
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Drawer de detalhe */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.id ?? ''}
        subtitle={selected ? `${selected.sellerName} · ${formatDateTime(selected.requestedAt)}` : ''}
        footer={
          selected &&
          selected.status === 'Solicitado' && (
            <div className="flex gap-2">
              <Button variant="danger" size="sm" className="flex-1" onClick={() => reject(selected)}>
                <X className="h-4 w-4" /> Rejeitar
              </Button>
              <Button variant="success" size="sm" className="flex-1" onClick={() => approve(selected)}>
                <Check className="h-4 w-4" /> Aprovar saque
              </Button>
            </div>
          )
        }
      >
        {selected && (
          <>
            <div className="mb-6 flex items-center justify-between rounded-2xl border border-border bg-card-muted/40 p-4">
              <div>
                <p className="text-xs text-muted">Valor solicitado</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(selected.amount)}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <DrawerSection title="Status">
              <Timeline
                steps={['Solicitado', 'Em processamento', selected.status === 'Rejeitado' ? 'Rejeitado' : 'Concluído']}
                current={statusStep(selected.status)}
              />
            </DrawerSection>

            <DrawerSection title="Destino">
              <DetailRow
                label="Chave Pix"
                value={
                  <button
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                    onClick={() => {
                      navigator.clipboard?.writeText(selected.pixKey)
                      toast('Chave Pix copiada')
                    }}
                  >
                    {selected.pixKey} <Copy className="h-3 w-3" />
                  </button>
                }
              />
              <DetailRow label="Seller" value={selected.sellerName} />
              <DetailRow label="Risco" value={<RiskBadge level={selected.risk} />} />
            </DrawerSection>

            <DrawerSection title="Solicitação">
              <DetailRow label="ID do saque" value={selected.id} />
              <DetailRow label="Solicitado em" value={formatDateTime(selected.requestedAt)} />
              <DetailRow label="Há" value={timeAgo(selected.requestedAt)} />
            </DrawerSection>
          </>
        )}
      </Drawer>
    </>
  )
}
