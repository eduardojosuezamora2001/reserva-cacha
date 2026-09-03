import * as React from "react"
import {
  getReservas,
  getCanchas,
  aprobarSolicitud,
  rechazarSolicitud,
  cancelarReserva,
  type Reserva,
  type Cancha,
  type ReservaEstado,
} from "@/lib/data"
import { useI18n } from "@/components/i18n/i18n-provider"
import { ReservaEditModal } from "@/components/reservas/ReservaEditModal"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar01Icon,
  WhatsappIcon,
  Tick02Icon,
  Cancel01Icon,
  PencilEdit01Icon,
  AiSearchIcon,
  Refresh01Icon,
  AlarmClockIcon,
} from "@hugeicons/core-free-icons"

export function AdminReservasPage() {
  const { t, formatDate } = useI18n()

  const [reservas, setReservas] = React.useState<Reserva[]>([])
  const [canchas, setCanchas] = React.useState<Record<string, Cancha>>({})
  const [loading, setLoading] = React.useState(true)

  // Filtros
  const [activeTab, setActiveTab] = React.useState<string>("todas")
  const [canchaFilter, setCanchaFilter] = React.useState<string>("todas")
  const [dateFilter, setDateFilter] = React.useState<string>("")
  const [searchTerm, setSearchTerm] = React.useState<string>("")

  // Modal para editar reserva
  const [editModalOpen, setEditModalOpen] = React.useState(false)
  const [editingReserva, setEditingReserva] = React.useState<Reserva | null>(null)

  const refreshData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [resList, canchasList] = await Promise.all([
        getReservas(),
        getCanchas(false),
      ])
      setReservas(resList)

      const map: Record<string, Cancha> = {}
      canchasList.forEach((c) => {
        map[c.id] = c
      })
      setCanchas(map)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    let ignore = false
    Promise.all([getReservas(), getCanchas(false)]).then(([resList, canchasList]) => {
      if (!ignore) {
        setReservas(resList)
        const map: Record<string, Cancha> = {}
        canchasList.forEach((c) => {
          map[c.id] = c
        })
        setCanchas(map)
        setLoading(false)
      }
    })

    const handleUpdate = () => {
      Promise.all([getReservas(), getCanchas(false)]).then(([resList, canchasList]) => {
        if (!ignore) {
          setReservas(resList)
          const map: Record<string, Cancha> = {}
          canchasList.forEach((c) => {
            map[c.id] = c
          })
          setCanchas(map)
        }
      })
    }

    window.addEventListener("canchas-db-updated", handleUpdate)
    return () => {
      ignore = true
      window.removeEventListener("canchas-db-updated", handleUpdate)
    }
  }, [])

  const handleAprobar = async (id: string) => {
    try {
      await aprobarSolicitud(id)
      toast.success(t("admin.approveSuccess"))
      refreshData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al aprobar la solicitud"
      toast.error(msg)
    }
  }

  const handleRechazar = async (id: string) => {
    try {
      await rechazarSolicitud(id)
      toast.success(t("admin.rejectSuccess"))
      refreshData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al rechazar la solicitud"
      toast.error(msg)
    }
  }

  const handleCancelar = async (id: string) => {
    try {
      await cancelarReserva(id)
      toast.success(t("reservas.cancelSuccess"))
      refreshData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cancelar la reserva"
      toast.error(msg)
    }
  }

  const handleOpenEdit = (reserva: Reserva) => {
    setEditingReserva(reserva)
    setEditModalOpen(true)
  }

  const openWhatsAppClient = (reserva: Reserva) => {
    const cancha = canchas[reserva.canchaId]
    const phone = reserva.telefonoSolicitante
      ? reserva.telefonoSolicitante.replace(/\D/g, "")
      : ""

    const text = encodeURIComponent(
      `Hola ${reserva.nombreSolicitante}, te escribimos desde Fútbol Pro sobre tu reserva para ${cancha?.nombre || "la cancha"} el día ${reserva.fecha} (${reserva.horaInicio} - ${reserva.horaFin}).`
    )

    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`
    window.open(url, "_blank")
  }

  const pendientesCount = reservas.filter((r) => r.estado === "pendiente").length

  const filtered = reservas.filter((r) => {
    // Filtro por Tab
    if (activeTab === "pendientes" && r.estado !== "pendiente") return false
    if (activeTab === "confirmadas" && r.estado !== "confirmada") return false
    if (activeTab === "canceladas" && r.estado !== "cancelada" && r.estado !== "rechazada") return false

    // Filtro por Cancha
    if (canchaFilter !== "todas" && r.canchaId !== canchaFilter) return false

    // Filtro por Fecha
    if (dateFilter && r.fecha !== dateFilter) return false

    // Búsqueda por texto
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      const matchClient = r.nombreSolicitante.toLowerCase().includes(term)
      const matchEmail = r.correoSolicitante.toLowerCase().includes(term)
      const matchNotes = r.notas && r.notas.toLowerCase().includes(term)
      if (!matchClient && !matchEmail && !matchNotes) return false
    }

    return true
  })

  const getStatusBadge = (estado: ReservaEstado) => {
    switch (estado) {
      case "confirmada":
        return <Badge className="bg-emerald-600 text-white text-[10px]">{t("reservas.status.confirmada")}</Badge>
      case "pendiente":
        return <Badge variant="secondary" className="text-[10px] text-amber-600 bg-amber-500/10 border-amber-500/30">{t("reservas.status.pendiente")}</Badge>
      case "cancelada":
        return <Badge variant="outline" className="text-[10px] text-muted-foreground">{t("reservas.status.cancelada")}</Badge>
      case "rechazada":
        return <Badge variant="destructive" className="text-[10px]">{t("reservas.status.rechazada")}</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon icon={Calendar01Icon} className="size-6 text-current" />
            </div>
            {t("admin.reservasManagement")}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Supervisa las reservas confirmadas, aprueba solicitudes de visitantes y coordina por WhatsApp.
          </p>
        </div>

        <Button variant="outline" size="icon-sm" onClick={refreshData} title="Refrescar">
          <HugeiconsIcon icon={Refresh01Icon} className="size-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Alerta de solicitudes pendientes si hay */}
      {pendientesCount > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={WhatsappIcon} className="size-4 shrink-0" />
            <span>
              Tienes <strong>{pendientesCount} solicitud(es) de visitantes</strong> pendientes de confirmación.
            </span>
          </div>
          <Button
            size="xs"
            variant="outline"
            onClick={() => setActiveTab("pendientes")}
            className="border-amber-500/40 text-xs shrink-0"
          >
            Ver pendientes
          </Button>
        </div>
      )}

      {/* Tabs y Filtros */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Tabs principales */}
          <div className="flex flex-wrap gap-1.5">
            <Button
              variant={activeTab === "todas" ? "default" : "outline"}
              size="xs"
              onClick={() => setActiveTab("todas")}
              className="text-xs"
            >
              Todas ({reservas.length})
            </Button>
            <Button
              variant={activeTab === "pendientes" ? "default" : "outline"}
              size="xs"
              onClick={() => setActiveTab("pendientes")}
              className="text-xs gap-1"
            >
              <span>Pendientes</span>
              {pendientesCount > 0 && (
                <span className="size-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {pendientesCount}
                </span>
              )}
            </Button>
            <Button
              variant={activeTab === "confirmadas" ? "default" : "outline"}
              size="xs"
              onClick={() => setActiveTab("confirmadas")}
              className="text-xs"
            >
              Confirmadas
            </Button>
            <Button
              variant={activeTab === "canceladas" ? "default" : "outline"}
              size="xs"
              onClick={() => setActiveTab("canceladas")}
              className="text-xs"
            >
              Canceladas / Rechazadas
            </Button>
          </div>

          {/* Filtro por fecha */}
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-8 text-xs w-36 bg-background"
            />
            {dateFilter && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setDateFilter("")}
                className="text-xs text-muted-foreground"
              >
                Limpiar fecha
              </Button>
            )}
          </div>
        </div>

        {/* Buscador y filtro por cancha */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <HugeiconsIcon icon={AiSearchIcon} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, correo o notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8 text-xs bg-background"
            />
          </div>

          <select
            value={canchaFilter}
            onChange={(e) => setCanchaFilter(e.target.value)}
            className="h-8 px-2.5 rounded-md border border-input bg-background text-xs"
          >
            <option value="todas">Todas las canchas</option>
            {Object.values(canchas).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Reservas */}
      <Card className="border-border overflow-hidden shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-xs">
                  <TableHead>Fecha y Horario</TableHead>
                  <TableHead>Cancha</TableHead>
                  <TableHead>Cliente / Solicitante</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                      {t("common.loading")}
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                      No se encontraron reservas con los criterios aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => {
                    const cancha = canchas[r.canchaId]

                    return (
                      <TableRow key={r.id} className="text-xs hover:bg-muted/30">
                        <TableCell className="whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{formatDate(r.fecha)}</span>
                            <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                              <HugeiconsIcon icon={AlarmClockIcon} className="size-3" />
                              {r.horaInicio} - {r.horaFin}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="font-medium whitespace-nowrap">
                          {cancha ? cancha.nombre : `#${r.canchaId}`}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{r.nombreSolicitante}</span>
                            <span className="text-[11px] text-muted-foreground">{r.correoSolicitante}</span>
                            {r.telefonoSolicitante && (
                              <span className="text-[10px] text-primary">{r.telefonoSolicitante}</span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>{getStatusBadge(r.estado)}</TableCell>

                        <TableCell className="max-w-xs text-muted-foreground text-[11px]">
                          {r.notas || "-"}
                        </TableCell>

                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* Acciones para Solicitudes Pendientes */}
                            {r.estado === "pendiente" && (
                              <>
                                <Button
                                  variant="default"
                                  size="xs"
                                  onClick={() => handleAprobar(r.id)}
                                  title="Aprobar solicitud"
                                  className="h-7 px-2 text-[11px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <HugeiconsIcon icon={Tick02Icon} className="size-3" />
                                  <span>{t("admin.approve")}</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={() => handleRechazar(r.id)}
                                  title="Rechazar solicitud"
                                  className="h-7 px-2 text-[11px] gap-1 text-destructive hover:bg-destructive/10"
                                >
                                  <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
                                  <span>{t("admin.reject")}</span>
                                </Button>
                              </>
                            )}

                            {/* Modificar horario */}
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleOpenEdit(r)}
                              title={t("admin.modify")}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <HugeiconsIcon icon={PencilEdit01Icon} className="size-3.5" />
                            </Button>

                            {/* Contactar por WhatsApp */}
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => openWhatsAppClient(r)}
                              title={t("admin.chatWhatsApp")}
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            >
                              <HugeiconsIcon icon={WhatsappIcon} className="size-3.5" />
                            </Button>

                            {/* Cancelar si está confirmada */}
                            {r.estado === "confirmada" && (
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => handleCancelar(r.id)}
                                title="Cancelar reserva y liberar horario"
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Modificar Reserva */}
      <ReservaEditModal
        reserva={editingReserva}
        cancha={editingReserva ? canchas[editingReserva.canchaId] : null}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={refreshData}
      />
    </div>
  )
}
