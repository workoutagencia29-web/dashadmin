import { addDays, formatDayMonth } from '../lib/date'
import { mulberry32, hashStr, pick, randInt } from '../lib/rng'
import { sellers } from './shared'

/* ------------------------- Saldos da plataforma ------------------------- */

export interface PlatformBalances {
  saldoOperacional: number
  aReceber: number
  reservaTotal: number
  repassesPendentes: number
  receitaTaxasMes: number
}

export const platformBalances: PlatformBalances = {
  saldoOperacional: 4_280_500,
  aReceber: 9_640_000,
  reservaTotal: 1_182_300,
  repassesPendentes: 2_134_800,
  receitaTaxasMes: 318_900,
}

/* --------------------------- Fluxo de caixa 14d ------------------------- */

export interface CashflowPoint {
  label: string
  entradas: number
  saidas: number
}

function buildCashflow(days: number): CashflowPoint[] {
  const rnd = mulberry32(hashStr('cashflow-nummo'))
  const now = new Date()
  const out: CashflowPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(now, -i)
    const weekend = d.getDay() === 0 || d.getDay() === 6
    const base = weekend ? 0.55 : 1
    const entradas = Math.round((280_000 + rnd() * 340_000) * base)
    const saidas = Math.round((entradas * (0.62 + rnd() * 0.24)) / 1000) * 1000
    out.push({ label: formatDayMonth(d), entradas, saidas })
  }
  return out
}

export const cashflow14d = buildCashflow(14)

/* ------------------------- Receita por método -------------------------- */

export interface RevenueSlice {
  label: string
  value: number
  color: string
}

export const revenueByMethod: RevenueSlice[] = [
  { label: 'Cartão de Crédito', value: 168_400, color: '#2f6bff' },
  { label: 'Pix', value: 92_300, color: '#2dd4bf' },
  { label: 'Boleto', value: 38_700, color: '#f5c043' },
  { label: 'Cartão de Débito', value: 19_500, color: '#8b5cf6' },
]

/* ------------------------------- Repasses ------------------------------ */

export interface Repasse {
  id: string
  sellerName: string
  valor: number
  metodo: string
  date: Date
  status: 'Concluído' | 'Em Processamento' | 'Solicitado'
}

function buildRepasses(n: number): Repasse[] {
  const rnd = mulberry32(hashStr('repasses-nummo'))
  const now = new Date()
  const activeSellers = sellers.filter((s) => s.volume30d > 0)
  const methods = ['Pix', 'TED', 'Pix', 'TED']
  const statuses: Repasse['status'][] = [
    'Concluído',
    'Concluído',
    'Em Processamento',
    'Solicitado',
  ]
  const out: Repasse[] = []
  for (let i = 0; i < n; i++) {
    const seller = pick(activeSellers, rnd)
    out.push({
      id: `rp_${(5000 + i).toString(36)}`,
      sellerName: seller.name,
      valor: randInt(rnd, 18, 940) * 100,
      metodo: pick(methods, rnd),
      date: new Date(now.getTime() - Math.floor(rnd() * 60 * 24 * 6) * 60000),
      status: pick(statuses, rnd),
    })
  }
  return out.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export const repasses = buildRepasses(10)

/* ------------------------------- Saques -------------------------------- */

export type SaqueStatus = 'Solicitado' | 'Em Processamento' | 'Concluído' | 'Rejeitado'

export interface Saque {
  id: string
  sellerId: string
  sellerName: string
  pixKey: string
  amount: number
  requestedAt: Date
  status: SaqueStatus
  risk: 'Baixo' | 'Médio' | 'Alto'
}

const PIX_KEY_TYPES = ['cnpj', 'email', 'telefone', 'aleatoria'] as const

function buildPixKey(seller: (typeof sellers)[number], rnd: () => number): string {
  const type = pick([...PIX_KEY_TYPES], rnd)
  switch (type) {
    case 'cnpj':
      return seller.document
    case 'email':
      return seller.email
    case 'telefone':
      return `+55 11 9${randInt(rnd, 1000, 9999)}-${randInt(rnd, 1000, 9999)}`
    default:
      return `${randInt(rnd, 100000, 999999)}-${randInt(rnd, 1000, 9999)}-pix`
  }
}

function buildSaques(n: number): Saque[] {
  const rnd = mulberry32(hashStr('saques-nummo'))
  const now = new Date()
  const activeSellers = sellers.filter((s) => s.volume30d > 0)
  const statusWeights: [SaqueStatus, number][] = [
    ['Solicitado', 40],
    ['Em Processamento', 22],
    ['Concluído', 28],
    ['Rejeitado', 10],
  ]
  const totalW = statusWeights.reduce((s, [, w]) => s + w, 0)
  const riskLevels: Saque['risk'][] = ['Baixo', 'Médio', 'Alto']
  const out: Saque[] = []
  for (let i = 0; i < n; i++) {
    const seller = pick(activeSellers, rnd)
    let r = rnd() * totalW
    let status: SaqueStatus = 'Solicitado'
    for (const [s, w] of statusWeights) {
      if (r < w) {
        status = s
        break
      }
      r -= w
    }
    const risk = rnd() > 0.78 ? pick(riskLevels.slice(1), rnd) : 'Baixo'
    out.push({
      id: `sq_${(7000 + i).toString(36)}`,
      sellerId: seller.id,
      sellerName: seller.name,
      pixKey: buildPixKey(seller, rnd),
      amount: randInt(rnd, 12, 1280) * 100,
      requestedAt: new Date(now.getTime() - Math.floor(rnd() * 60 * 24 * 4) * 60000),
      status,
      risk,
    })
  }
  return out.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime())
}

