import { addDays } from '../lib/date'
import { mulberry32, hashStr, pick, randInt } from '../lib/rng'
import { sellers, sellerById, FIRST_NAMES, LAST_NAMES, PAYMENT_METHODS, SEGMENTS } from './shared'
import type { Seller } from './shared'

/* ============================ Fila de KYC ============================ */

export type DocStatus = 'Verificado' | 'Pendente' | 'Reprovado'
export type KycStatus = 'Em Análise' | 'Pendente Documentos' | 'Aprovado' | 'Reprovado'

export interface KycDoc {
  tipo: string
  status: DocStatus
}

export interface KycItem {
  id: string
  sellerId: string
  sellerName: string
  document: string
  segment: string
  submittedAt: Date
  docs: KycDoc[]
  riskScore: number // 0..100
  status: KycStatus
}

const DOC_TYPES = [
  'Cartão CNPJ',
  'Contrato Social',
  'Comprovante de Endereço',
  'Documento do Responsável (RG/CNH)',
  'Selfie com Documento',
  'Comprovante de Conta Bancária',
]

const KYC_STATUSES: KycStatus[] = ['Em Análise', 'Pendente Documentos', 'Aprovado', 'Reprovado']
const DOC_STATUSES: DocStatus[] = ['Verificado', 'Verificado', 'Pendente', 'Reprovado']

/** Nome de loja fictício e estável para os itens extras de KYC. */
const EXTRA_PREFIX = ['Nova', 'Loja', 'Studio', 'Grupo', 'Casa', 'Espaço', 'Central']
const EXTRA_CORE = ['Aurora', 'Vértice', 'Horizonte', 'Conecta', 'Prisma', 'Vértix', 'Lumina', 'Meridian']

function buildKycQueue(): KycItem[] {
  const rnd = mulberry32(hashStr('kyc-fila-nummo'))
  const out: KycItem[] = []

  // (1) Sellers já cadastrados que estão em onboarding/análise.
  const pending = sellers.filter((s) => s.status === 'Em Análise KYC' || s.status === 'Em Onboarding')
  for (const s of pending) {
    const riskScore = randInt(rnd, 24, 78)
    out.push({
      id: `kyc_${s.id}`,
      sellerId: s.id,
      sellerName: s.name,
      document: s.document,
      segment: s.segment,
      submittedAt: new Date(Date.now() - randInt(rnd, 30, 60 * 24 * 6) * 60000),
      docs: DOC_TYPES.map((tipo) => ({ tipo, status: pick(DOC_STATUSES, rnd) })),
      riskScore,
      status: s.status === 'Em Onboarding' ? 'Pendente Documentos' : 'Em Análise',
    })
  }

  // (2) Itens extras (cadastros novos ainda não promovidos a Seller).
  const extras = 8
  for (let i = 0; i < extras; i++) {
    const sellerName = `${pick(EXTRA_PREFIX, rnd)} ${pick(EXTRA_CORE, rnd)}`
    const riskScore = randInt(rnd, 10, 94)
    const status = pick(KYC_STATUSES, rnd)
    const docs = DOC_TYPES.map((tipo) => {
      // Aprovados têm tudo verificado; reprovados têm ao menos um reprovado.
      if (status === 'Aprovado') return { tipo, status: 'Verificado' as DocStatus }
      return { tipo, status: pick(DOC_STATUSES, rnd) }
    })
    if (status === 'Reprovado') docs[randInt(rnd, 0, docs.length - 1)].status = 'Reprovado'
    out.push({
      id: `kyc_n${(4000 + i).toString(36)}`,
      sellerId: `pend_${(4000 + i).toString(36)}`,
      sellerName,
      document: `${randInt(rnd, 10, 49)}.${randInt(rnd, 100, 999)}.${randInt(rnd, 100, 999)}/0001-${String(randInt(rnd, 10, 99))}`,
      segment: pick(SEGMENTS, rnd),
      submittedAt: new Date(Date.now() - randInt(rnd, 60, 60 * 24 * 9) * 60000),
      docs,
      riskScore,
      status,
    })
  }

  return out.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
}

export const kycQueue: KycItem[] = buildKycQueue()

export const sellerKycSummary = {
  pendentes: kycQueue.filter((k) => k.status === 'Em Análise' || k.status === 'Pendente Documentos').length,
  aprovadosMes: kycQueue.filter((k) => k.status === 'Aprovado').length + 9,
  reprovadosMes: kycQueue.filter((k) => k.status === 'Reprovado').length + 2,
  tempoMedioH: 18,
}

