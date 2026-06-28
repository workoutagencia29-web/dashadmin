/** Gerador pseudo-aleatório determinístico (mulberry32) — render estável. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Hash de string → inteiro (para semear o RNG por chave). */
export function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Pega um item de um array de forma determinística. */
export function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)]
}

/** Inteiro em [min, max]. */
export function randInt(rnd: () => number, min: number, max: number): number {
  return Math.floor(rnd() * (max - min + 1)) + min
}
