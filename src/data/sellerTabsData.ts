import { addDays } from '../lib/date'
import { mulberry32, hashStr, pick, randInt } from '../lib/rng'
import { sellerById, ACQUIRERS, FIRST_NAMES, LAST_NAMES } from './shared'
import type { Acquirer } from './shared'

/* ======================================================================
 * Dados extras (abas aprofundadas) do detalhe de seller — determinísticos.
 * Semeados por mulberry32(hashStr("tabs-"+id)).
 * ==================================================================== */

/* ------------------------------- MEDs -------------------------------- */

export interface MedRow {
  id: string
  customer: string
  valor: number
  motivo: string
  date: Date
  status: 'Aberta' | 'Em Análise' | 'Ganha' | 'Perdida' | 'Acatada'
}

export interface MedsData {
  totalEstornado: number
  pctEstorno: number
  lista: MedRow[]
}

/* ------------------------------ Reserva ------------------------------ */

export interface ReservaPoint {
  label: string
  retido: number
  liberado: number
}

export interface ReservaData {
  retida: number
  liberada: number
  proximaLiberacao: Date
  percentual: number
  historico: ReservaPoint[]
}

/* -------------------------------- KYC -------------------------------- */

export interface TabKycDoc {
  tipo: string
  status: 'Verificado' | 'Pendente' | 'Reprovado'
}

export interface TabKycData {
  cerberusStatus: 'Aprovado' | 'Pendente' | 'Não consultado'
  ambiente: string
  resultado: string
  docs: TabKycDoc[]
  extras: string[]
}

/* ------------------------------ Taxas -------------------------------- */

export interface TaxaMetodoRow {
  metodo: string
  entradaFixa: number
  entradaVarPct: number
  saqueFixa: number
  saqueVarPct: number
  reservaPct: number
  prazoRetencaoDias: number
}

/* --------------------------- Configurações --------------------------- */

export interface ConfigData {
  permissoes: { pix: boolean; cartao: boolean; boleto: boolean; cripto: boolean }
  depositoMax: number
  saqueMax: number
  boleto: { min: number; max: number; porMes: number; diasLiberacao: number }
  saqueAutomatico: boolean
  apiCashout: boolean
  roteamentoAtivo: boolean
}

/* --------------------------- Gestão de saldo ------------------------- */

export interface AjusteRow {
  id: string
  tipo: 'Crédito' | 'Débito' | 'Bloqueio' | 'Liberação'
  valor: number
  date: Date
  origem: string
}

export interface GestaoSaldoData {
  saldoOperacional: number
  bloqueado: number
  ultimosAjustes: AjusteRow[]
}

/* ----------------------------- Co-produção --------------------------- */

export interface CoProdutorRow {
  id: string
  email: string
  percentual: number
  date: Date
}

/* ------------------------------ Subcontas ---------------------------- */

export interface SubcontaRow {
  id: string
  nome: string
  documento: string
  saldo: number
  status: 'Ativa' | 'Suspensa' | 'Em Análise'
}

/* ----------------------------- Adquirentes --------------------------- */

export interface AdquirentesPorMetodo {
  pixIn: Acquirer
  pixOut: Acquirer
  copiaCola: Acquirer
  cartao: Acquirer
  boleto: Acquirer
}

export interface LucroAdquirenteRow {
  acquirer: string
  volume: number
  receita: number
  custo: number
  margem: number
}

/* ------------------------------- Agregado ---------------------------- */

export interface SellerTabs {
  meds: MedsData
  reserva: ReservaData
  kyc: TabKycData
  taxasPorMetodo: TaxaMetodoRow[]
  config: ConfigData
  gestaoSaldo: GestaoSaldoData
  coProdutores: CoProdutorRow[]
  subcontas: SubcontaRow[]
  adquirentesPorMetodo: AdquirentesPorMetodo
  lucroPorAdquirente: LucroAdquirenteRow[]
}

const MED_MOTIVOS = [
  'Produto não recebido',
  'Não reconhece a compra',
  'Cobrança duplicada',
  'Fraude declarada',
  'Insatisfação com produto',
  'Estorno solicitado',
]
const MED_STATUSES: MedRow['status'][] = ['Aberta', 'Em Análise', 'Ganha', 'Perdida', 'Acatada']

const KYC_DOC_TYPES = [
  'Cartão CNPJ',
  'Contrato Social',
  'Comprovante de Endereço',
  'Documento do Responsável',
  'Selfie com Documento',
  'Comprovante Bancário',
]
const KYC_DOC_STATUSES: TabKycDoc['status'][] = ['Verificado', 'Verificado', 'Pendente', 'Reprovado']
const CERBERUS_STATUSES: TabKycData['cerberusStatus'][] = ['Aprovado', 'Pendente', 'Não consultado']
const CERBERUS_AMBIENTES = ['Produção', 'Homologação']
const CERBERUS_RESULTADOS = [
  'Identidade confirmada · score 92',
  'Análise concluída sem apontamentos',
  'Aguardando retorno do bureau',
  'Documentação em validação manual',
]
const KYC_EXTRAS_POOL = [
  'PEP: não identificado',
  'Sanções OFAC: limpo',
  'Mídia adversa: nada relevante',
  'Quadro societário validado',
  'Faturamento declarado compatível',
  'Endereço confirmado via geolocalização',
]

