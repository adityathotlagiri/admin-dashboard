import { createContext, useContext, useState, type ReactNode } from 'react'
import type { AdminUser, Role } from '../types'
import { loginRequest } from '../data/auth'

interface AuthContextValue {
  user: AdminUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasRole: (roles: Role[]) => boolean
}

const STORAGE_KEY = 'admin_session'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as AdminUser) : null
    } catch {
      return null
    }
  })

  const login = async (email: string, password: string) => {
    const result = await loginRequest(email, password)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result.user))
    localStorage.setItem('admin_token', result.token)
    setUser(result.user)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('admin_token')
    setUser(null)
  }

  const hasRole = (roles: Role[]) => !!user && roles.includes(user.role)

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}