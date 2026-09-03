export type UserRole = "admin" | "cliente"

export interface User {
  id: string
  nombre: string
  correo: string
  passwordHash?: string
  rol: UserRole
  createdAt: string
}

export interface Cancha {
  id: string
  nombre: string
  descripcion: string
  direccion: string
  lat: number
  lng: number
  horarioApertura: string // Formato "HH:mm", ej. "08:00"
  horarioCierre: string   // Formato "HH:mm", ej. "23:00"
  precioPorHora?: number
  activa: boolean
  imagen?: string
  createdAt: string
  updatedAt: string
}

export type ReservaEstado = "pendiente" | "confirmada" | "cancelada" | "rechazada"

export interface Reserva {
  id: string
  canchaId: string
  userId?: string | null
  nombreSolicitante: string
  correoSolicitante: string
  telefonoSolicitante?: string
  fecha: string         // Formato "YYYY-MM-DD"
  horaInicio: string    // Formato "HH:mm"
  horaFin: string       // Formato "HH:mm"
  estado: ReservaEstado
  notas?: string
  createdAt: string
  updatedAt: string
}

export interface DisponibilidadSlot {
  horaInicio: string
  horaFin: string
  ocupado: boolean
  estado?: ReservaEstado
  reservaId?: string
}

export interface DatabaseSchema {
  users: User[]
  canchas: Cancha[]
  reservas: Reserva[]
}

export interface CreateCanchaInput {
  nombre: string
  descripcion: string
  direccion: string
  lat: number
  lng: number
  horarioApertura: string
  horarioCierre: string
  precioPorHora?: number
  activa?: boolean
  imagen?: string
}

export type UpdateCanchaInput = Partial<CreateCanchaInput>

export interface CreateReservaDirectaInput {
  canchaId: string
  userId: string
  nombreSolicitante: string
  correoSolicitante: string
  telefonoSolicitante?: string
  fecha: string
  horaInicio: string
  horaFin: string
  notas?: string
}

export interface CreateSolicitudVisitanteInput {
  canchaId: string
  nombreSolicitante: string
  correoSolicitante: string
  telefonoSolicitante: string
  fecha: string
  horaInicio: string
  horaFin: string
  notas?: string
}

export interface ModificarReservaInput {
  canchaId?: string
  fecha?: string
  horaInicio?: string
  horaFin?: string
  estado?: ReservaEstado
  notas?: string
}
