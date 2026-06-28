import { useState, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

/** Fallback enquanto o chunk da rota carrega (code-splitting). */
function PageLoader() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted" />
    </div>
  )
}

/** Contexto passado às páginas via <Outlet> (ex: abrir o menu no mobile). */
export interface LayoutContext {
  onOpenMobile: () => void
}

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  // chave por seção (1º segmento da URL) — troca de seção dispara o fade
  const section = '/' + (pathname.split('/')[1] ?? '')

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="scrollbar-thin relative flex-1 overflow-y-auto overscroll-none">
          <div key={section} className="page-fade mx-auto max-w-[1360px] px-5 py-6 sm:px-8 sm:py-8">
            <Suspense fallback={<PageLoader />}>
              <Outlet context={{ onOpenMobile: () => setMobileOpen(true) } as LayoutContext} />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
