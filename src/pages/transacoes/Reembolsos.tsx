import { useMemo, useState } from 'react'
import { Undo2, Banknote, Percent, Clock, Check, X } from 'lucide-react'
import {
  PageHeader,
  KpiCard,
  SectionCard,
  SearchInput,
  Select,
  DataTable,
  StatusBadge,
  MethodBadge,
  Badge,
  Avatar,
  Drawer,
  DetailRow,
  DrawerSection,
  Toolbar,
  ExportButtons,
  downloadCsv,
  Button,
  type Column,
} from '../../components/ui'
import { refunds, txSummary, type Refund } from '../../data/transacoesData'
import { formatCurrency, formatNumber, formatPercent } from '../../lib/utils'
import { formatDateTime } from '../../lib/date'
import { useToast } from '../../components/ui/Toast'

const STATUSES: Refund['status'][] = ['Solicitado', 'Em Processamento', 'Concluído', 'Rejeitado']
const PENDING: Refund['status'][] = ['Solicitado', 'Em Processamento']

export default function Reembolsos() {
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Todos')
  const [selected, setSelected] = useState<Refund | null>(null)

  const summary = useMemo(() => {
    const refunded = refunds.filter((r) => r.status === 'Concluído')
    const refundedValue = refunded.reduce((s, r) => s + r.amount, 0)
    return {
      count: refunds.length,
      refundedValue,
      rate: txSummary.aprovadas ? (refunds.length / txSummary.aprovadas) * 100 : 0,
      avgDays: 2,
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return refunds.filter((r) => {
      if (q && !`${r.id} ${r.txId} ${r.customer} ${r.sellerName} ${r.reason}`.toLowerCase().includes(q)) return false
      if (status !== 'Todos' && r.status !== status) return false
      return true
    })
  }, [query, status])

  const columns: Column<Refund>[] = [
    {
      header: 'Reembolso',
      cell: (r) => (
        <div>
          <p className="font-medium text-foreground">{r.id}</p>
          <p className="text-xs text-muted">{r.txId}</p>
        </div>
      ),
      nowrap: true,
    },
    {
      header: 'Cliente',
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={r.customer} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{r.customer}</p>
            <p className="truncate text-xs text-muted">{r.sellerName}</p>
          </div>
        </div>
      ),
    },
    { header: 'Método', cell: (r) => <MethodBadge method={r.method} />, nowrap: true },
    {
      header: 'Tipo',
      cell: (r) => <Badge tone={r.type === 'Total' ? 'neutral' : 'info'}>{r.type}</Badge>,
      nowrap: true,
    },
    { header: 'Motivo', cell: (r) => <span className="text-muted">{r.reason}</span> },
    { header: 'Data', cell: (r) => <span className="text-muted">{formatDateTime(r.date)}</span>, nowrap: true },
    {
      header: 'Valor',
      align: 'right',
      cell: (r) => <span className="font-semibold text-foreground">{formatCurrency(r.amount)}</span>,
      nowrap: true,
    },
    { header: 'Status', cell: (r) => <StatusBadge status={r.status} />, nowrap: true },
  ]

  function exportCsv() {
    downloadCsv(
      'reembolsos.csv',
      ['ID', 'Transação', 'Cliente', 'Seller', 'Método', 'Tipo', 'Motivo', 'Data', 'Valor', 'Status'],
      filtered.map((r) => [
        r.id,
        r.txId,
        r.customer,
        r.sellerName,
        r.method,
        r.type,
        r.reason,
        formatDateTime(r.date),
        r.amount,
        r.status,
      ]),
    )
  }

  return (
    <>
      <PageHeader
        title="Reembolsos"
        subtitle="Estornos solicitados e processados pelo gateway"
        actions={<ExportButtons formats={['CSV', 'PDF']} onCsv={exportCsv} />}
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Reembolsos no mês" value={formatNumber(summary.count)} icon={Undo2} />
          <KpiCard label="Valor reembolsado" value={formatCurrency(summary.refundedValue)} icon={Banknote} />
          <KpiCard label="Taxa de reembolso" value={formatPercent(summary.rate)} icon={Percent} invertDelta hint="Sobre aprovadas" />
          <KpiCard label="Tempo médio" value={`${summary.avgDays} dias`} icon={Clock} />
        </div>

        <SectionCard bodyClassName="space-y-5">
          <Toolbar
            left={
              <>
                <SearchInput value={query} onChange={setQuery} placeholder="ID, transação, cliente, seller…" />
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

          <DataTable
            columns={columns}
            rows={filtered}
            keyField={(r) => r.id}
            onRowClick={setSelected}
            pageSize={10}
            minWidth={980}
            emptyLabel="Nenhum reembolso para os filtros."
          />
        </SectionCard>
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.id ?? ''}
        subtitle={selected ? `${selected.customer} · ${formatDateTime(selected.date)}` : ''}
        footer={
          selected &&
          PENDING.includes(selected.status) && (
            <div className="flex gap-2">
              <Button
                variant="success"
                size="sm"
                className="flex-1"
                onClick={() => {
                  toast('Reembolso aprovado')
                  setSelected(null)
                }}
              >
                <Check className="h-4 w-4" /> Aprovar reembolso
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="flex-1"
                onClick={() => {
                  toast('Reembolso rejeitado', 'error')
                  setSelected(null)
                }}
              >
                <X className="h-4 w-4" /> Rejeitar
              </Button>
            </div>
          )
        }
      >
        {selected && (
          <>
            <div className="mb-6 flex items-center justify-between rounded-2xl border border-border bg-card-muted/40 p-4">
              <div>
                <p className="text-xs text-muted">Valor do reembolso</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(selected.amount)}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <DrawerSection title="Reembolso">
              <DetailRow label="Tipo" value={<Badge tone={selected.type === 'Total' ? 'neutral' : 'info'}>{selected.type}</Badge>} />
              <DetailRow label="Motivo" value={selected.reason} />
              <DetailRow label="Método" value={selected.method} />
              <DetailRow label="Transação" value={selected.txId} />
              <DetailRow label="Solicitado em" value={formatDateTime(selected.date)} />
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