const TAXA_METODOS = ['Pix', 'Cartão de Crédito', 'Boleto', 'Cripto'] as const

const SUBCONTA_PREFIX = ['Filial', 'Unidade', 'Loja', 'Operação', 'Conta']
const SUBCONTA_CORE = ['Centro', 'Sul', 'Norte', 'Digital', 'Express', 'Premium', 'Atacado']
const SUBCONTA_STATUSES: SubcontaRow['status'][] = ['Ativa', 'Ativa', 'Suspensa', 'Em Análise']

const AJUSTE_TIPOS: AjusteRow['tipo'][] = ['Crédito', 'Débito', 'Bloqueio', 'Liberação']
const AJUSTE_ORIGENS = [
  'Ajuste manual (operador)',
  'Reembolso processado',
  'Bloqueio por risco',
  'Liberação de reserva',
  'Conciliação adquirente',
  'Estorno de chargeback',
]

const EMAIL_DOMAINS = ['gmail.com', 'outlook.com', 'parceiro.com.br', 'hotmail.com']

function fakeDoc(rnd: () => number): string {
  return `${randInt(rnd, 10, 49)}.${randInt(rnd, 100, 999)}.${randInt(rnd, 100, 999)}/0001-${String(
    randInt(rnd, 10, 99),
  )}`
}

