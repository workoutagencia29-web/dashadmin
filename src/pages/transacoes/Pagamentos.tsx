import { useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  CheckCircle2,
  Banknote,
  XCircle,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  ShieldOff,
  Pencil,
} from 'lucide-react'
import {
  PageHeader,
  KpiCard,
  SectionCard,
  SearchInput,
  MultiSelect,
  Select,
  DataTable,
  StatusBadge,
  MethodBadge,
  Badge,
  Avatar,
  Drawer,
  DetailRow,
  DrawerSection,
  Timeline,
  Toolbar,
  ExportButtons,
  downloadCsv,
  Button,
  Switch,
  Modal,
  Field,
  type Column,
} from '../../components/ui'
import { transactions, txSummary, type Transaction, type TxStatus } from '../../data/transacoesData'
import { PAYMENT_METHODS } from '../../data/shared'
import { formatCurrency, formatNumber } from '../../lib/utils'
import { formatDateTime, timeAgo } from '../../lib/date'
import { mulberry32, hashStr, pick, randInt } from '../../lib/rng'
import { useToast } from '../../components/ui/Toast'

const STATUSES: TxStatus[] = ['Aprovado', 'Pendente', 'Recusado', 'Estornado', 'Chargeback', 'Expirado']

function statusStep(s: TxStatus): number {
  const map: Record<TxStatus, number> = {
    Pendente: 0,
    Aprovado: 2,
    Recusado: 1,
    Estornado: 3,
    Chargeback: 3,
    Expirado: 1,
  }
  return map[s]
}

/* --------------------------- Helpers de privacidade --------------------------- */

/** Mascara valor monetário quando "Ocultar valores" está ativo. */
function maskMoney(v: number, hidden: boolean): string {
  return hidden ? 'R$ ••••' : formatCurrency(v)
}

/** "João Silva" -> "J••• S•••" quando ativo. */
function maskName(n: string, on: boolean): string {
  if (!on) return n
  return n
    .split(/\s+/)
    .map((p) => (p ? `${p[0]}•••` : p))
    .join(' ')
}

/** "joao.silva@email.com" -> "j•••@email.com" quando ativo. */
function maskEmail(e: string, on: boolean): string {
  if (!on) return e
  const [user, domain] = e.split('@')
  if (!domain) return `${e[0] ?? ''}•••`
  return `${user[0] ?? ''}•••@${domain}`
}

/** Documento mock mascarado por dígitos. */
function maskDoc(doc: string, on: boolean): string {
  if (!on) return doc
  return doc.replace(/\d/g, '•')
}

/* ------------------ Dados extras determinísticos por transação ------------------ */

const PHYSICAL_METHODS = ['Boleto'] // métodos típicos de produto físico (envio)
const CITIES: [string, string][] = [
  ['São Paulo', 'SP'],
  ['Rio de Janeiro', 'RJ'],
  ['Belo Horizonte', 'MG'],
  ['Curitiba', 'PR'],
  ['Porto Alegre', 'RS'],
  ['Salvador', 'BA'],
  ['Fortaleza', 'CE'],
  ['Recife', 'PE'],
]
const STREETS = ['Rua das Flores', 'Av. Paulista', 'Rua XV de Novembro', 'Av. Brasil', 'Rua da Praia', 'Av. Atlântica']
const DELIVERY_STATUS = ['Postado', 'Em trânsito', 'Saiu para entrega', 'Entregue']

interface TxExtra {
  phone: string
  document: string
  street: string
  city: string
  uf: string
  cep: string
  isPhysical: boolean
  trackingCode: string
  deliveryStatus: string
  acquirerCost: number
  subAccount: string
  webhooks: { status: 200 | 500; date: Date; attempt: number }[]
}

