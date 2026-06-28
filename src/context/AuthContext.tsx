import { createContext, useContext, type ReactNode } from 'react'

/** Admin "logado" (mock fixo — sem tela de login). No app real virá do backend. */
export interface AdminUser {
  name: string
  email: string
  role: string
}

const ADMIN: AdminUser = {
  name: 'Pedro Costa',
  email: 'admin@nummo.com',
  role: 'Super Admin',
}

interface AuthContextValue {
  user: AdminUser
}

const AuthContext = createContext<AuthContextValue>({ user: ADMIN })

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={{ user: ADMIN }}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
