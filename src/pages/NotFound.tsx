import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '../components/ui'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card text-muted">
        <Compass className="h-7 w-7" />
      </span>
      <h1 className="mt-5 text-2xl font-bold text-foreground">Página não encontrada</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        O endereço que você tentou acessar não existe ou foi movido.
      </p>
      <Link to="/" className="mt-6">
        <Button>Voltar ao início</Button>
      </Link>
    </div>
  )
}
