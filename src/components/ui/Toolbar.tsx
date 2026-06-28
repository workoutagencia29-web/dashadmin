import { useRef, useState, type ReactNode } from 'react'
import { FileText, FileDown, FileArchive, RefreshCw } from 'lucide-react'
import { Button } from './primitives'

/** Linha de filtros: busca/selects à esquerda, ações à direita. */
export function Toolbar({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2.5">{left}</div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  )
}

/* ----------------------------- Export CSV ----------------------------- */

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const content = '﻿' + [headers, ...rows].map((r) => r.map(esc).join(',')).join('\r\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Botões de exportação: CSV baixa de verdade; PDF/OFX/ZIP mostram aviso. */
export function ExportButtons({
  formats = ['CSV'],
  onCsv,
  onRefresh,
}: {
  formats?: ('CSV' | 'PDF' | 'OFX' | 'ZIP')[]
  onCsv: () => void
  onRefresh?: () => void
}) {
  const [toast, setToast] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  function flash(msg: string) {
    setToast(msg)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2600)
  }
  function handle(fmt: string) {
    if (fmt === 'CSV') {
      onCsv()
      flash('CSV exportado')
    } else {
      flash(`Exportação em ${fmt} disponível em breve`)
    }
  }

  const icons: Record<string, ReactNode> = {
    CSV: <FileText className="h-4 w-4" />,
    PDF: <FileDown className="h-4 w-4" />,
    OFX: <FileDown className="h-4 w-4" />,
    ZIP: <FileArchive className="h-4 w-4" />,
  }

  return (
    <>
      {onRefresh && (
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      )}
      {formats.map((fmt) => (
        <Button key={fmt} variant={fmt === 'CSV' ? 'outline' : 'outline'} size="sm" onClick={() => handle(fmt)}>
          {icons[fmt]} {fmt}
        </Button>
      ))}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[70] rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-2xl animate-fade-in">
          {toast}
        </div>
      )}
    </>
  )
}
