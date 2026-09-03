import type { Cancha, DisponibilidadSlot, Reserva } from "./types"

/**
 * Normalización de Timezone Fijo: America/Costa_Rica
 * Según AGENTS.md sección 7: normalizar todo a un mismo timezone fijo
 * para evitar bugs de solapamiento por husos horarios.
 */
export const DEFAULT_TIMEZONE = "America/Costa_Rica"

/**
 * Convierte una hora "HH:mm" a minutos desde medianoche (0 - 1440)
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number)
  return hours * 60 + minutes
}

/**
 * Convierte minutos desde medianoche a formato "HH:mm"
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

/**
 * Verifica si dos rangos horarios en minutos se solapan:
 * Rango A: [startA, endA)
 * Rango B: [startB, endB)
 * Se solapan si: startA < endB && endA > startB
 */
export function doIntervalsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && endA > startB
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Valida reglas de negocio para crear o modificar una reserva:
 * 1. horaFin > horaInicio
 * 2. Rango dentro de horarioApertura y horarioCierre de la cancha
 * 3. No solapamiento con reservas existentes con estado 'confirmada' o 'pendiente'
 */
export function validarReservaHorario(
  cancha: Cancha,
  fecha: string,
  horaInicio: string,
  horaFin: string,
  reservasExistentes: Reserva[],
  excludeReservaId?: string
): ValidationResult {
  const reqStart = timeToMinutes(horaInicio)
  const reqEnd = timeToMinutes(horaFin)

  if (isNaN(reqStart) || isNaN(reqEnd)) {
    return { valid: false, error: "Formato de hora inválido." }
  }

  if (reqEnd <= reqStart) {
    return { valid: false, error: "La hora de fin debe ser posterior a la hora de inicio." }
  }

  const openMinutes = timeToMinutes(cancha.horarioApertura)
  const closeMinutes = timeToMinutes(cancha.horarioCierre)

  if (reqStart < openMinutes || reqEnd > closeMinutes) {
    return {
      valid: false,
      error: `El horario solicitado (${horaInicio} - ${horaFin}) está fuera del horario de la cancha (${cancha.horarioApertura} - ${cancha.horarioCierre}).`,
    }
  }

  // Comprobar reservas activas (confirmada o pendiente) en la misma cancha y misma fecha
  const conflictos = reservasExistentes.filter((r) => {
    if (r.id === excludeReservaId) return false
    if (r.canchaId !== cancha.id) return false
    if (r.fecha !== fecha) return false
    if (r.estado !== "confirmada" && r.estado !== "pendiente") return false

    const rStart = timeToMinutes(r.horaInicio)
    const rEnd = timeToMinutes(r.horaFin)

    return doIntervalsOverlap(reqStart, reqEnd, rStart, rEnd)
  })

  if (conflictos.length > 0) {
    const primerConflicto = conflictos[0]
    return {
      valid: false,
      error: `El horario se solapa con una reserva ${primerConflicto.estado} existente (${primerConflicto.horaInicio} - ${primerConflicto.horaFin}).`,
    }
  }

  return { valid: true }
}

/**
 * Genera la lista de bloques o slots de 1 hora para un día determinado,
 * indicando cuáles están libres y cuáles ocupados.
 */
export function calcularSlotsDelDia(
  cancha: Cancha,
  fecha: string,
  reservasDeLaFecha: Reserva[],
  slotDurationMinutes: number = 60
): DisponibilidadSlot[] {
  const startMin = timeToMinutes(cancha.horarioApertura)
  const endMin = timeToMinutes(cancha.horarioCierre)

  const slots: DisponibilidadSlot[] = []

  // Filtrar solo reservas activas para la cancha y fecha
  const activas = reservasDeLaFecha.filter(
    (r) =>
      r.canchaId === cancha.id &&
      r.fecha === fecha &&
      (r.estado === "confirmada" || r.estado === "pendiente")
  )

  for (let current = startMin; current + slotDurationMinutes <= endMin; current += slotDurationMinutes) {
    const slotStart = current
    const slotEnd = current + slotDurationMinutes
    const slotStartStr = minutesToTime(slotStart)
    const slotEndStr = minutesToTime(slotEnd)

    // Verificar si alguna reserva solapa este slot
    const matchingReserva = activas.find((r) => {
      const rStart = timeToMinutes(r.horaInicio)
      const rEnd = timeToMinutes(r.horaFin)
      return doIntervalsOverlap(slotStart, slotEnd, rStart, rEnd)
    })

    if (matchingReserva) {
      slots.push({
        horaInicio: slotStartStr,
        horaFin: slotEndStr,
        ocupado: true,
        estado: matchingReserva.estado,
        reservaId: matchingReserva.id,
      })
    } else {
      slots.push({
        horaInicio: slotStartStr,
        horaFin: slotEndStr,
        ocupado: false,
      })
    }
  }

  return slots
}
