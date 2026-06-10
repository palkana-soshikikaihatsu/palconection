import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'
import api from '../services/api'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const refreshSession = useCallback(async () => {
    if (api.isDemoMode()) {
      setUser(null)
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    try {
      const result = await api.checkSession()
      if (result.success && result.data) {
        setUser(result.data.user)
      } else {
        setUser(null)
        api.setToken(null)
      }
    } catch {
      setUser(null)
      api.setToken(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialized) {
      setInitialized(true)
      refreshSession()
    }
  }, [initialized, refreshSession])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const result = await api.login(email, password)
      if (result.success && result.data) {
        setUser(result.data.user)
        return { success: true }
      }
      return { success: false, error: result.error || 'ログインに失敗しました' }
    } catch {
      return { success: false, error: 'ログインに失敗しました' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await api.logout()
    } finally {
      setUser(null)
      setIsLoading(false)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
