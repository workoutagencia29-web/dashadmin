/* DRE gerencial completo do gateway (Demonstração do Resultado do Exercício).
   Estrutura contábil em cascata, com período atual vs. anterior, AV% e AH%.
   Tudo determinístico (sem Math.random) — render estável. */

import { mulberry32, hashStr } from '../lib/rng'

const rnd = mulberry32(hashStr('dre-nummo-2026-06'))

/* ----------------- Linhas-base do período (R$, com sinal) ----------------- */

type Lines = Record<string, number>

const cur: Lines = {
  // Receita operacional bruta (+)
  adquirencia: 1_643_287.4,
  antecipacao: 317_940.18,
  tarifasSaque: 96_182.5,
  banking: 63_870.94,
  servicos: 231_455.6, // antifraude, KYC, webhooks, API premium
  // Deduções da receita (−)
  impostos: -208_641.3, // ISS + PIS + COFINS
  estornos: -57_912.75, // estornos & chargebacks
  // Custos dos serviços prestados (−)
  custoAdq: -736_118.2, // interchange + bandeira + custo adquirente
  custoProc: -183_647.5, // processamento & infraestrutura (BaaS/cloud)
  custoAntifraude: -97_236.4, // antifraude & terceiros
  // Despesas operacionais (−)
  despComercial: -213_184.6,
  despAdmin: -147_958.3,
  despPessoal: -286_347.9,
  despTech: -131_426.7,
  provisao: -65_312.85, // provisão p/ perdas (chargeback/inadimplência)
  // Depreciação & amortização (−)
  da: -39_241.6,
  // Resultado financeiro (±)
  recFin: 113_576.4, // rendimento de caixa/float
  despFin: -27_938.2,
}

// Período anterior: cada linha varia de forma determinística (~0,90–1,06).
const prevLines: Lines = Object.fromEntries(
  Object.entries(cur).map(([k, v]) => [k, Math.round(v * (0.9 + rnd() * 0.16))]),
)

/* ---------------------------- Cascata do resultado ---------------------------- */

interface Cascade {
  receitaBruta: number
  deducoes: number
  receitaLiquida: number
  csp: number
  lucroBruto: number
  despesas: number
  ebitda: number
  da: number
  ebit: number
  resFin: number
  lair: number
  irCsll: number
  lucroLiquido: number
}

function buildCascade(l: Lines): Cascade {
  const receitaBruta = l.adquirencia + l.antecipacao + l.tarifasSaque + l.banking + l.servicos
  const deducoes = l.impostos + l.estornos
  const receitaLiquida = receitaBruta + deducoes
  const csp = l.custoAdq + l.custoProc + l.custoAntifraude
  const lucroBruto = receitaLiquida + csp
  const despesas = l.despComercial + l.despAdmin + l.despPessoal + l.despTech + l.provisao
  const ebitda = lucroBruto + despesas
  const ebit = ebitda + l.da
  const resFin = l.recFin + l.despFin
  const lair = ebit + resFin
  const irCsll = -Math.round(lair * 0.34) // IR (25%) + CSLL (9%)
  const lucroLiquido = lair + irCsll
  return { receitaBruta, deducoes, receitaLiquida, csp, lucroBruto, despesas, ebitda, da: l.da, ebit, resFin, lair, irCsll, lucroLiquido }
}

const C = buildCascade(cur)
const P = buildCascade(prevLines)

/* ------------------------------- Linhas da DRE ------------------------------- */

export type DreKind = 'group' | 'line' | 'subtotal' | 'total'

export interface DreRow {
  label: string
  value: number
  prev: number
  kind: DreKind
  /** Linha de detalhe (recuada) dentro de um grupo. */
  indent?: boolean
  /** Destaque de resultado (subtotais/total). */
  result?: boolean
}

const pct = (v: number, base: number) => (base ? (v / base) * 100 : 0)
const ah = (v: number, p: number) => (p ? ((v - p) / Math.abs(p)) * 100 : 0)

function row(label: string, value: number, prev: number, kind: DreKind, opts: { indent?: boolean; result?: boolean } = {}): DreRow {
  return { label, value, prev, kind, ...opts }
}

