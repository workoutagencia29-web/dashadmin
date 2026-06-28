import { addDays } from '../lib/date'
import { mulberry32, hashStr, pick, randInt } from '../lib/rng'
import { sellers, FIRST_NAMES, LAST_NAMES, PAYMENT_METHODS, ACQUIRERS, CARD_BRANDS } from './shared'

export type TxStatus = 'Aprovado' | 'Pendente' | 'Recusado' | 'Estornado' | 'Chargeback' | 'Expirado'

export interface Transaction {
  id: string
  date: Date
  customer: string
  customerEmail: string
  sellerId: string
  sellerName: string
  method: string
  brand?: string
  installments?: number
  acquirer: string
  gross: number
  mdr: number // taxa retida pela plataforma (R$)
  net: number
  status: TxStatus
  risk: 'Baixo' | 'Médio' | 'Alto'
  nsu: string
  authCode?: string
}

const STATUS_WEIGHTS: [TxStatus, number][] = [
  ['Aprovado', 70],
  ['Pendente', 10],
  ['Recusado', 12],
  ['Estornado', 4],
  ['Chargeback', 2],
  ['Expirado', 2],
]

/** "João Silva" -> "joao.silva" (remove acentos via NFD + faixa combinante). */
function slugifyEmail(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]+/g, '.')
    .replace(/^\.|\.$/g, '')
}

function weightedStatus(rnd: () => number): TxStatus {
  const total = STATUS_WEIGHTS.reduce((s, [, w]) => s + w, 0)
  let r = rnd() * total
  for (const [s, w] of STATUS_WEIGHTS) {
    if (r < w) return s
    r -= w
  }
  return 'Aprovado'
}

