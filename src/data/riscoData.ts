import { mulberry32, hashStr, pick, randInt } from '../lib/rng'
import { sellers, FIRST_NAMES, LAST_NAMES, PAYMENT_METHODS } from './shared'

/* ------------------------------- KPIs --------------------------------- */

export interface FraudKpi {
  id: string
  label: string
  value: number
  delta: number
  invert?: boolean
  format: 'number' | 'currencyCompact' | 'score'
  hint?: string
}

export const fraudKpis: FraudKpi[] = [
  { id: 'alertas', label: 'Alertas abertos', value: 37, delta: 12.4, invert: true, format: 'number', hint: 'Aguardando análise manual' },
  { id: 'bloqueadas', label: 'Transações bloqueadas hoje', value: 64, delta: 8.1, invert: true, format: 'number', hint: 'Barradas por regras ativas' },
  { id: 'evitado', label: 'Valor evitado (30d)', value: 482900, delta: 18.6, format: 'currencyCompact', hint: 'Fraude potencial barrada' },
  { id: 'score', label: 'Score médio de risco', value: 31, delta: -4.2, invert: true, format: 'score', hint: 'Quanto menor, melhor' },
]

/* ------------------------- Transações sinalizadas --------------------- */

export type FlaggedStatus = 'Em Análise' | 'Bloqueado' | 'Liberado'

export interface FlaggedTx {
  id: string
  customer: string
  sellerName: string
  amount: number
  method: string
  reason: string
  score: number // 0..100
  status: FlaggedStatus
  date: Date
}

const FRAUD_REASONS = [
  'Velocidade anormal',
  'BIN de alto risco',
  'Geolocalização divergente',
  'Cartão testado em massa',
  'CPF em blocklist',
  'Dispositivo suspeito',
  'Mismatch de e-mail/IP',
] as const

const FLAGGED_STATUSES: FlaggedStatus[] = ['Em Análise', 'Bloqueado', 'Liberado']