/** Dados das abas extras do seller, semeados pelo id (estável entre reloads). */
export function getSellerTabs(id: string): SellerTabs | null {
  const seller = sellerById(id)
  if (!seller) return null

  const rnd = mulberry32(hashStr(`tabs-${id}`))
  const base = seller.volume30d > 0 ? seller.volume30d : randInt(rnd, 18000, 120000)
  const now = new Date()

  /* ---- MEDs ---- */
  const totalEstornado = +(base * (0.004 + rnd() * 0.018)).toFixed(2)
  const pctEstorno = seller.chargebackRate > 0 ? seller.chargebackRate : +(0.3 + rnd() * 1.4).toFixed(2)
  const medCount = randInt(rnd, 4, 9)
  const meds: MedRow[] = []
  for (let i = 0; i < medCount; i++) {
    meds.push({
      id: `med_${id}_${(700 + i).toString(36)}`,
      customer: `${pick(FIRST_NAMES, rnd)} ${pick(LAST_NAMES, rnd)}`,
      valor: +(40 + rnd() * 1900).toFixed(2),
      motivo: pick(MED_MOTIVOS, rnd),
      date: new Date(now.getTime() - randInt(rnd, 30, 60 * 24 * 25) * 60000),
      status: pick(MED_STATUSES, rnd),
    })
  }
  meds.sort((a, b) => b.date.getTime() - a.date.getTime())

  /* ---- Reserva ---- */
  const percentual = randInt(rnd, 4, 12)
  const retida = +(base * (percentual / 100) * (0.7 + rnd() * 0.5)).toFixed(2)
  const liberada = +(base * (percentual / 100) * (0.4 + rnd() * 0.6)).toFixed(2)
  const historico: ReservaPoint[] = []
  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1)
    const monthLabel = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
    historico.push({
      label: monthLabel,
      retido: +(base * (percentual / 100) * (0.6 + rnd() * 0.7)).toFixed(2),
      liberado: +(base * (percentual / 100) * (0.5 + rnd() * 0.6)).toFixed(2),
    })
  }

  /* ---- KYC ---- */
  const aprovadoKyc = seller.status === 'Ativo' || seller.status === 'Suspenso'
  const cerberusStatus: TabKycData['cerberusStatus'] = aprovadoKyc
    ? 'Aprovado'
    : pick(CERBERUS_STATUSES, rnd)
  const kycDocs: TabKycDoc[] = KYC_DOC_TYPES.map((tipo) => ({
    tipo,
    status: aprovadoKyc ? 'Verificado' : pick(KYC_DOC_STATUSES, rnd),
  }))
  const extrasCount = randInt(rnd, 3, KYC_EXTRAS_POOL.length)
  const extras = [...KYC_EXTRAS_POOL].slice(0, extrasCount)
  const kyc: TabKycData = {
    cerberusStatus,
    ambiente: pick(CERBERUS_AMBIENTES, rnd),
    resultado:
      cerberusStatus === 'Aprovado'
        ? `Identidade confirmada · score ${randInt(rnd, 78, 98)}`
        : pick(CERBERUS_RESULTADOS, rnd),
    docs: kycDocs,
    extras,
  }

  /* ---- Taxas por método ---- */
  const taxasPorMetodo: TaxaMetodoRow[] = TAXA_METODOS.map((metodo) => {
    const isCard = metodo === 'Cartão de Crédito'
    return {
      metodo,
      entradaFixa: metodo === 'Pix' ? 0 : +(0.39 + rnd() * 0.6).toFixed(2),
      entradaVarPct:
        metodo === 'Pix'
          ? +(0.79 + rnd() * 0.5).toFixed(2)
          : isCard
            ? +(3.49 + rnd() * 1.1).toFixed(2)
            : +(2.29 + rnd() * 0.8).toFixed(2),
      saqueFixa: +(1.5 + rnd() * 2.5).toFixed(2),
      saqueVarPct: +(rnd() * 0.6).toFixed(2),
      reservaPct: randInt(rnd, 0, 10),
      prazoRetencaoDias: metodo === 'Pix' ? randInt(rnd, 0, 2) : isCard ? randInt(rnd, 15, 30) : randInt(rnd, 1, 5),
    }
  })

  /* ---- Configurações ---- */
  const config: ConfigData = {
    permissoes: {
      pix: true,
      cartao: rnd() > 0.15,
      boleto: rnd() > 0.3,
      cripto: rnd() > 0.6,
    },
    depositoMax: randInt(rnd, 20, 200) * 1000,
    saqueMax: randInt(rnd, 10, 100) * 1000,
    boleto: {
      min: 5 * randInt(rnd, 2, 8),
      max: randInt(rnd, 3, 20) * 1000,
      porMes: randInt(rnd, 200, 5000),
      diasLiberacao: randInt(rnd, 1, 3),
    },
    saqueAutomatico: rnd() > 0.5,
    apiCashout: rnd() > 0.4,
    roteamentoAtivo: rnd() > 0.35,
  }

  /* ---- Gestão de saldo ---- */
  const saldoOperacional = +(base * (0.05 + rnd() * 0.07)).toFixed(2)
  const bloqueado = +(base * (rnd() * 0.04)).toFixed(2)
  const ajusteCount = randInt(rnd, 4, 8)
  const ultimosAjustes: AjusteRow[] = []
  for (let i = 0; i < ajusteCount; i++) {
    ultimosAjustes.push({
      id: `adj_${id}_${(500 + i).toString(36)}`,
      tipo: pick(AJUSTE_TIPOS, rnd),
      valor: +(50 + rnd() * 8000).toFixed(2),
      date: new Date(now.getTime() - randInt(rnd, 60, 60 * 24 * 30) * 60000),
      origem: pick(AJUSTE_ORIGENS, rnd),
    })
  }
  ultimosAjustes.sort((a, b) => b.date.getTime() - a.date.getTime())

  /* ---- Co-produção ---- */
  const coCount = randInt(rnd, 0, 3)
  const coProdutores: CoProdutorRow[] = []
  for (let i = 0; i < coCount; i++) {
    const nome = `${pick(FIRST_NAMES, rnd)} ${pick(LAST_NAMES, rnd)}`
    const handle = nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '.')
    coProdutores.push({
      id: `cop_${id}_${(300 + i).toString(36)}`,
      email: `${handle}@${pick(EMAIL_DOMAINS, rnd)}`,
      percentual: randInt(rnd, 5, 40),
      date: addDays(now, -randInt(rnd, 10, 400)),
    })
  }

  /* ---- Subcontas ---- */
  const subCount = randInt(rnd, 0, 4)
  const subcontas: SubcontaRow[] = []
  for (let i = 0; i < subCount; i++) {
    subcontas.push({
      id: `sub_${id}_${(100 + i).toString(36)}`,
      nome: `${pick(SUBCONTA_PREFIX, rnd)} ${pick(SUBCONTA_CORE, rnd)}`,
      documento: fakeDoc(rnd),
      saldo: +(base * (0.01 + rnd() * 0.06)).toFixed(2),
      status: pick(SUBCONTA_STATUSES, rnd),
    })
  }

  /* ---- Adquirentes por método ---- */
  const adquirentesPorMetodo: AdquirentesPorMetodo = {
    pixIn: pick([...ACQUIRERS], rnd),
    pixOut: pick([...ACQUIRERS], rnd),
    copiaCola: pick([...ACQUIRERS], rnd),
    cartao: pick([...ACQUIRERS], rnd),
    boleto: pick([...ACQUIRERS], rnd),
  }

  /* ---- Lucro por adquirente ---- */
  const lucroPorAdquirente: LucroAdquirenteRow[] = ACQUIRERS.map((acquirer) => {
    const volume = +(base * (0.1 + rnd() * 0.4)).toFixed(2)
    const receita = +(volume * (0.018 + rnd() * 0.022)).toFixed(2)
    const custo = +(receita * (0.35 + rnd() * 0.35)).toFixed(2)
    const margem = receita > 0 ? +(((receita - custo) / receita) * 100).toFixed(1) : 0
    return { acquirer, volume, receita, custo, margem }
  }).sort((a, b) => b.volume - a.volume)

  return {
    meds: { totalEstornado, pctEstorno, lista: meds },
    reserva: { retida, liberada, proximaLiberacao: addDays(now, randInt(rnd, 3, 21)), percentual, historico },
    kyc,
    taxasPorMetodo,
    config,
    gestaoSaldo: { saldoOperacional, bloqueado, ultimosAjustes },
    coProdutores,
    subcontas,
    adquirentesPorMetodo,
    lucroPorAdquirente,
  }
}
