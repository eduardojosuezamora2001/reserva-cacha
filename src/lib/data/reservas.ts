import { getRawDb, saveRawDb, simulateLatency } from "./db"
import { validarReservaHorario } from "./disponibilidad"
import type {
  CreateReservaDirectaInput,
  CreateSolicitudVisitanteInput,
  ModificarReservaInput,
  Reserva,
  ReservaEstado,
} from "./types"

export interface ReservationFilters {
  canchaId?: string
  fecha?: string
  estado?: ReservaEstado | "todas"
  userId?: string
  searchTerm?: string
}

/**
 * SERVICIO DE RESERVAS (Simulación API/DB)
 * ========================================
 */

export async function getReservas(filters?: ReservationFilters): Promise<Reserva[]> {
  await simulateLatency()
  const db = getRawDb()
  let list = [...db.reservas]

  if (!filters) return list

  if (filters.canchaId) {
    list = list.filter((r) => r.canchaId === filters.canchaId)
  }
  if (filters.fecha) {
    list = list.filter((r) => r.fecha === filters.fecha)
  }
  if (filters.estado && filters.estado !== "todas") {
    list = list.filter((r) => r.estado === filters.estado)
  }
  if (filters.userId) {
    list = list.filter((r) => r.userId === filters.userId)
  }
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase()
    list = list.filter(
      (r) =>
        r.nombreSolicitante.toLowerCase().includes(term) ||
        r.correoSolicitante.toLowerCase().includes(term) ||
        (r.notas && r.notas.toLowerCase().includes(term))
    )
  }

  // Ordenar por fecha y hora más reciente
  return list.sort((a, b) => {
    const dtA = `${a.fecha}T${a.horaInicio}`
    const dtB = `${b.fecha}T${b.horaInicio}`
    return dtA.localeCompare(dtB)
  })
}

export async function getReservasByCancha(canchaId: string, fecha?: string): Promise<Reserva[]> {
  return getReservas({ canchaId, fecha })
}

export async function getReservasByUser(userId: string): Promise<Reserva[]> {
  return getReservas({ userId })
}

export async function getReservaById(id: string): Promise<Reserva | null> {
  await simulateLatency()
  const db = getRawDb()
  return db.reservas.find((r) => r.id === id) || null
}

/**
 * Crea una reserva directa (cliente autenticado).
 * Estado resultante: "confirmada".
 * Validación de solapamiento estricta en la capa de datos.
 */
