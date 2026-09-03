/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import {
  getCurrentUser,
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  quickSwitchRole,
  type User,
  type UserRole,
} from "@/lib/data"

interface AuthContextType {
  user: User | null
  role: UserRole | "visitante"
  isAuthenticated: boolean
  isAdmin: boolean
  isClient: boolean
  isGuest: boolean
  login: (correo: string, passwordHash: string) => Promise<User>
  register: (nombre: string, correo: string, passwordHash: string) => Promise<User>
  logout: () => Promise<void>
  switchRole: (targetRole: UserRole | "visitante") => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(() => getCurrentUser())

  React.useEffect(() => {
    const handleAuthChange = () => {
      setUser(getCurrentUser())
    }
    window.addEventListener("canchas-auth-changed", handleAuthChange)
    return () => {
      window.removeEventListener("canchas-auth-changed", handleAuthChange)
    }
  }, [])

  const login = React.useCallback(async (correo: string, pass: string) => {
    const logged = await authLogin(correo, pass)
    setUser(logged)
    return logged
  }, [])

  const register = React.useCallback(async (nombre: string, correo: string, pass: string) => {
    const created = await authRegister(nombre, correo, pass, "cliente")
    setUser(created)
    return created
  }, [])

  const logout = React.useCallback(async () => {
    await authLogout()
    setUser(null)
  }, [])

  const switchRole = React.useCallback((targetRole: UserRole | "visitante") => {
    const nextUser = quickSwitchRole(targetRole)
    setUser(nextUser)
  }, [])

  const role: UserRole | "visitante" = user ? user.rol : "visitante"
  const isAuthenticated = !!user
  const isAdmin = user?.rol === "admin"
  const isClient = user?.rol === "cliente"
  const isGuest = !user

  const value = React.useMemo(
    () => ({
      user,
      role,
      isAuthenticated,
      isAdmin,
      isClient,
      isGuest,
      login,
      register,
      logout,
      switchRole,
    }),
    [user, role, isAuthenticated, isAdmin, isClient, isGuest, login, register, logout, switchRole]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
