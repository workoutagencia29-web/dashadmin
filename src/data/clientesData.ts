import { addDays } from '../lib/date'
import { mulberry32, hashStr, pick, randInt } from '../lib/rng'
import { FIRST_NAMES, LAST_NAMES, PAYMENT_METHODS, sellers } from './shared'

export type CustomerStatus = 'Ativo' | 'Inativo'
export type CustomerRisk = 'Baixo' | 'Médio' | 'Alto'

/** Uma compra individual do histórico do cliente. */
export interface CustomerPurchase {
  id: string
  date: Date
  sellerName: string
  method: string
  amount: number
  status: 'Aprovado' | 'Estornado' | 'Recusado'
}

export interface Customer {
  id: string
  name: string
  email: string
  document: string // CPF mascarado
  totalGasto: number
  compras: number
  ultimaCompra: Date
  metodoPreferido: string
  status: CustomerStatus
  risco: CustomerRisk
  chargebacks: number
  history: CustomerPurchase[]
}

/** "João Silva" -> "joao.silva" (remove acentos via NFD + faixa combinante). */
function slugifyEmail(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]+/g, '.')
    .replace(/^\.|\.$/g, '')
}

/** CPF mascarado fictício no formato 123.***.**9-04. */
function maskedCpf(rnd: () => number): string {
  const a = randInt(rnd, 100, 999)
  const tail = randInt(rnd, 0, 9)
  const dv = String(randInt(rnd, 0, 99)).padStart(2, '0')
  return `${a}.***.**${tail}-${dv}`
}

const TICKETS = [29.9, 49.9, 97, 147, 197, 297, 497, 897, 1297]
const HISTORY_STATUSES: CustomerPurchase['status'][] = [
  'Aprovado',
  'Aprovado',
  'Aprovado',
  'Aprovado',
  'Estornado',
  'Recusado',
]

function buildCustomers(n: number): Customer[] {
  const rnd = mulberry32(hashStr('clientes-nummo'))
  const now = new Date()
  const activeSellers = sellers.filter((s) => s.volume30d > 0)
  const out: Customer[] = []

  for (let i = 0; i < n; i++) {
    const name = `${pick(FIRST_NAMES, rnd)} ${pick(LAST_NAMES, rnd)}`
    const compras = randInt(rnd, 1, 38)
    const metodoPreferido = pick([...PAYMENT_METHODS], rnd)
    const ultimaCompraDiasAtras = randInt(rnd, 0, 180)
    const ultimaCompra = new Date(now.getTime() - ultimaCompraDiasAtras * 24 * 60 * 60 * 1000)
    const status: CustomerStatus = ultimaCompraDiasAtras > 90 ? 'Inativo' : 'Ativo'
    const chargebacks = rnd() > 0.86 ? randInt(rnd, 1, 3) : 0
    const risco: CustomerRisk = chargebacks >= 2 ? 'Alto' : chargebacks === 1 || rnd() > 0.82 ? 'Médio' : 'Baixo'

    // Mini histórico: até 5 compras recentes derivadas.
    const histCount = Math.min(compras, randInt(rnd, 2, 5))
    const history: CustomerPurchase[] = []
    let totalGasto = 0
    for (let j = 0; j < compras; j++) {
      const amount = +(TICKETS[randInt(rnd, 0, TICKETS.length - 1)] * (rnd() > 0.75 ? randInt(rnd, 1, 3) : 1)).toFixed(2)
      totalGasto += amount
    }
    for (let j = 0; j < histCount; j++) {
      const amount = TICKETS[randInt(rnd, 0, TICKETS.length - 1)]
      const date = addDays(ultimaCompra, -randInt(rnd, 0, 60))
      history.push({
        id: `pc_${(50000 + i * 10 + j).toString(36)}`,
        date,
        sellerName: pick(activeSellers, rnd).name,
        method: rnd() > 0.4 ? metodoPreferido : pick([...PAYMENT_METHODS], rnd),
        amount,
        status: pick(HISTORY_STATUSES, rnd),
      })
    }
    history.sort((a, b) => b.date.getTime() - a.date.getTime())

    out.push({
      id: `cus_${(70000 + i).toString(36)}`,
      name,
      email: `${slugifyEmail(name)}${randInt(rnd, 1, 89)}@email.com`,
      document: maskedCpf(rnd),
      totalGasto: +totalGasto.toFixed(2),
      compras,
      ultimaCompra,
      metodoPreferido,
      status,
      risco,
      chargebacks,
      history,
    })
  }

  return out.sort((a, b) => b.totalGasto - a.totalGasto)
}

export const customers = buildCustomers(40)

const ativos = customers.filter((c) => c.status === 'Ativo')
const recorrentes = customers.filter((c) => c.compras >= 2)
const totalGastoGeral = customers.reduce((s, c) => s + c.totalGasto, 0)
const totalCompras = customers.reduce((s, c) => s + c.compras, 0)

export const clientesSummary = {
  total: customers.length,
  ativos: ativos.length,
  ticketMedio: totalCompras > 0 ? +(totalGastoGeral / totalCompras).toFixed(2) : 0,
  recorrentes: recorrentes.length,
}