export const saques = buildSaques(24)

/* ----------------------------- Antecipações ---------------------------- */

export type AntecipacaoStatus = 'Solicitado' | 'Em Processamento' | 'Concluído' | 'Rejeitado'

export interface Antecipacao {
  id: string
  sellerName: string
  bruto: number
  taxa: number // % a.m.
  liquido: number
  parcelas: number
  status: AntecipacaoStatus
  date: Date
}

function buildAntecipacoes(n: number): Antecipacao[] {
  const rnd = mulberry32(hashStr('antecipacoes-nummo'))
  const now = new Date()
  const activeSellers = sellers.filter((s) => s.volume30d > 0)
  const statuses: AntecipacaoStatus[] = [
    'Solicitado',
    'Solicitado',
    'Em Processamento',
    'Concluído',
    'Concluído',
    'Rejeitado',
  ]
  const out: Antecipacao[] = []
  for (let i = 0; i < n; i++) {
    const seller = pick(activeSellers, rnd)
    const bruto = randInt(rnd, 80, 1400) * 100
    const taxa = +(1.4 + rnd() * 2.6).toFixed(2)
    const parcelas = pick([2, 3, 4, 6, 10, 12], rnd)
    const liquido = +(bruto * (1 - (taxa / 100) * (parcelas / 2))).toFixed(2)
    out.push({
      id: `at_${(8000 + i).toString(36)}`,
      sellerName: seller.name,
      bruto,
      taxa,
      liquido,
      parcelas,
      status: pick(statuses, rnd),
      date: new Date(now.getTime() - Math.floor(rnd() * 60 * 24 * 18) * 60000),
    })
  }
  return out.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export const antecipacoes = buildAntecipacoes(16)

/* ------------------------------- Reservas ------------------------------ */

export interface Reserva {
  sellerId: string
  sellerName: string
  percentual: number
  retido: number
  liberadoPrevisto: Date
  motivo: string
}

const RESERVA_MOTIVOS = [
  'Chargeback acima da média do segmento',
  'Alto volume em produto digital',
  'Política padrão de reserva (D+30)',
  'Histórico recente de disputas MED',
  'Seller novo — período de observação',
  'Pico de volume atípico no período',
]

function buildReservas(n: number): Reserva[] {
  const rnd = mulberry32(hashStr('reservas-nummo'))
  const now = new Date()
  const eligible = sellers.filter((s) => s.volume30d > 0)
  const out: Reserva[] = []
  const used = new Set<string>()
  let guard = 0
  while (out.length < Math.min(n, eligible.length) && guard < 200) {
    guard++
    const seller = pick(eligible, rnd)
    if (used.has(seller.id)) continue
    used.add(seller.id)
    const percentual = randInt(rnd, 5, 30)
    const retido = Math.round((seller.volume30d * percentual) / 100 / 100) * 100
    out.push({
      sellerId: seller.id,
      sellerName: seller.name,
      percentual,
      retido,
      liberadoPrevisto: addDays(now, randInt(rnd, 2, 30)),
      motivo: pick(RESERVA_MOTIVOS, rnd),
    })
  }
  return out.sort((a, b) => b.retido - a.retido)
}

export const reservas = buildReservas(10)
