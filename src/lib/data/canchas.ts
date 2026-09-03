import { getRawDb, saveRawDb, simulateLatency } from "./db"
import type { Cancha, CreateCanchaInput, UpdateCanchaInput } from "./types"

/**
 * SERVICIO DE CANCHAS (Simulación API/DB)
 * =======================================
 */

export async function getCanchas(onlyActive: boolean = false): Promise<Cancha[]> {
  await simulateLatency()
  const db = getRawDb()
  if (onlyActive) {
    return db.canchas.filter((c) => c.activa)
  }
  return db.canchas
}

export async function getCanchaById(id: string): Promise<Cancha | null> {
  await simulateLatency()
  const db = getRawDb()
  const cancha = db.canchas.find((c) => c.id === id)
  return cancha || null
}

export async function createCancha(input: CreateCanchaInput): Promise<Cancha> {
  await simulateLatency()
  const db = getRawDb()

  const newCancha: Cancha = {
    id: `cancha-${Date.now()}`,
    nombre: input.nombre,
    descripcion: input.descripcion || "",
    direccion: input.direccion,
    lat: input.lat,
    lng: input.lng,
    horarioApertura: input.horarioApertura,
    horarioCierre: input.horarioCierre,
    precioPorHora: input.precioPorHora,
    activa: input.activa !== undefined ? input.activa : true,
    imagen: input.imagen || "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1200&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  db.canchas.unshift(newCancha)
  saveRawDb(db)
  return newCancha
}

export async function updateCancha(id: string, input: UpdateCanchaInput): Promise<Cancha> {
  await simulateLatency()
  const db = getRawDb()
  const index = db.canchas.findIndex((c) => c.id === id)
  if (index === -1) {
    throw new Error(`Cancha con id ${id} no encontrada`)
  }

  const updated: Cancha = {
    ...db.canchas[index],
    ...input,
    updatedAt: new Date().toISOString(),
  }

  db.canchas[index] = updated
  saveRawDb(db)
  return updated
}

/**
 * Verifica si una cancha tiene reservas activas futuras (confirmada o pendiente)
 */
export async function checkCanchaHasActiveReservations(canchaId: string): Promise<boolean> {
  const db = getRawDb()
  const today = new Date().toISOString().split("T")[0]

  return db.reservas.some(
    (r) =>
      r.canchaId === canchaId &&
      (r.estado === "confirmada" || r.estado === "pendiente") &&
      r.fecha >= today
  )
}

/**
 * Eliminación de cancha: según AGENTS.md sección 3.1:
 * "Al eliminar una cancha con reservas futuras activas, se debe advertir/impedir... preferir soft delete con campo activa: boolean"
 */
export async function deleteCancha(id: string, force: boolean = false): Promise<{ success: boolean; softDeleted: boolean; message: string }> {
  await simulateLatency()
  const db = getRawDb()
  const index = db.canchas.findIndex((c) => c.id === id)
  if (index === -1) {
    throw new Error(`Cancha con id ${id} no encontrada`)
  }

  const hasActive = await checkCanchaHasActiveReservations(id)

  if (hasActive && !force) {
    // Aplicar soft delete para no romper integridad histórica
    db.canchas[index].activa = false
    db.canchas[index].updatedAt = new Date().toISOString()
    saveRawDb(db)
    return {
      success: true,
      softDeleted: true,
      message: "La cancha tiene reservas futuras activas. Ha sido desactivada (soft delete) para proteger los compromisos existentes.",
    }
  }

  // Si no tiene reservas o force es true, podemos desactivar o remover
  db.canchas[index].activa = false
  db.canchas[index].updatedAt = new Date().toISOString()
  saveRawDb(db)
  return {
    success: true,
    softDeleted: true,
    message: "Cancha desactivada correctamente.",
  }
}
