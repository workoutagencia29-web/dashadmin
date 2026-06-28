import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '../../lib/utils'

type ToastTone = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const toast = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = ++counter.current
    setItems((l) => [...l, { id, message, tone }])
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 2800)
  }, [])

  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-success" />,
    error: <AlertTriangle className="h-4 w-4 text-danger" />,
    info: <Info className="h-4 w-4 text-primary" />,
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[80] flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-2xl animate-fade-in',
            )}
          >
            {icons[t.tone]}
            {t.message}
            <button
              onClick={() => setItems((l) => l.filter((x) => x.id !== t.id))}
              className="ml-1 text-muted hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
