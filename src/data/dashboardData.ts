import { startOfDay, addDays } from '../lib/date'
import { mulberry32 } from '../lib/rng'
import { sellers } from './shared'

/* --------------------------- Série de TPV ----------------------------- */

export interface TpvPoint {
  date: Date
  label: string
  tpv: number // volume transacionado (R$)
  liquido: number // receita de taxas da plataforma (R$)
}

function buildTpv(days: number): TpvPoint[] {
  const rnd = mulberry32(20260627)
  const today = startOfDay(new Date())
  const start = addDays(today, -(days - 1))
  const out: TpvPoint[] = []
  for (let d = 0; d < days; d++) {
    const day = addDays(start, d)
    const weekend = day.getDay() === 0 || day.getDay() === 6 ? 0.7 : 1
    const trend = 1 + 0.25 * Math.sin(d / 9) + 0.1 * Math.sin(d / 3)
    const base = 520000 * trend * weekend * (0.85 + 0.3 * rnd())
    const tpv = Math.round(base)
    out.push({
      date: day,
      label: `${String(day.getDate()).padStart(2, '0')}/${String(day.getMonth() + 1).padStart(2, '0')}`,
      tpv,
      liquido: Math.round(tpv * (0.039 + 0.004 * rnd())),
    })
  }
  return out
}

export const tpv30 = buildTpv(30)

/* ------------------------------- KPIs --------------------------------- */

export interface Kpi {
  id: string
  label: string
  value: number
  delta: number
  format: 'currency' | 'currencyCompact' | 'number' | 'percent'
  invert?: boolean
  hint?: string
}

export const kpis: Kpi[] = [
  { id: 'tpv', label: 'TPV (30 dias)', value: 18437614.82, delta: 12.4, format: 'currencyCompact', hint: 'Volume total processado' },
  { id: 'receita', label: 'Receita de taxas', value: 743182.47, delta: 9.8, format: 'currencyCompact', hint: 'MDR + tarifas no período' },
  { id: 'transacoes', label: 'Transações', value: 84137, delta: 6.1, format: 'number', hint: 'Tentativas de pagamento' },
  { id: 'aprovacao', label: 'Taxa de aprovação', value: 92.4, delta: 1.3, format: 'percent', hint: 'Pagas / tentadas' },
  { id: 'chargeback', label: 'Chargeback', value: 0.78, delta: -0.21, format: 'percent', invert: true, hint: 'Sobre volume aprovado' },
  { id: 'sellers', label: 'Sellers ativos', value: 1297, delta: 4.7, format: 'number', hint: 'Lojas transacionando' },
  { id: 'saques', label: 'Saques pendentes', value: 343186.9, delta: 18.2, format: 'currencyCompact', invert: true, hint: 'Aguardando aprovação' },
  { id: 'ticket', label: 'Ticket médio', value: 221.37, delta: 2.4, format: 'currency', hint: 'Por transação aprovada' },
]

/* ----------------------- Mix por método de pgto ----------------------- */

export interface MethodMix {
  label: string
  value: number // % do volume
  color: string
  amount: number
  approval: number
}

export const methodMix: MethodMix[] = [
  { label: 'Pix', value: 54, color: '#2f6bff', amount: 9958142.6, approval: 99.1 },
  { label: 'Cartão de Crédito', value: 33, color: '#8b5cf6', amount: 6079318.4, approval: 87.3 },
  { label: 'Boleto', value: 9, color: '#f5c043', amount: 1661205.9, approval: 71.5 },
  { label: 'Débito', value: 4, color: '#2dd4bf', amount: 738947.12, approval: 90.2 },
]

/* ----------------------------- Funil ---------------------------------- */

export interface FunnelStep {
  label: string
  value: number
  pct: number
}

export const approvalFunnel: FunnelStep[] = [
  { label: 'Tentativas', value: 84137, pct: 100 },
  { label: 'Autorizadas', value: 79388, pct: 94.4 },
  { label: 'Capturadas', value: 77692, pct: 92.3 },
  { label: 'Liquidadas', value: 76981, pct: 91.5 },
]

/* ------------------------ Top sellers (volume) ------------------------ */

export const topSellers = [...sellers]
  .filter((s) => s.volume30d > 0)
  .sort((a, b) => b.volume30d - a.volume30d)
  .slice(0, 6)

/* ----------------------------- Alertas -------------------------------- */

export interface Alert {
  id: string
  tone: 'danger' | 'warning' | 'info'
  title: string
  description: string
  ago: string
}

export const alerts: Alert[] = [
  { id: 'a1', tone: 'danger', title: 'Chargeback acima do limite', description: 'Pet Shop Express atingiu 5,41% de chargeback (limite 2%).', ago: 'há 12 min' },
  { id: 'a2', tone: 'warning', title: '4 KYCs aguardando análise', description: 'Documentos enviados há mais de 24h sem revisão.', ago: 'há 1 h' },
  { id: 'a3', tone: 'warning', title: 'Pico de recusas no Cartão', description: 'Adquirente Rede com queda de 6pp na aprovação na última hora.', ago: 'há 2 h' },
  { id: 'a4', tone: 'info', title: 'Saque de alto valor', description: 'CloudSaaS BR solicitou saque de R$ 178.940,00.', ago: 'há 3 h' },
]