/** Deriva campos extras de forma estável a partir do ID da transação. */
function txExtra(tx: Transaction): TxExtra {
  const rnd = mulberry32(hashStr(tx.id))
  const phone = `(${randInt(rnd, 11, 99)}) 9${randInt(rnd, 1000, 9999)}-${randInt(rnd, 1000, 9999)}`
  const docDigits = String(randInt(rnd, 100, 999)) +
    '.' + String(randInt(rnd, 100, 999)) +
    '.' + String(randInt(rnd, 100, 999)) +
    '-' + String(randInt(rnd, 10, 99))
  const [city, uf] = pick(CITIES, rnd)
  const street = `${pick(STREETS, rnd)}, ${randInt(rnd, 10, 1999)}`
  const cep = `${randInt(rnd, 10000, 99999)}-${randInt(rnd, 100, 999)}`
  const isPhysical = PHYSICAL_METHODS.includes(tx.method)
  const trackingCode = `BR${randInt(rnd, 100000000, 999999999)}BR`
  const deliveryStatus = pick(DELIVERY_STATUS, rnd)
  // Custo estimado do adquirente (parte do MDR repassado à rede).
  const acquirerCost = +(tx.mdr * (0.35 + rnd() * 0.25)).toFixed(2)
  const subAccount = `sub_${tx.sellerId}`
  const now = Date.now()
  const attempts = randInt(rnd, 2, 3)
  const webhooks = Array.from({ length: attempts }, (_, i) => {
    // última tentativa tende a 200 quando a transação foi aprovada
    const ok = i === attempts - 1 ? tx.status === 'Aprovado' || rnd() > 0.3 : rnd() > 0.55
    return {
      status: (ok ? 200 : 500) as 200 | 500,
      date: new Date(now - randInt(rnd, 2, 600) * 60000 - i * 90000),
      attempt: i + 1,
    }
  })
  return {
    phone,
    document: docDigits,
    street,
    city,
    uf,
    cep,
    isPhysical,
    trackingCode,
    deliveryStatus,
    acquirerCost,
    subAccount,
    webhooks,
  }
}