export async function createReservaDirecta(input: CreateReservaDirectaInput): Promise<Reserva> {
  await simulateLatency()
  const db = getRawDb()

  const cancha = db.canchas.find((c) => c.id === input.canchaId)
  if (!cancha) {
    throw new Error("La cancha especificada no existe.")
  }

  if (!cancha.activa) {
    throw new Error("No es posible reservar en una cancha desactivada.")
  }

  // Re-validación de reglas de negocio en la capa de persistencia simulada
  const validation = validarReservaHorario(
    cancha,
    input.fecha,
    input.horaInicio,
    input.horaFin,
    db.reservas
  )

  if (!validation.valid) {
    throw new Error(validation.error || "El horario seleccionado no está disponible.")
  }

  const newReserva: Reserva = {
    id: `res-${Date.now()}`,
    canchaId: input.canchaId,
    userId: input.userId,
    nombreSolicitante: input.nombreSolicitante,
    correoSolicitante: input.correoSolicitante,
    telefonoSolicitante: input.telefonoSolicitante,
    fecha: input.fecha,
    horaInicio: input.horaInicio,
    horaFin: input.horaFin,
    estado: "confirmada",
    notas: input.notas || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  db.reservas.unshift(newReserva)
  saveRawDb(db)
  return newReserva
}

/**
 * Crea una solicitud de reserva para visitante sin cuenta.
 * Estado resultante: "pendiente".
 * Validación de solapamiento en capa de datos.
 */
export async function createSolicitudVisitante(input: CreateSolicitudVisitanteInput): Promise<Reserva> {
  await simulateLatency()
  const db = getRawDb()

  const cancha = db.canchas.find((c) => c.id === input.canchaId)
  if (!cancha) {
    throw new Error("La cancha especificada no existe.")
  }

  if (!cancha.activa) {
    throw new Error("No es posible reservar en una cancha desactivada.")
  }

  const validation = validarReservaHorario(
    cancha,
    input.fecha,
    input.horaInicio,
    input.horaFin,
    db.reservas
  )

  if (!validation.valid) {
    throw new Error(validation.error || "El horario solicitado entra en conflicto con otra reserva.")
  }

  const newReserva: Reserva = {
    id: `res-${Date.now()}`,
    canchaId: input.canchaId,
    userId: null,
    nombreSolicitante: input.nombreSolicitante,
    correoSolicitante: input.correoSolicitante,
    telefonoSolicitante: input.telefonoSolicitante,
    fecha: input.fecha,
    horaInicio: input.horaInicio,
    horaFin: input.horaFin,
    estado: "pendiente",
    notas: input.notas || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  db.reservas.unshift(newReserva)
  saveRawDb(db)
  return newReserva
}

/**
 * Genera el enlace de WhatsApp (wa.me) con el mensaje pre-armado
 * según las especificaciones de AGENTS.md sección 6.1
 */
export function buildWhatsAppLink(
  canchaNombre: string,
  nombre: string,
  correo: string,
  fecha: string,
  horaInicio: string,
  horaFin: string,
  telefonoAdmin: string = "50688889999",
  locale: "es" | "en" = "es"
): string {
  // Número de teléfono en formato internacional sin signos
  const cleanPhone = telefonoAdmin.replace(/\D/g, "")

  const message =
    locale === "en"
      ? `⚽ *New booking request*\n\n` +
        `*Pitch:* ${canchaNombre}\n` +
        `*Client:* ${nombre}\n` +
        `*Email:* ${correo}\n` +
        `*Date:* ${fecha}\n` +
        `*Time:* ${horaInicio} - ${horaFin}\n\n` +
        `_Sent from Fútbol Pro Booking System_`
      : `⚽ *Nueva solicitud de reserva*\n\n` +
        `*Cancha:* ${canchaNombre}\n` +
        `*Cliente:* ${nombre}\n` +
        `*Correo:* ${correo}\n` +
        `*Fecha:* ${fecha}\n` +
        `*Hora:* ${horaInicio} - ${horaFin}\n\n` +
        `_Enviado desde Sistema de Reservas Fútbol Pro_`

  const encoded = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encoded}`
}

/**
 * Cancela una reserva (cambia estado a 'cancelada', liberando el horario)
 */
export async function cancelarReserva(id: string): Promise<Reserva> {
  await simulateLatency()
  const db = getRawDb()
  const index = db.reservas.findIndex((r) => r.id === id)
  if (index === -1) {
    throw new Error("Reserva no encontrada.")
  }

  db.reservas[index].estado = "cancelada"
  db.reservas[index].updatedAt = new Date().toISOString()
  saveRawDb(db)
  return db.reservas[index]
}

/**
 * Modifica una reserva existente, validando disponibilidad si cambia fecha u horario
 */
export async function modificarReserva(id: string, input: ModificarReservaInput): Promise<Reserva> {
  await simulateLatency()
  const db = getRawDb()
  const index = db.reservas.findIndex((r) => r.id === id)
  if (index === -1) {
    throw new Error("Reserva no encontrada.")
  }

  const existing = db.reservas[index]
  const targetCanchaId = input.canchaId || existing.canchaId
  const targetFecha = input.fecha || existing.fecha
  const targetStart = input.horaInicio || existing.horaInicio
  const targetEnd = input.horaFin || existing.horaFin

  const cancha = db.canchas.find((c) => c.id === targetCanchaId)
  if (!cancha) {
    throw new Error("Cancha no encontrada.")
  }

  // Si cambia fecha, cancha u horario, verificar solapamiento excluyendo la reserva actual
  if (
    input.canchaId !== undefined ||
    input.fecha !== undefined ||
    input.horaInicio !== undefined ||
    input.horaFin !== undefined
  ) {
    const val = validarReservaHorario(cancha, targetFecha, targetStart, targetEnd, db.reservas, id)
    if (!val.valid) {
      throw new Error(val.error || "El nuevo horario no está disponible.")
    }
  }

  const updated: Reserva = {
    ...existing,
    canchaId: targetCanchaId,
    fecha: targetFecha,
    horaInicio: targetStart,
    horaFin: targetEnd,
    estado: input.estado || existing.estado,
    notas: input.notas !== undefined ? input.notas : existing.notas,
    updatedAt: new Date().toISOString(),
  }

  db.reservas[index] = updated
  saveRawDb(db)
  return updated
}

export async function aprobarSolicitud(id: string): Promise<Reserva> {
  return modificarReserva(id, { estado: "confirmada" })
}

export async function rechazarSolicitud(id: string): Promise<Reserva> {
  return modificarReserva(id, { estado: "rechazada" })
}
