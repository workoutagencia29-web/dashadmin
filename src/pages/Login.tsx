import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, ShieldCheck, ArrowRight, Activity, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@nummo.com')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (login(email, password)) {
      navigate('/', { replace: true })
    } else {
      setError('Informe um e-mail válido para continuar.')
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* ---- Painel esquerdo (marca) ---- */}
      <div className="relative hidden w-1/2 overflow-hidden bg-sidebar lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-[440px] w-[440px] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, #2f6bff, transparent)' }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-xl font-extrabold text-primary-foreground shadow-glow">
            N
          </div>
          <div>
            <span className="block text-xl font-bold leading-none tracking-tight text-foreground">Nummo</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Admin</span>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight text-foreground">
            O painel de controle do seu gateway de pagamentos.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Monitore transações em tempo real, aprove KYC, gerencie saques, disputas MED e roteie
            adquirentes — tudo em um só lugar.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: TrendingUp, label: 'TPV mensal', value: 'R$ 18,4 mi' },
              { icon: Activity, label: 'Aprovação', value: '92,4%' },
              { icon: ShieldCheck, label: 'Uptime', value: '99,98%' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card/60 p-4">
                <s.icon className="h-5 w-5 text-primary" />
                <p className="mt-3 text-lg font-bold leading-none text-foreground">{s.value}</p>
                <p className="mt-1 text-[11px] text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-faint">© {new Date().getFullYear()} Nummo Pagamentos · Todos os direitos reservados</p>
      </div>

      {/* ---- Painel direito (form) ---- */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-xl font-extrabold text-primary-foreground shadow-glow">
              N
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Nummo Admin</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">Entre na sua conta</h1>
          <p className="mt-1.5 text-sm text-muted">Acesso restrito à equipe administrativa.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@nummo.com"
                  className="w-full rounded-xl border border-border bg-input/60 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-faint focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground">Senha</label>
                <button type="button" className="text-xs font-medium text-primary hover:underline">
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-input/60 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-faint focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                  aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-xs font-medium text-danger">{error}</p>
            )}

            <Button type="submit" className="w-full">
              Entrar no painel
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-faint">
            Ambiente de demonstração — use qualquer e-mail e senha para acessar.
          </p>
        </div>
      </div>
    </div>
  )
}