/** Mapeia o riskScore (0..100) para um nível de risco textual. */
export function kycRiskLevel(score: number): 'Baixo' | 'Médio' | 'Alto' | 'Crítico' {
  if (score >= 80) return 'Crítico'
  if (score >= 55) return 'Alto'
  if (score >= 30) return 'Médio'
  return 'Baixo'
}

/* ========================= Detalhe do Seller ========================= */

export interface SellerTxRow {
  id: string
  date: Date
  customer: string
  method: string
  gross: number
  status: 'Aprovado' | 'Pendente' | 'Recusado' | 'Estornado'
}

export interface SellerVolumePoint {
  label: string
  volume: number
}

export interface SellerFeeRow {
  method: string
  mdr: number // % retido pela plataforma
  fixed: number // taxa fixa R$
  liquidacao: string // prazo de liquidação
}

export interface SellerDetail {
  saldoDisponivel: number
  aReceber: number
  reserva: number
  volume14d: SellerVolumePoint[]
  volumeSpark: number[]
  lastTransactions: SellerTxRow[]
  fees: SellerFeeRow[]
}

const TX_STATUSES: SellerTxRow['status'][] = ['Aprovado', 'Aprovado', 'Aprovado', 'Pendente', 'Recusado', 'Estornado']
const TICKETS = [29.9, 49.9, 97, 147, 197, 297, 497, 897, 1297]

const LIQUIDACAO: Record<string, string> = {
  Pix: 'D+0',
  Boleto: 'D+1',
  'Cartão de Crédito': 'D+30',
  'Cartão de Débito': 'D+1',
}

/** Dados ricos e determinísticos de um seller, semeados por id. */
export function getSellerDetail(id: string): SellerDetail | null {
  const seller: Seller | undefined = sellerById(id)
  if (!seller) return null

  const rnd = mulberry32(hashStr(`detalhe-${id}`))
  const base = seller.volume30d > 0 ? seller.volume30d : randInt(rnd, 18000, 120000)

  const saldoDisponivel = +(base * (0.06 + rnd() * 0.05)).toFixed(2)
  const aReceber = +(base * (0.22 + rnd() * 0.14)).toFixed(2)
  const reserva = +(base * (0.03 + rnd() * 0.03)).toFixed(2)

  // Série de 14 dias terminando hoje.
  const now = new Date()
  const diario = base / 30
  const volume14d: SellerVolumePoint[] = []
  for (let i = 13; i >= 0; i--) {
    const d = addDays(now, -i)
    const factor = 0.6 + rnd() * 0.9
    volume14d.push({
      label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      volume: +(diario * factor).toFixed(2),
    })
  }
  const volumeSpark = volume14d.map((p) => p.volume)

  // Últimas 5 transações derivadas do seller.
  const lastTransactions: SellerTxRow[] = []
  for (let i = 0; i < 5; i++) {
    const customer = `${pick(FIRST_NAMES, rnd)} ${pick(LAST_NAMES, rnd)}`
    const method = pick([...PAYMENT_METHODS], rnd)
    const gross = +(TICKETS[randInt(rnd, 0, TICKETS.length - 1)] * (rnd() > 0.75 ? randInt(rnd, 1, 3) : 1)).toFixed(2)
    lastTransactions.push({
      id: `tx_${id}_${(900 + i).toString(36)}`,
      date: new Date(now.getTime() - randInt(rnd, 5, 60 * 24 * 6) * 60000),
      customer,
      method,
      gross,
      status: pick(TX_STATUSES, rnd),
    })
  }
  lastTransactions.sort((a, b) => b.date.getTime() - a.date.getTime())

  // Taxa configurada por método.
  const fees: SellerFeeRow[] = PAYMENT_METHODS.map((method) => {
    const isCard = method.includes('Cartão')
    const mdr = method === 'Pix' ? +(0.79 + rnd() * 0.4).toFixed(2) : isCard ? +(3.49 + rnd() * 0.9).toFixed(2) : +(2.49 + rnd() * 0.6).toFixed(2)
    const fixed = method === 'Pix' ? 0 : +(0.39 + rnd() * 0.2).toFixed(2)
    return { method, mdr, fixed, liquidacao: LIQUIDACAO[method] ?? 'D+1' }
  })

  return { saldoDisponivel, aReceber, reserva, volume14d, volumeSpark, lastTransactions, fees }
}
