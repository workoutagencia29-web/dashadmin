import { addDays } from '../lib/date'
import { mulberry32, hashStr, pick, randInt } from '../lib/rng'
import { ACQUIRERS } from './shared'

/* --------------------------- Planos de taxa --------------------------- */

export interface FeePlan {
  id: string
  nome: string
  pixPct: number
  cartaoPct: number
  boletoPct: number
  antecipacaoPct: number
  saqueFixo: number
  sellers: number
  default?: boolean
}

export const feePlans: FeePlan[] = [
  {
    id: 'plan_padrao',
    nome: 'Padrão',
    pixPct: 0.99,
    cartaoPct: 3.99,
    boletoPct: 2.99,
    antecipacaoPct: 2.49,
    saqueFixo: 3.67,
    sellers: 184,
    default: true,
  },
  {
    id: 'plan_pro',
    nome: 'Pro',
    pixPct: 0.79,
    cartaoPct: 3.49,
    boletoPct: 2.49,
    antecipacaoPct: 1.99,
    saqueFixo: 1.99,
    sellers: 62,
  },
  {
    id: 'plan_enterprise',
    nome: 'Enterprise',
    pixPct: 0.49,
    cartaoPct: 2.79,
    boletoPct: 1.99,
    antecipacaoPct: 1.49,
    saqueFixo: 0,
    sellers: 11,
  },
  {
    id: 'plan_custom',
    nome: 'Personalizado',
    pixPct: 0.69,
    cartaoPct: 3.19,
    boletoPct: 2.29,
    antecipacaoPct: 1.79,
    saqueFixo: 0.99,
    sellers: 7,
  },
]

/* ---------------------- Adquirentes & roteamento ---------------------- */

export interface AcquirerConfig {
  id: string
  nome: string
  ativo: boolean
  peso: number // 0..100
  aprovacao: number // %
  custo: number // %
  latenciaMs: number
  prioridade: number
}

function buildAcquirers(): AcquirerConfig[] {
  const rnd = mulberry32(hashStr('adquirentes-nummo'))
  return ACQUIRERS.map((nome, i) => {
    const aprovacao = +(83 + rnd() * 13).toFixed(1)
    const custo = +(2.1 + rnd() * 1.6).toFixed(2)
    return {
      id: `acq_${nome.toLowerCase().replace(/[^a-z]/g, '')}`,
      nome,
      ativo: i < 4,
      peso: 0,
      aprovacao,
      custo,
      latenciaMs: randInt(rnd, 180, 720),
      prioridade: i + 1,
    }
  })
}

const acquirersBase = buildAcquirers()
// Distribui peso proporcional à aprovação entre os ativos (soma 100).
const totalAprovAtivos = acquirersBase
  .filter((a) => a.ativo)
  .reduce((s, a) => s + a.aprovacao, 0)
export const acquirers: AcquirerConfig[] = acquirersBase
  .map((a) => ({
    ...a,
    peso: a.ativo ? Math.round((a.aprovacao / totalAprovAtivos) * 100) : 0,
  }))
  .sort((a, b) => a.prioridade - b.prioridade)

/* ------------------------ Métodos de pagamento ------------------------ */

export interface PaymentMethodConfig {
  id: string
  nome: string
  ativo: boolean
  descricao: string
  prazoLiquidacao: string
  limiteMin: number
  limiteMax: number
  parcelasMax?: number
}

export const paymentMethods: PaymentMethodConfig[] = [
  {
    id: 'pm_pix',
    nome: 'Pix',
    ativo: true,
    descricao: 'Liquidação instantânea via SPI do Banco Central.',
    prazoLiquidacao: 'Instantâneo (D+0)',
    limiteMin: 1,
    limiteMax: 50000,
  },
  {
    id: 'pm_credito',
    nome: 'Cartão de Crédito',
    ativo: true,
    descricao: 'Bandeiras Visa, Mastercard, Elo, Amex e Hipercard.',
    prazoLiquidacao: 'D+30 (ou antecipável)',
    limiteMin: 5,
    limiteMax: 100000,
    parcelasMax: 12,
  },
  {
    id: 'pm_debito',
    nome: 'Cartão de Débito',
    ativo: true,
    descricao: 'Débito à vista com autenticação 3DS.',
    prazoLiquidacao: 'D+1',
    limiteMin: 5,
    limiteMax: 30000,
  },
  {
    id: 'pm_boleto',
    nome: 'Boleto',
    ativo: false,
    descricao: 'Boleto registrado com compensação bancária.',
    prazoLiquidacao: 'D+2 (após pagamento)',
    limiteMin: 10,
    limiteMax: 20000,
  },
]

