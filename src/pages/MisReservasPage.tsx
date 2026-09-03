import * as React from "react"
import { Link } from "react-router-dom"
import {
  getReservasByUser,
  getCanchas,
  cancelarReserva,
  type Reserva,
  type Cancha,
} from "@/lib/data"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/components/i18n/i18n-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  AlarmClockIcon,
  Cancel01Icon,
  FootballIcon,
  Refresh01Icon,
} from "@hugeicons/core-free-icons"

export function MisReservasPage() {
  const { user } = useAuth()
  const { t, formatDate } = useI18n()

  const [reservas, setReservas] = React.useState<Reserva[]>([])
  const [canchas, setCanchas] = React.useState<Record<string, Cancha>>({})
  const [loading, setLoading] = React.useState(true)
  const [filterStatus, setFilterStatus] = React.useState<string>("todas")

  // Estado para modal de confirmación de cancelación
  const [cancelModalOpen, setCancelModalOpen] = React.useState(false)
  const [selectedReservaId, setSelectedReservaId] = React.useState<string | null>(null)
  const [cancelling, setCancelling] = React.useState(false)

  const refreshData = React.useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [resList, canchasList] = await Promise.all([
        getReservasByUser(user.id),
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
  }, [user])

  React.useEffect(() => {
    if (!user) return
    let ignore = false

    Promise.all([getReservasByUser(user.id), getCanchas(false)]).then(([resList, canchasList]) => {
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
      Promise.all([getReservasByUser(user.id), getCanchas(false)]).then(([resList, canchasList]) => {
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
  }, [user])

  const handleConfirmCancel = async () => {
    if (!selectedReservaId) return
    setCancelling(true)
    try {
      await cancelarReserva(selectedReservaId)
      toast.success(t("reservas.cancelSuccess"))
      setCancelModalOpen(false)
      setSelectedReservaId(null)
      refreshData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cancelar la reserva"
      toast.error(msg)
    } finally {
      setCancelling(false)
    }
  }

  const filteredReservas = reservas.filter((r) => {
    if (filterStatus === "todas") return true
    return r.estado === filterStatus
  })

  const getStatusBadge = (estado: Reserva["estado"]) => {
    switch (estado) {
      case "confirmada":
        return <Badge className="bg-emerald-600 text-white text-[10px]">{t("reservas.status.confirmada")}</Badge>
      case "pendiente":
        return <Badge variant="secondary" className="text-[10px] text-amber-600 bg-amber-500/10 border-amber-500/20">{t("reservas.status.pendiente")}</Badge>
      case "cancelada":
        return <Badge variant="outline" className="text-[10px] text-muted-foreground">{t("reservas.status.cancelada")}</Badge>
      case "rechazada":
        return <Badge variant="destructive" className="text-[10px]">{t("reservas.status.rechazada")}</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground tracking-tight">
            {t("reservas.title")}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {t("reservas.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/canchas">
            <Button size="sm" className="gap-1.5 text-xs">
              <HugeiconsIcon icon={FootballIcon} className="size-3.5" />
              <span>Explorar Canchas</span>
            </Button>
          </Link>
          <Button variant="ghost" size="icon-sm" onClick={refreshData} title="Refrescar">
            <HugeiconsIcon icon={Refresh01Icon} className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Filtros rápidos por estado */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { id: "todas", label: t("common.all") },
          { id: "confirmada", label: t("reservas.status.confirmada") },
          { id: "pendiente", label: t("reservas.status.pendiente") },
          { id: "cancelada", label: t("reservas.status.cancelada") },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={filterStatus === tab.id ? "default" : "outline"}
            size="xs"
            onClick={() => setFilterStatus(tab.id)}
            className="text-xs"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Lista de reservas */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredReservas.length === 0 ? (
        <Card className="border-dashed border-border py-12 text-center">
          <CardContent className="space-y-3">
            <HugeiconsIcon icon={Calendar03Icon} className="size-10 text-muted-foreground/50 mx-auto" />
            <h3 className="font-semibold text-base text-foreground">
              {t("reservas.noReservations")}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {t("reservas.bookFirstCourt")}
            </p>
            <Link to="/canchas" className="inline-block pt-2">
              <Button size="sm" className="gap-1.5 text-xs">
                <HugeiconsIcon icon={FootballIcon} className="size-3.5" />
                <span>Ver canchas disponibles</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReservas.map((res) => {
            const cancha = canchas[res.canchaId]
            const canCancel = res.estado === "confirmada" || res.estado === "pendiente"

            return (
              <Card key={res.id} className="border-border/80 shadow-xs hover:border-primary/40 transition-colors">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-bold text-sm text-foreground">
                        {cancha ? cancha.nombre : `Cancha #${res.canchaId}`}
                      </h3>
                      {getStatusBadge(res.estado)}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <HugeiconsIcon icon={Calendar03Icon} className="size-3.5 text-primary" />
                        <span>{formatDate(res.fecha)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <HugeiconsIcon icon={AlarmClockIcon} className="size-3.5 text-primary" />
                        <span>{res.horaInicio} - {res.horaFin}</span>
                      </div>
                      {res.notas && (
                        <span className="text-[11px] italic bg-muted/40 px-2 py-0.5 rounded text-foreground/80">
                          &quot;{res.notas}&quot;
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {canCancel && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setSelectedReservaId(res.id)
                          setCancelModalOpen(true)
                        }}
                        className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30 gap-1"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
                        <span>{t("common.cancel")}</span>
                      </Button>
                    )}

                    {cancha && (
                      <Link to={`/canchas/${cancha.id}`}>
                        <Button variant="ghost" size="xs" className="text-xs">
                          Ver Cancha
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal de confirmación para cancelar */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-destructive flex items-center gap-2">
              <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              Cancelar reserva
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              {t("reservas.cancelConfirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(false)}
              disabled={cancelling}
            >
              No, mantener
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmCancel}
              disabled={cancelling}
            >
              {cancelling ? t("common.loading") : "Sí, cancelar reserva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
