import seedData from "@/data/db.json"
import type { DatabaseSchema } from "./types"

/**
 * SIMULACIÓN DE PERSISTENCIA (Sin backend real)
 * ============================================
 * Esta capa emula una base de datos y servidor API REST.
 * En un proyecto con backend real:
 * - Esta capa se reemplazaría por llamadas HTTP (fetch/axios) a endpoints como /api/canchas, /api/reservas.
 * - Los datos se persistirían en PostgreSQL/MySQL/MongoDB en vez de localStorage.
 * - La autenticación utilizaría JWT o sesiones seguras vía cookies HTTP-only.
 */

const STORAGE_KEY = "canchas_db_v1"

// Simulación de latencia de red opcional
export async function simulateLatency(ms: number = 80): Promise<void> {
  if (ms <= 0) return
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Obtiene la copia completa de la base de datos simulada.
 * Si no existe en localStorage, inicializa con db.json seed.
 */
export function getRawDb(): DatabaseSchema {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const initial = seedData as DatabaseSchema
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
      return initial
    }
    return JSON.parse(raw) as DatabaseSchema
  } catch (error) {
    console.error("Error al leer datos de localStorage, restaurando seed:", error)
    const initial = seedData as DatabaseSchema
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
    return initial
  }
}

/**
 * Guarda el estado en localStorage
 */
export function saveRawDb(data: DatabaseSchema): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    // Despachamos evento personalizado para sincronizar pestañas o listeners en vivo
    window.dispatchEvent(new Event("canchas-db-updated"))
  } catch (error) {
    console.error("Error guardando datos en localStorage:", error)
  }
}

/**
 * Restablece la base de datos al estado inicial de db.json
 * y limpia personalizaciones de localStorage
 */
export async function resetToSeedData(): Promise<DatabaseSchema> {
  await simulateLatency(150)
  const initial = seedData as DatabaseSchema
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
  window.dispatchEvent(new Event("canchas-db-updated"))
  return initial
}
