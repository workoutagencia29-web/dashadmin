/** Join truthy class names. Tiny local replacement for `clsx`. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

/** Formata um número com separador de milhar pt-BR (ex: 3540 -> "3.540"). */
export function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR')
}

/** Formata um valor monetário em Reais (ex: 500 -> "R$ 500,00"). */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Número curto APENAS para rótulos de eixo de gráfico (escala visual).
 * Os valores reais aparecem por extenso nos cards, tabelas e tooltips.
 */
export function formatCompact(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', ',')} mi`
  if (abs >= 1_000) return `${Math.round(value / 1_000)} mil`
  return formatNumber(value)
}

/** Porcentagem pt-BR (ex: 4.13 -> "4,13%"). */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals).replace('.', ',')}%`
}

/** "+3,2%" / "−1,4%" — sinal explícito. */
export function formatDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '−'
  return `${sign}${Math.abs(delta).toFixed(1).replace('.', ',')}%`
}

/** Iniciais a partir de um nome ("Pedro Costa" -> "PC"). */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}