function buildTransactions(n: number): Transaction[] {
  const rnd = mulberry32(hashStr('transacoes-nummo'))
  const now = new Date()
  const activeSellers = sellers.filter((s) => s.volume30d > 0)
  const out: Transaction[] = []
  for (let i = 0; i < n; i++) {
    const seller = pick(activeSellers, rnd)
    const method = pick([...PAYMENT_METHODS], rnd)
    const isCard = method.includes('Cartão')
    const gross = [29.9, 49.9, 97, 147, 197, 297, 497, 897, 1297][randInt(rnd, 0, 8)] * (rnd() > 0.7 ? randInt(rnd, 1, 3) : 1)
    const mdr = +(gross * (method === 'Pix' ? 0.0099 : isCard ? 0.0399 : 0.0299) + (method === 'Pix' ? 0 : 0.4)).toFixed(2)
    const status = weightedStatus(rnd)
    const minutesAgo = Math.floor(rnd() * 60 * 24 * 30)
    const date = new Date(addDays(now, 0).getTime() - minutesAgo * 60000)
    const customer = `${pick(FIRST_NAMES, rnd)} ${pick(LAST_NAMES, rnd)}`
    out.push({
      id: `tx_${(1000000 + i).toString(36)}`,
      date,
      customer,
      customerEmail: `${slugifyEmail(customer)}@email.com`,
      sellerId: seller.id,
      sellerName: seller.name,
      method,
      brand: isCard ? pick([...CARD_BRANDS], rnd) : undefined,
      installments: isCard ? randInt(rnd, 1, 12) : undefined,
      acquirer: isCard ? pick([...ACQUIRERS], rnd) : 'Interno',
      gross: +gross.toFixed(2),
      mdr,
      net: +(gross - mdr).toFixed(2),
      status,
      risk: status === 'Chargeback' ? 'Alto' : rnd() > 0.85 ? 'Médio' : 'Baixo',
      nsu: String(randInt(rnd, 100000000, 999999999)),
      authCode: status === 'Aprovado' && isCard ? String(randInt(rnd, 100000, 999999)) : undefined,
    })
  }
  return out.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export const transactions = buildTransactions(140)

export const txSummary = {
  total: transactions.length,
  aprovadas: transactions.filter((t) => t.status === 'Aprovado').length,
  volume: transactions.filter((t) => t.status === 'Aprovado').reduce((s, t) => s + t.gross, 0),
  receita: transactions.filter((t) => t.status === 'Aprovado').reduce((s, t) => s + t.mdr, 0),
  recusadas: transactions.filter((t) => t.status === 'Recusado').length,
}

/* ----------------------------- Reembolsos ----------------------------- */

export interface Refund {
  id: string
  txId: string
  date: Date
  customer: string
  sellerName: string
  method: string
  amount: number
  reason: string
  status: 'Solicitado' | 'Concluído' | 'Em Processamento' | 'Rejeitado'
  type: 'Total' | 'Parcial'
}

const REFUND_REASONS = [
  'Arrependimento (CDC art. 49)',
  'Produto não entregue',
  'Cobrança duplicada',
  'Solicitação do cliente',
  'Acordo comercial',
]

function buildRefunds(n: number): Refund[] {
  const rnd = mulberry32(hashStr('reembolsos-nummo'))
  const now = new Date()
  const out: Refund[] = []
  const statuses: Refund['status'][] = ['Solicitado', 'Concluído', 'Em Processamento', 'Rejeitado']
  for (let i = 0; i < n; i++) {
    const tx = pick(transactions.filter((t) => t.status === 'Aprovado'), rnd)
    const isPartial = rnd() > 0.7
    out.push({
      id: `rf_${(2000 + i).toString(36)}`,
      txId: tx.id,
      date: new Date(now.getTime() - Math.floor(rnd() * 60 * 24 * 20) * 60000),
      customer: tx.customer,
      sellerName: tx.sellerName,
      method: tx.method,
      amount: isPartial ? +(tx.gross * (0.3 + rnd() * 0.4)).toFixed(2) : tx.gross,
      reason: pick(REFUND_REASONS, rnd),
      status: pick(statuses, rnd),
      type: isPartial ? 'Parcial' : 'Total',
    })
  }
  return out.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export const refunds = buildRefunds(28)

/* -------------------------- MED / Chargebacks ------------------------- */

export type DisputeStatus = 'Aberta' | 'Em Análise' | 'Defesa Enviada' | 'Ganha' | 'Perdida' | 'Acatada'

export interface Dispute {
  id: string
  txId: string
  openedAt: Date
  deadline: Date
  customer: string
  sellerName: string
  sellerId: string
  method: string
  amount: number
  reason: string
  type: 'MED (Pix)' | 'Chargeback (Cartão)'
  status: DisputeStatus
}

const DISPUTE_REASONS = [
  'Fraude — não reconheço a compra',
  'Produto não recebido',
  'Produto diferente do anunciado',
  'Cobrança não autorizada',
  'Serviço não prestado',
  'Golpe / engenharia social',
]

function buildDisputes(n: number): Dispute[] {
  const rnd = mulberry32(hashStr('disputas-nummo'))
  const now = new Date()
  const out: Dispute[] = []
  const statuses: DisputeStatus[] = ['Aberta', 'Em Análise', 'Defesa Enviada', 'Ganha', 'Perdida', 'Acatada']
  for (let i = 0; i < n; i++) {
    const tx = pick(transactions, rnd)
    const isPix = rnd() > 0.5
    const openedAt = new Date(now.getTime() - Math.floor(rnd() * 60 * 24 * 25) * 60000)
    out.push({
      id: `dp_${(3000 + i).toString(36)}`,
      txId: tx.id,
      openedAt,
      deadline: addDays(openedAt, isPix ? 7 : 15),
      customer: tx.customer,
      sellerName: tx.sellerName,
      sellerId: tx.sellerId,
      method: isPix ? 'Pix' : 'Cartão de Crédito',
      amount: tx.gross,
      reason: pick(DISPUTE_REASONS, rnd),
      type: isPix ? 'MED (Pix)' : 'Chargeback (Cartão)',
      status: pick(statuses, rnd),
    })
  }
  return out.sort((a, b) => b.openedAt.getTime() - a.openedAt.getTime())
}

export const disputes = buildDisputes(34)