/* ------------------------------ Webhooks ------------------------------ */

export interface WebhookEndpoint {
  id: string
  url: string
  eventos: string[]
  ativo: boolean
  ultimoStatus: number
  ultimoEnvio: Date
}

const WEBHOOK_EVENT_NAMES = [
  'payment.approved',
  'payment.refused',
  'payment.refunded',
  'payout.completed',
  'chargeback.opened',
  'subscription.canceled',
]

export const webhookEndpoints: WebhookEndpoint[] = (() => {
  const rnd = mulberry32(hashStr('webhook-endpoints-nummo'))
  const now = new Date()
  const defs: Array<{ url: string; eventos: string[]; ativo: boolean; status: number }> = [
    {
      url: 'https://api.lojaprime.com/hooks/nummo',
      eventos: ['payment.approved', 'payment.refused', 'payment.refunded'],
      ativo: true,
      status: 200,
    },
    {
      url: 'https://erp.cloudsaas.com.br/webhooks/payments',
      eventos: ['payment.approved', 'payout.completed', 'subscription.canceled'],
      ativo: true,
      status: 200,
    },
    {
      url: 'https://hooks.traderacademy.com/nummo-events',
      eventos: ['payment.approved', 'chargeback.opened'],
      ativo: false,
      status: 500,
    },
  ]
  return defs.map((d, i) => ({
    id: `wh_${(100 + i).toString(36)}`,
    url: d.url,
    eventos: d.eventos,
    ativo: d.ativo,
    ultimoStatus: d.status,
    ultimoEnvio: new Date(now.getTime() - randInt(rnd, 2, 600) * 60000),
  }))
})()

export interface WebhookEvent {
  id: string
  evento: string
  status: number
  tentativas: number
  date: Date
}

function buildWebhookEvents(n: number): WebhookEvent[] {
  const rnd = mulberry32(hashStr('webhook-events-nummo'))
  const now = new Date()
  const statusPool = [200, 200, 200, 200, 200, 201, 400, 500, 503]
  const out: WebhookEvent[] = []
  for (let i = 0; i < n; i++) {
    const status = pick(statusPool, rnd)
    const ok = status < 300
    out.push({
      id: `whe_${(5000 + i).toString(36)}`,
      evento: pick(WEBHOOK_EVENT_NAMES, rnd),
      status,
      tentativas: ok ? 1 : randInt(rnd, 2, 5),
      date: new Date(now.getTime() - randInt(rnd, 1, 60 * 24 * 4) * 60000),
    })
  }
  return out.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export const webhookEvents = buildWebhookEvents(18)

/* ------------------------------ Chaves de API ------------------------------ */

export interface ApiKey {
  id: string
  nome: string
  prefixo: string
  ambiente: 'Produção' | 'Sandbox'
  criadaEm: Date
  ultimoUso: Date
}

export const apiKeys: ApiKey[] = (() => {
  const rnd = mulberry32(hashStr('apikeys-nummo'))
  const now = new Date()
  const defs: Array<{ nome: string; prefixo: string; ambiente: ApiKey['ambiente']; idadeDias: number }> = [
    { nome: 'Servidor de produção', prefixo: 'sk_live', ambiente: 'Produção', idadeDias: 420 },
    { nome: 'Checkout web', prefixo: 'pk_live', ambiente: 'Produção', idadeDias: 188 },
    { nome: 'Integração sandbox', prefixo: 'sk_test', ambiente: 'Sandbox', idadeDias: 64 },
    { nome: 'App mobile (homolog.)', prefixo: 'pk_test', ambiente: 'Sandbox', idadeDias: 31 },
  ]
  return defs.map((d, i) => ({
    id: `key_${(900 + i).toString(36)}`,
    nome: d.nome,
    prefixo: d.prefixo,
    ambiente: d.ambiente,
    criadaEm: addDays(now, -d.idadeDias),
    ultimoUso: new Date(now.getTime() - randInt(rnd, 1, 60 * 24 * 3) * 60000),
  }))
})()
