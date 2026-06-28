import { addDays } from '../lib/date'
import { mulberry32, hashStr, pick, randInt } from '../lib/rng'
import { ACQUIRERS, type Acquirer } from './shared'

export type ConciliacaoStatus = 'Conciliado' | 'Divergente' | 'Pendente'

/** Lote de liquidação de um adquirente — base da reconciliação. */
export interface SettlementBatch {
  id: string
  acquirer: Acquirer
  date: Date
  transacoes: number
  valorBruto: number
  taxas: number
  valorLiquido: number // valorBruto - taxas (esperado a receber)
  valorRecebido: number // crédito efetivamente conciliado no extrato
  divergencia: number // valorLiquido - valorRecebido
  status: ConciliacaoStatus
}

const STATUS_WEIGHTS: [ConciliacaoStatus, number][] = [
  ['Conciliado', 68],
  ['Divergente', 16],
  ['Pendente', 16],
]

function weightedStatus(rnd: () => number): ConciliacaoStatus {
  const total = STATUS_WEIGHTS.reduce((s, [, w]) => s + w, 0)
  let r = rnd() * total
  for (const [s, w] of STATUS_WEIGHTS) {
    if (r < w) return s
    r -= w
  }
  return 'Conciliado'
}

function buildBatches(n: number): SettlementBatch[] {
  const rnd = mulberry32(hashStr('conciliacao-nummo'))
  const now = new Date()
  const out: SettlementBatch[] = []
  for (let i = 0; i < n; i++) {
    const acquirer = pick([...ACQUIRERS], rnd)
    const daysAgo = randInt(rnd, 0, 17)
    const date = addDays(now, -daysAgo)
    const transacoes = randInt(rnd, 180, 4200)
    const valorBruto = +(transacoes * (60 + rnd() * 340)).toFixed(2)
    const taxas = +(valorBruto * (0.021 + rnd() * 0.024)).toFixed(2)
    const valorLiquido = +(valorBruto - taxas).toFixed(2)
    const status = weightedStatus(rnd)

    let valorRecebido: number
    if (status === 'Pendente') {
      // Liquidação ainda não creditada no extrato.
      valorRecebido = 0
    } else if (status === 'Divergente') {
      // Crédito a maior ou a menor que o esperado.
      const dir = rnd() > 0.5 ? 1 : -1
      const delta = +(valorLiquido * (0.004 + rnd() * 0.022)).toFixed(2)
      valorRecebido = +(valorLiquido - dir * delta).toFixed(2)
    } else {
      valorRecebido = valorLiquido
    }

    const divergencia = +(valorLiquido - valorRecebido).toFixed(2)
    out.push({
      id: `lot_${(202600 + i).toString(36).toUpperCase()}`,
      acquirer,
      date,
      transacoes,
      valorBruto,
      taxas,
      valorLiquido,
      valorRecebido,
      divergencia,
      status,
    })
  }
  return out.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export const settlementBatches: SettlementBatch[] = buildBatches(28)

export interface ConciliacaoSummary {
  conciliadoValor: number
  divergencias: number
  divergenciaValor: number
  pendenteValor: number
  taxaConciliacao: number // %
}

function buildSummary(batches: SettlementBatch[]): ConciliacaoSummary {
  const conciliados = batches.filter((b) => b.status === 'Conciliado')
  const divergentes = batches.filter((b) => b.status === 'Divergente')
  const pendentes = batches.filter((b) => b.status === 'Pendente')
  const conciliadoValor = conciliados.reduce((s, b) => s + b.valorRecebido, 0)
  const divergenciaValor = divergentes.reduce((s, b) => s + Math.abs(b.divergencia), 0)
  const pendenteValor = pendentes.reduce((s, b) => s + b.valorLiquido, 0)
  const taxaConciliacao = batches.length ? (conciliados.length / batches.length) * 100 : 0
  return {
    conciliadoValor,
    divergencias: divergentes.length,
    divergenciaValor,
    pendenteValor,
    taxaConciliacao: +taxaConciliacao.toFixed(1),
  }
}

export const conciliacaoSummary: ConciliacaoSummary = buildSummary(settlementBatches)