export const dreRows: DreRow[] = [
  row('Receita Operacional Bruta', C.receitaBruta, P.receitaBruta, 'group'),
  row('Adquirência (MDR)', cur.adquirencia, prevLines.adquirencia, 'line', { indent: true }),
  row('Antecipação de recebíveis', cur.antecipacao, prevLines.antecipacao, 'line', { indent: true }),
  row('Tarifas de saque & transferência', cur.tarifasSaque, prevLines.tarifasSaque, 'line', { indent: true }),
  row('Conta digital (banking)', cur.banking, prevLines.banking, 'line', { indent: true }),
  row('Serviços & extensões', cur.servicos, prevLines.servicos, 'line', { indent: true }),

  row('(−) Deduções da Receita', C.deducoes, P.deducoes, 'group'),
  row('Impostos sobre serviços (ISS/PIS/COFINS)', cur.impostos, prevLines.impostos, 'line', { indent: true }),
  row('Estornos & chargebacks', cur.estornos, prevLines.estornos, 'line', { indent: true }),

  row('(=) Receita Operacional Líquida', C.receitaLiquida, P.receitaLiquida, 'subtotal'),

  row('(−) Custos dos Serviços Prestados', C.csp, P.csp, 'group'),
  row('Custo de adquirência (interchange + bandeira)', cur.custoAdq, prevLines.custoAdq, 'line', { indent: true }),
  row('Processamento & infraestrutura', cur.custoProc, prevLines.custoProc, 'line', { indent: true }),
  row('Antifraude & terceiros', cur.custoAntifraude, prevLines.custoAntifraude, 'line', { indent: true }),

  row('(=) Lucro Bruto', C.lucroBruto, P.lucroBruto, 'subtotal', { result: true }),

  row('(−) Despesas Operacionais', C.despesas, P.despesas, 'group'),
  row('Comerciais & marketing', cur.despComercial, prevLines.despComercial, 'line', { indent: true }),
  row('Administrativas (G&A)', cur.despAdmin, prevLines.despAdmin, 'line', { indent: true }),
  row('Pessoal & encargos', cur.despPessoal, prevLines.despPessoal, 'line', { indent: true }),
  row('Tecnologia & P&D', cur.despTech, prevLines.despTech, 'line', { indent: true }),
  row('Provisão para perdas', cur.provisao, prevLines.provisao, 'line', { indent: true }),

  row('(=) EBITDA', C.ebitda, P.ebitda, 'subtotal', { result: true }),

  row('(−) Depreciação & Amortização', cur.da, prevLines.da, 'line'),
  row('(=) EBIT — Resultado Operacional', C.ebit, P.ebit, 'subtotal'),

  row('(±) Resultado Financeiro', C.resFin, P.resFin, 'group'),
  row('Receitas financeiras (rendimento de caixa)', cur.recFin, prevLines.recFin, 'line', { indent: true }),
  row('Despesas financeiras', cur.despFin, prevLines.despFin, 'line', { indent: true }),

  row('(=) Resultado antes do IR (LAIR)', C.lair, P.lair, 'subtotal'),
  row('(−) IR & CSLL', C.irCsll, P.irCsll, 'line'),

  row('(=) Lucro Líquido do Exercício', C.lucroLiquido, P.lucroLiquido, 'total', { result: true }),
]

/** AV% (vertical, sobre a Receita Bruta) e AH% (variação vs. período anterior) por linha. */
export function dreAV(value: number): number {
  return pct(value, C.receitaBruta)
}
export function dreAH(value: number, prev: number): number {
  return ah(value, prev)
}

/* ------------------------------- Indicadores ------------------------------- */

export const dre = {
  periodo: 'Junho/2026',
  receitaBruta: C.receitaBruta,
  receitaLiquida: C.receitaLiquida,
  lucroBruto: C.lucroBruto,
  ebitda: C.ebitda,
  ebit: C.ebit,
  lucroLiquido: C.lucroLiquido,
  margemBruta: pct(C.lucroBruto, C.receitaLiquida),
  margemEbitda: pct(C.ebitda, C.receitaLiquida),
  margemOperacional: pct(C.ebit, C.receitaLiquida),
  margemLiquida: pct(C.lucroLiquido, C.receitaLiquida),
  deltaReceitaBruta: ah(C.receitaBruta, P.receitaBruta),
  deltaReceitaLiquida: ah(C.receitaLiquida, P.receitaLiquida),
  deltaLucroBruto: ah(C.lucroBruto, P.lucroBruto),
  deltaEbitda: ah(C.ebitda, P.ebitda),
  deltaLucroLiquido: ah(C.lucroLiquido, P.lucroLiquido),
}

/* ------------------------------- Cascata (chart) ------------------------------- */

export const dreWaterfall = [
  { label: 'Receita Bruta', delta: C.receitaBruta, total: true },
  { label: 'Deduções', delta: C.deducoes },
  { label: 'Custos', delta: C.csp },
  { label: 'Despesas', delta: C.despesas },
  { label: 'D&A', delta: C.da },
  { label: 'Result. Fin.', delta: C.resFin },
  { label: 'IR/CSLL', delta: C.irCsll },
  { label: 'Lucro Líq.', delta: C.lucroLiquido, total: true },
]

/* --------------------------- Composição da receita --------------------------- */

export const dreComposicao = [
  { label: 'Adquirência', value: cur.adquirencia, color: '#2f6bff' },
  { label: 'Antecipação', value: cur.antecipacao, color: '#8b5cf6' },
  { label: 'Serviços & extensões', value: cur.servicos, color: '#10b981' },
  { label: 'Banking & tarifas', value: cur.banking + cur.tarifasSaque, color: '#f5c043' },
]

/* ----------------------------- Evolução das margens ----------------------------- */

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']

export const margemTrend = MESES.map((m, i) => {
  const t = i / (MESES.length - 1)
  return {
    label: m,
    Bruta: +(48 + t * (dre.margemBruta - 48) + (rnd() - 0.5) * 1.6).toFixed(1),
    EBITDA: +(9.4 + t * (dre.margemEbitda - 9.4) + (rnd() - 0.5) * 1.1).toFixed(1),
    Líquida: +(6.6 + t * (dre.margemLiquida - 6.6) + (rnd() - 0.5) * 0.9).toFixed(1),
  }
})