export default function Pagamentos() {
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [methods, setMethods] = useState<string[]>([])
  const [status, setStatus] = useState('Todos')
  const [selected, setSelected] = useState<Transaction | null>(null)

  // Refino 1 — toggles de privacidade
  const [hideValues, setHideValues] = useState(false)
  const [maskData, setMaskData] = useState(false)

  // Refino 5 — modal "Editar status"
  const [editOpen, setEditOpen] = useState(false)
  const [editStatus, setEditStatus] = useState<TxStatus>('Aprovado')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return transactions.filter((t) => {
      if (q && !`${t.customer} ${t.sellerName} ${t.id} ${t.nsu}`.toLowerCase().includes(q)) return false
      if (methods.length && !methods.includes(t.method)) return false
      if (status !== 'Todos' && t.status !== status) return false
      return true
    })
  }, [query, methods, status])

  const extra = selected ? txExtra(selected) : null

  const columns: Column<Transaction>[] = [
    {
      header: 'Transação',
      cell: (t) => (
        <div>
          <p className="font-medium text-foreground">{t.id}</p>
          <p className="text-xs text-muted">NSU {t.nsu}</p>
        </div>
      ),
      nowrap: true,
    },
    {
      header: 'Cliente',
      cell: (t) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={t.customer} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{maskName(t.customer, maskData)}</p>
            <p className="truncate text-xs text-muted">{t.sellerName}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Método',
      cell: (t) => (
        <div className="flex flex-col gap-1">
          <MethodBadge method={t.method} />
          {t.brand && (
            <span className="text-xs text-muted">
              {t.brand} {t.installments && t.installments > 1 ? `· ${t.installments}x` : ''}
            </span>
          )}
        </div>
      ),
      nowrap: true,
    },
    {
      header: 'Adquirente · Subconta',
      cell: (t) => (
        <div>
          <p className="font-medium text-foreground">{t.acquirer}</p>
          <p className="text-xs text-muted">sub_{t.sellerId}</p>
        </div>
      ),
      nowrap: true,
    },
    { header: 'Data', cell: (t) => <span className="text-muted">{formatDateTime(t.date)}</span>, nowrap: true },
    {
      header: 'Valor',
      align: 'right',
      cell: (t) => (
        <div>
          <p className="font-semibold text-foreground">{maskMoney(t.gross, hideValues)}</p>
          <p className="text-xs text-muted">taxa {maskMoney(t.mdr, hideValues)}</p>
        </div>
      ),
      nowrap: true,
    },
    { header: 'Status', cell: (t) => <StatusBadge status={t.status} />, nowrap: true },
  ]

  function exportCsv() {
    downloadCsv(
      'transacoes.csv',
      ['ID', 'NSU', 'Cliente', 'Seller', 'Método', 'Adquirente', 'Subconta', 'Data', 'Valor', 'Taxa', 'Status'],
      filtered.map((t) => [
        t.id,
        t.nsu,
        t.customer,
        t.sellerName,
        t.method,
        t.acquirer,
        `sub_${t.sellerId}`,
        formatDateTime(t.date),
        t.gross,
        t.mdr,
        t.status,
      ]),
    )
  }

  function openEdit() {
    if (selected) setEditStatus(selected.status)
    setEditOpen(true)
  }

  function saveEdit() {
    setEditOpen(false)
    toast(`Status alterado para "${editStatus}" — saldo do seller recalculado`, 'success')
  }

  return (
    <>
      <PageHeader
        title="Pagamentos"
        subtitle="Todas as transações processadas pelo gateway"
        actions={<ExportButtons formats={['CSV', 'PDF']} onCsv={exportCsv} />}
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Transações" value={formatNumber(txSummary.total)} icon={ArrowLeftRight} />
          <KpiCard label="Aprovadas" value={formatNumber(txSummary.aprovadas)} icon={CheckCircle2} />
          <KpiCard
            label="Volume aprovado"
            value={hideValues ? 'R$ ••••' : formatCurrency(txSummary.volume)}
            icon={Banknote}
          />
          <KpiCard label="Recusadas" value={formatNumber(txSummary.recusadas)} icon={XCircle} />
        </div>

        <SectionCard>
          <Toolbar
            left={
              <>
                <SearchInput value={query} onChange={setQuery} placeholder="Cliente, seller, ID, NSU…" />
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
            right={
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                  {hideValues ? (
                    <EyeOff className="h-4 w-4 text-primary" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted" />
                  )}
                  <span>Ocultar valores</span>
                  <Switch checked={hideValues} onChange={setHideValues} />
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                  <ShieldOff className={maskData ? 'h-4 w-4 text-primary' : 'h-4 w-4 text-muted'} />
                  <span>Mascarar dados</span>
                  <Switch checked={maskData} onChange={setMaskData} />
                </label>
                <span className="text-sm text-muted">{filtered.length} resultados</span>
              </div>
            }
          />

          <div className="mt-5">
            <DataTable
              columns={columns}
              rows={filtered}
              keyField={(t) => t.id}
              onRowClick={setSelected}
              pageSize={12}
              minWidth={1040}
              emptyLabel="Nenhuma transação para os filtros."
            />
          </div>
        </SectionCard>
      </div>

      {/* Drawer de detalhe */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.id ?? ''}
        subtitle={selected ? `${maskName(selected.customer, maskData)} · ${formatDateTime(selected.date)}` : ''}
        width="lg"
        footer={
          selected && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => toast('Comprovante aberto', 'info')}>
                <ExternalLink className="h-4 w-4" /> Comprovante
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={openEdit}>
                <Pencil className="h-4 w-4" /> Editar status
              </Button>
              {selected.status === 'Aprovado' && (
                <Button variant="danger" size="sm" className="flex-1" onClick={() => toast('Estorno solicitado')}>
                  Estornar
                </Button>
              )}
            </div>
          )
        }
      >
        {selected && extra && (
          <>
            <div className="mb-6 flex items-center justify-between rounded-2xl border border-border bg-card-muted/40 p-4">
              <div>
                <p className="text-xs text-muted">Valor bruto</p>
                <p className="text-2xl font-bold text-foreground">{maskMoney(selected.gross, hideValues)}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <DrawerSection title="Status">
              <Timeline
                steps={['Criada', 'Autorizada', 'Capturada', selected.status === 'Chargeback' ? 'Chargeback' : 'Liquidada']}
                current={statusStep(selected.status)}
              />
            </DrawerSection>

            <DrawerSection title="Dados do Cliente">
              <DetailRow label="Nome" value={maskName(selected.customer, maskData)} />
              <DetailRow
                label="E-mail"
                value={
                  maskData ? (
                    maskEmail(selected.customerEmail, true)
                  ) : (
                    <button
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                      onClick={() => {
                        navigator.clipboard?.writeText(selected.customerEmail)
                        toast('E-mail copiado')
                      }}
                    >
                      {selected.customerEmail} <Copy className="h-3 w-3" />
                    </button>
                  )
                }
              />
              <DetailRow label="Documento" value={maskDoc(extra.document, maskData)} />
              <DetailRow label="Telefone" value={maskData ? extra.phone.replace(/\d/g, '•') : extra.phone} />
              <DetailRow label="Seller" value={selected.sellerName} />
            </DrawerSection>

            <DrawerSection title="Endereço de Entrega">
              <DetailRow label="Endereço" value={extra.street} />
              <DetailRow label="Cidade" value={`${extra.city} · ${extra.uf}`} />
              <DetailRow label="CEP" value={maskData ? extra.cep.replace(/\d/g, '•') : extra.cep} />
            </DrawerSection>

            <DrawerSection title="Rastreamento">
              {extra.isPhysical ? (
                <>
                  <DetailRow
                    label="Código"
                    value={
                      <button
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        onClick={() => {
                          navigator.clipboard?.writeText(extra.trackingCode)
                          toast('Código de rastreio copiado')
                        }}
                      >
                        {extra.trackingCode} <Copy className="h-3 w-3" />
                      </button>
                    }
                  />
                  <DetailRow
                    label="Status de entrega"
                    value={
                      <Badge tone={extra.deliveryStatus === 'Entregue' ? 'success' : 'info'}>
                        {extra.deliveryStatus}
                      </Badge>
                    }
                  />
                </>
              ) : (
                <DetailRow label="Entrega" value={<Badge tone="violet">Produto digital</Badge>} />
              )}
            </DrawerSection>

            <DrawerSection title="Dados da Transação">
              <DetailRow label="ID" value={selected.id} />
              <DetailRow label="NSU" value={selected.nsu} />
              {selected.authCode && <DetailRow label="Cód. autorização" value={selected.authCode} />}
              <DetailRow label="Método" value={selected.method} />
              {selected.brand && <DetailRow label="Bandeira" value={selected.brand} />}
              {selected.installments && selected.installments > 1 && (
                <DetailRow label="Parcelas" value={`${selected.installments}x`} />
              )}
              <DetailRow label="Adquirente" value={selected.acquirer} />
              <DetailRow label="Subconta" value={extra.subAccount} />
              <DetailRow label="Risco" value={<StatusBadge status={selected.risk} />} />
            </DrawerSection>

            <DrawerSection title="Taxas e Custos">
              <DetailRow label="Valor bruto" value={maskMoney(selected.gross, hideValues)} />
              <DetailRow
                label="MDR cobrado"
                value={
                  <span className="text-danger">
                    − {maskMoney(selected.mdr, hideValues)}
                  </span>
                }
              />
              <DetailRow
                label="Custo adquirente (est.)"
                value={
                  <span className="text-warning">
                    − {maskMoney(extra.acquirerCost, hideValues)}
                  </span>
                }
              />
              <DetailRow
                label="Líquido ao seller"
                value={<span className="text-success">{maskMoney(selected.net, hideValues)}</span>}
              />
            </DrawerSection>

            <DrawerSection title="Webhooks">
              <div className="space-y-2">
                {extra.webhooks.map((w) => (
                  <div
                    key={w.attempt}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card-muted/40 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Badge tone={w.status === 200 ? 'success' : 'danger'}>{w.status}</Badge>
                      <span className="text-sm text-foreground">Tentativa {w.attempt}</span>
                    </div>
                    <span className="text-xs text-muted">{timeAgo(w.date)}</span>
                  </div>
                ))}
              </div>
            </DrawerSection>
          </>
        )}
      </Drawer>

      {/* Modal — Editar status (admin) */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar status"
        description={selected ? `Transação ${selected.id}` : ''}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={saveEdit}>
              Salvar
            </Button>
          </>
        }
      >
        <Field label="Novo status">
          <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value as TxStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <p className="mt-4 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs text-warning">
          Alterar o status recalcula o saldo do seller automaticamente.
        </p>
      </Modal>
    </>
  )
}
