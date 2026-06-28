import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/** Captura erros de render e mostra um fallback amigável em vez de tela branca. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // ponto de integração para um serviço de monitoramento (ex.: Sentry)
    console.error('ErrorBoundary capturou um erro:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card text-danger">
            <AlertTriangle className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-foreground">Algo deu errado</h1>
          <p className="mt-2 max-w-md text-sm text-muted">
            Ocorreu um erro inesperado nesta tela. Você pode recarregar o painel para continuar.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" /> Recarregar painel
          </button>
          {import.meta.env.DEV && (
            <pre className="mt-6 max-w-2xl overflow-auto rounded-xl border border-border bg-card p-4 text-left text-xs text-muted">
              {this.state.error.message}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
