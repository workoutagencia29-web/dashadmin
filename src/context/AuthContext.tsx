import { createContext, useContext, useState, type ReactNode } from 'react'

/** Admin autenticado (mock). No app real isto vem do backend via JWT/sessão. */
export interface AdminUser {
  name: string
  email: string
  role: string
}

interface AuthContextValue {
  user: AdminUser | null
  login: (email: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = 'nummo-admin-auth'

const DEMO_USER: AdminUser = {
  name: 'Pedro Costa',
  email: 'admin@nummo.com',
  role: 'Super Admin',
}

function getInitial(): AdminUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AdminUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(getInitial)

  /** Mock: aceita qualquer credencial não-vazia (demo). */
  function login(email: string, _password: string): boolean {
    void _password
    if (!email.trim()) return false
    const u: AdminUser = { ...DEMO_USER, email: email.trim() }
    setUser(u)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    return true
  }

  function logout() {
    setUser(null)
    window.localStorage.removeItem(STORAGE_KEY)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
