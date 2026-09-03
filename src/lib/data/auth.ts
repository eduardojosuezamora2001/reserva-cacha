import { getRawDb, saveRawDb, simulateLatency } from "./db"
import type { User, UserRole } from "./types"

const AUTH_USER_KEY = "canchas_current_user"

/**
 * SERVICIO DE AUTENTICACIÓN SIMULADA
 * ===================================
 * Simula inicio de sesión y registro contra los usuarios de db.json / localStorage.
 * Permite cambiar entre roles fácilmente para pruebas.
 */

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(AUTH_USER_KEY)
  }
  window.dispatchEvent(new Event("canchas-auth-changed"))
}

export async function login(correo: string, passwordHash: string): Promise<User> {
  await simulateLatency()
  const db = getRawDb()
  const user = db.users.find(
    (u) => u.correo.toLowerCase() === correo.trim().toLowerCase()
  )

  if (!user) {
    throw new Error("No existe ningún usuario registrado con este correo electrónico.")
  }

  // Comprobación de contraseña simulada
  if (user.passwordHash && user.passwordHash !== passwordHash) {
    throw new Error("Contraseña incorrecta.")
  }

  setCurrentUser(user)
  return user
}

export async function register(
  nombre: string,
  correo: string,
  passwordHash: string,
  rol: UserRole = "cliente"
): Promise<User> {
  await simulateLatency()
  const db = getRawDb()

  const existing = db.users.find(
    (u) => u.correo.toLowerCase() === correo.trim().toLowerCase()
  )
  if (existing) {
    throw new Error("Ya existe una cuenta con este correo electrónico.")
  }

  const newUser: User = {
    id: `u-${Date.now()}`,
    nombre: nombre.trim(),
    correo: correo.trim().toLowerCase(),
    passwordHash,
    rol,
    createdAt: new Date().toISOString(),
  }

  db.users.push(newUser)
  saveRawDb(db)
  setCurrentUser(newUser)
  return newUser
}

export async function logout(): Promise<void> {
  await simulateLatency(50)
  setCurrentUser(null)
}

/**
 * Utilidad rápida para pruebas: cambia instantáneamente el usuario activo
 * entre 'admin', 'cliente' o 'visitante' (null).
 */
export function quickSwitchRole(targetRole: UserRole | "visitante"): User | null {
  const db = getRawDb()
  if (targetRole === "visitante") {
    setCurrentUser(null)
    return null
  }

  const user = db.users.find((u) => u.rol === targetRole)
  if (user) {
    setCurrentUser(user)
    return user
  }

  return null
}
