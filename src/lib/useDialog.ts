import { useEffect, type RefObject } from 'react'

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Acessibilidade para Modal/Drawer:
 * - fecha no Esc
 * - trava o scroll do fundo enquanto aberto
 * - prende o foco (Tab) dentro do diálogo
 * - devolve o foco ao elemento anterior ao fechar
 */
export function useDialog(open: boolean, onClose: () => void, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const node = ref.current
    const getFocusables = () =>
      node
        ? Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null)
        : []

    // foca o primeiro elemento (ou o próprio container)
    const first = getFocusables()[0]
    ;(first ?? node)?.focus?.()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const f = getFocusables()
      if (f.length === 0) {
        e.preventDefault()
        return
      }
      const firstEl = f[0]
      const lastEl = f[f.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [open, onClose, ref])
}
