import { useMemo, useState } from 'react'
import { Users, UserCheck, Receipt, Repeat, Copy, ShieldAlert } from 'lucide-react'
import {
  PageHeader,
  KpiCard,
  SectionCard,
  SearchInput,
  MultiSelect,
  Select,
  DataTable,
  StatusBadge,
  RiskBadge,
  MethodBadge,
  Avatar,
  Drawer,
  DetailRow,
  DrawerSection,
  Toolbar,
  ExportButtons,
  downloadCsv,
  type Column,
} from '../components/ui'
import { customers, clientesSummary, type Customer } from '../data/clientesData'
import { PAYMENT_METHODS } from '../data/shared'
import { formatCurrency, formatNumber } from '../lib/utils'
import { formatShort } from '../lib/date'
import { useToast } from '../components/ui/Toast'

const STATUSES = ['Ativo', 'Inativo'] as const

export default function Clientes() {
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [methods, setMethods] = useState<string[]>([])
  const [status, setStatus] = useState('Todos')
  const [selected, setSelected] = useState<Customer | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return customers.filter((c) => {
      if (q && !`${c.name} ${c.email} ${c.document} ${c.id}`.toLowerCase().includes(q)) return false
      if (methods.length && !methods.includes(c.metodoPreferido)) return false
      if (status !== 'Todos' && c.status !== status) return false
      return true
    })
  }, [query, methods, status])

  const columns: Column<Customer>[] = [
    {
      header: 'Cliente',
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={c.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{c.name}</p>
            <p className="truncate text-xs text-muted">{c.email}</p>
          </div>
        </div>
      ),
    },
    { header: 'Documento', cell: (c) => <span className="text-muted">{c.document}</span>, nowrap: true },
    { header: 'Compras', align: 'right', cell: (c) => formatNumber(c.compras), nowrap: true },
    {
      header: 'Total gasto',
      align: 'right',
      cell: (c) => <span className="font-semibold text-foreground">{formatCurrency(c.totalGasto)}</span>,
      nowrap: true,
    },
    { header: 'Método preferido', cell: (c) => <MethodBadge method={c.metodoPreferido} />, nowrap: true },
    {
      header: 'Última compra',
      cell: (c) => <span className="text-muted">{formatShort(c.ultimaCompra)}</span>,
      nowrap: true,
    },
    { header: 'Risco', cell: (c) => <RiskBadge level={c.risco} />, nowrap: true },
    { header: 'Status', cell: (c) => <StatusBadge status={c.status} />, nowrap: true },
  ]

  function exportCsv() {
    downloadCsv(
      'clientes.csv',
      ['ID', 'Nome', 'E-mail', 'Documento', 'Compras', 'Total gasto', 'Método preferido', 'Última compra', 'Risco', 'Status', 'Chargebacks'],
      filtered.map((c) => [
        c.id,
        c.name,
        c.email,
        c.document,
        c.compras,
        c.totalGasto,
        c.metodoPreferido,
        formatShort(c.ultimaCompra),
        c.risco,
        c.status,
        c.chargebacks,
      ]),
    )
  }

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Compradores finais que pagaram pelos sellers da plataforma"
        actions={<ExportButtons formats={['CSV']} onCsv={exportCsv} />}
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total de clientes" value={formatNumber(clientesSummary.total)} icon={Users} />
          <KpiCard label="Clientes ativos" value={formatNumber(clientesSummary.ativos)} icon={UserCheck} />
          <KpiCard label="Ticket médio" value={formatCurrency(clientesSummary.ticketMedio)} icon={Receipt} />
          <KpiCard
            label="Recorrentes"
            value={formatNumber(clientesSummary.recorrentes)}
            icon={Repeat}
            hint="Clientes com 2+ compras"
          />
        </div>

        <SectionCard>
          <Toolbar
            left={
              <>
                <SearchInput value={query} onChange={setQuery} placeholder="Nome, e-mail, CPF…" />
                <MultiSelect label="Método" options={[...PAYMENT_METHODS]} selected={methods} onChange={setMethods} />
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
              keyField={(c) => c.id}
              onRowClick={setSelected}
              pageSize={12}
              minWidth={920}
              emptyLabel="Nenhum cliente para os filtros."
            />
          </div>
        </SectionCard>
      </div>

      {/* Drawer de detalhe */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        subtitle={selected ? selected.email : ''}
        width="lg"
      >
        {selected && (
          <>
            <div className="mb-6 flex items-center justify-between rounded-2xl border border-border bg-card-muted/40 p-4">
              <div>
                <p className="text-xs text-muted">Total gasto</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(selected.totalGasto)}</p>
                <p className="mt-0.5 text-xs text-muted">{formatNumber(selected.compras)} compras</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={selected.status} />
                <RiskBadge level={selected.risco} />
              </div>
            </div>

            <DrawerSection title="Dados do cliente">
              <DetailRow
                label="E-mail"
                value={
                  <button
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                    onClick={() => {
                      navigator.clipboard?.writeText(selected.email)
                      toast('E-mail copiado')
                    }}
                  >
                    {selected.email} <Copy className="h-3 w-3" />
                  </button>
                }
              />
              <DetailRow label="Documento (CPF)" value={selected.document} />
              <DetailRow label="Método preferido" value={<MethodBadge method={selected.metodoPreferido} />} />
              <DetailRow label="Última compra" value={formatShort(selected.ultimaCompra)} />
            </DrawerSection>

            <DrawerSection title="Atividade">
              <DetailRow label="Compras totais" value={formatNumber(selected.compras)} />
              <DetailRow label="Total gasto" value={formatCurrency(selected.totalGasto)} />
              <DetailRow
                label="Ticket médio"
                value={formatCurrency(selected.compras > 0 ? selected.totalGasto / selected.compras : 0)}
              />
              <DetailRow
                label="Chargebacks"
                value={
                  selected.chargebacks > 0 ? (
                    <span className="inline-flex items-center gap-1 text-danger">
                      <ShieldAlert className="h-3.5 w-3.5" /> {formatNumber(selected.chargebacks)}
                    </span>
                  ) : (
                    <span className="text-success">Nenhum</span>
                  )
                }
              />
            </DrawerSection>

            <DrawerSection title="Últimas compras">
              <div className="space-y-2">
                {selected.history.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card-muted/30 px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{p.sellerName}</p>
                      <p className="text-xs text-muted">
                        {formatShort(p.date)} · {p.method}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <span className="text-sm font-semibold text-foreground">{formatCurrency(p.amount)}</span>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            </DrawerSection>
          </>
        )}
      </Drawer>
    </>
  )
}