function buildFlaggedTx(n: number): FlaggedTx[] {
  const rnd = mulberry32(hashStr('flagged-tx-nummo'))
  const now = new Date()
  const activeSellers = sellers.filter((s) => s.volume30d > 0)
  const out: FlaggedTx[] = []
  for (let i = 0; i < n; i++) {
    const seller = pick(activeSellers, rnd)
    const customer = `${pick(FIRST_NAMES, rnd)} ${pick(LAST_NAMES, rnd)}`
    const amount = [97, 147, 197, 297, 497, 897, 1297, 2497, 4990][randInt(rnd, 0, 8)]
    const minutesAgo = Math.floor(rnd() * 60 * 24 * 5)
    out.push({
      id: `fl_${(5000 + i).toString(36)}`,
      customer,
      sellerName: seller.name,
      amount,
      method: pick([...PAYMENT_METHODS], rnd),
      reason: pick([...FRAUD_REASONS], rnd),
      score: randInt(rnd, 22, 98),
      status: pick(FLAGGED_STATUSES, rnd),
      date: new Date(now.getTime() - minutesAgo * 60000),
    })
  }
  return out.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export const flaggedTx = buildFlaggedTx(22)

/** Contagem de bloqueios por motivo (para o gráfico). */
export const blocksByReason: { label: string; value: number; color: string }[] = (() => {
  const rnd = mulberry32(hashStr('blocks-by-reason-nummo'))
  const colors = ['#f43f5e', '#fb923c', '#f5c043', '#8b5cf6', '#6366f1', '#2dd4bf', '#2f6bff']
  return [...FRAUD_REASONS]
    .map((label, i) => ({ label, value: randInt(rnd, 6, 48), color: colors[i % colors.length] }))
    .sort((a, b) => b.value - a.value)
})()

/* ----------------------------- Regras --------------------------------- */

export type RuleAction = 'Bloquear' | 'Revisar' | 'Score+'

export interface FraudRule {
  id: string
  nome: string
  descricao: string
  ativo: boolean
  acao: RuleAction
  disparos30d: number
}

export const fraudRules: FraudRule[] = [
  {
    id: 'rl_01',
    nome: 'Velocidade de tentativas',
    descricao: 'Mais de 5 tentativas do mesmo cartão em 10 minutos',
    ativo: true,
    acao: 'Bloquear',
    disparos30d: 312,
  },
  {
    id: 'rl_02',
    nome: 'BIN de alto risco',
    descricao: 'Faixas de BIN com histórico elevado de chargeback',
    ativo: true,
    acao: 'Revisar',
    disparos30d: 148,
  },
  {
    id: 'rl_03',
    nome: 'Geolocalização divergente',
    descricao: 'IP em país diferente do endereço de cobrança',
    ativo: true,
    acao: 'Score+',
    disparos30d: 207,
  },
  {
    id: 'rl_04',
    nome: 'CPF em blocklist',
    descricao: 'Documento presente na lista de bloqueio interna',
    ativo: true,
    acao: 'Bloquear',
    disparos30d: 56,
  },
  {
    id: 'rl_05',
    nome: 'Card testing em massa',
    descricao: 'Sequência de transações de baixo valor recusadas',
    ativo: false,
    acao: 'Bloquear',
    disparos30d: 94,
  },
  {
    id: 'rl_06',
    nome: 'Mismatch e-mail/IP',
    descricao: 'Domínio de e-mail incompatível com a região do IP',
    ativo: false,
    acao: 'Score+',
    disparos30d: 41,
  },
]

/* ----------------------------- Blocklist ------------------------------ */

export type BlocklistType = 'CPF' | 'CNPJ' | 'E-mail' | 'Cartão (BIN)' | 'IP' | 'Telefone'

export const BLOCKLIST_TYPES: BlocklistType[] = ['CPF', 'CNPJ', 'E-mail', 'Cartão (BIN)', 'IP', 'Telefone']

export interface BlocklistEntry {
  id: string
  tipo: BlocklistType
  valor: string
  motivo: string
  addedBy: string
  date: Date
}

const BLOCK_REASONS = [
  'Fraude confirmada',
  'Chargeback recorrente',
  'Card testing',
  'Identidade falsa',
  'Solicitação judicial',
  'Lavagem de dinheiro',
  'Conta laranja',
]

const ANALYSTS = [
  'Pedro Costa',
  'Marina Alves',
  'Ricardo Nunes',
  'Sistema Antifraude',
  'Camila Rocha',
]

function maskedValue(tipo: BlocklistType, rnd: () => number): string {
  switch (tipo) {
    case 'CPF':
      return `${randInt(rnd, 100, 999)}.${randInt(rnd, 100, 999)}.***-**`
    case 'CNPJ':
      return `${randInt(rnd, 10, 99)}.${randInt(rnd, 100, 999)}.***/0001-**`
    case 'E-mail':
      return `${pick(FIRST_NAMES, rnd).toLowerCase()}***@email.com`
    case 'Cartão (BIN)':
      return `${randInt(rnd, 400000, 559999)} • • • •`
    case 'IP':
      return `${randInt(rnd, 2, 223)}.${randInt(rnd, 0, 255)}.${randInt(rnd, 0, 255)}.${randInt(rnd, 1, 254)}`
    case 'Telefone':
      return `(${randInt(rnd, 11, 99)}) 9****-**${randInt(rnd, 10, 99)}`
  }
}

function buildBlocklist(n: number): BlocklistEntry[] {
  const rnd = mulberry32(hashStr('blocklist-nummo'))
  const now = new Date()
  const out: BlocklistEntry[] = []
  for (let i = 0; i < n; i++) {
    const tipo = pick(BLOCKLIST_TYPES, rnd)
    const daysAgo = randInt(rnd, 0, 120)
    out.push({
      id: `bl_${(6000 + i).toString(36)}`,
      tipo,
      valor: maskedValue(tipo, rnd),
      motivo: pick(BLOCK_REASONS, rnd),
      addedBy: pick(ANALYSTS, rnd),
      date: new Date(now.getTime() - daysAgo * 24 * 60 * 60000),
    })
  }
  return out.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export const blocklist = buildBlocklist(14)
