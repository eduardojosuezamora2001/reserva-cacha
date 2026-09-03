import * as React from "react"
import { Link } from "react-router-dom"
import {
  getCanchas,
  getReservas,
  aprobarSolicitud,
  rechazarSolicitud,
  type Cancha,
  type Reserva,
} from "@/lib/data"
import { useI18n } from "@/components/i18n/i18n-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  DashboardCircleIcon,
  FootballIcon,
  Calendar01Icon,
  WhatsappIcon,
  Grid02Icon,
  Tick02Icon,
  Cancel01Icon,
  ArrowRight01Icon,
  Refresh01Icon,
  AlarmClockIcon,
} from "@hugeicons/core-free-icons"

export function AdminDashboardPage() {
  const { t, formatDate, formatCurrency } = useI18n()
  const [canchas, setCanchas] = React.useState<Cancha[]>([])
  const [reservas, setReservas] = React.useState<Reserva[]>([])
  const [loading, setLoading] = React.useState(true)

  const refreshData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [cList, rList] = await Promise.all([
        getCanchas(false),
        getReservas(),
      ])
      setCanchas(cList)
      setReservas(rList)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    let ignore = false
    Promise.all([getCanchas(false), getReservas()]).then(([cList, rList]) => {
      if (!ignore) {
        setCanchas(cList)
        setReservas(rList)
        setLoading(false)
      }
    })

    const handleUpdate = () => {
      Promise.all([getCanchas(false), getReservas()]).then(([cList, rList]) => {
        if (!ignore) {
          setCanchas(cList)
          setReservas(rList)
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
      const msg = err instanceof Error ? err.message : "Error"
      toast.error(msg)
    }
  }

  const handleRechazar = async (id: string) => {
    try {
      await rechazarSolicitud(id)
      toast.success(t("admin.rejectSuccess"))
      refreshData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error"
      toast.error(msg)
    }
  }

  const canchasMap = React.useMemo(() => {
    const map: Record<string, Cancha> = {}
    canchas.forEach((c) => {
      map[c.id] = c
    })
    return map
  }, [canchas])

  const solicitudesPendientes = reservas.filter((r) => r.estado === "pendiente")
  const reservasConfirmadas = reservas.filter((r) => r.estado === "confirmada")

  // Cálculo de ingresos proyectados basados en el precio por hora de cada cancha
  const totalRevenue = reservasConfirmadas.reduce((acc, r) => {
    const cancha = canchasMap[r.canchaId]
    const price = cancha?.precioPorHora || 25000
    return acc + price
  }, 0)

  const openWhatsApp = (r: Reserva) => {
    const cancha = canchasMap[r.canchaId]
    const phone = r.telefonoSolicitante ? r.telefonoSolicitante.replace(/\D/g, "") : ""
    const msg = encodeURIComponent(
      `Hola ${r.nombreSolicitante}, recibimos tu solicitud para ${cancha?.nombre || "la cancha"} para el ${r.fecha} de ${r.horaInicio} a ${r.horaFin}.`
    )
    window.open(phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`, "_blank")
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon icon={DashboardCircleIcon} className="size-6 text-current" />
            </div>
            {t("admin.dashboard")}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {t("admin.dashboardDesc")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/canchas">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <HugeiconsIcon icon={Grid02Icon} className="size-3.5" />
              <span>Canchas</span>
            </Button>
          </Link>
          <Link to="/admin/reservas">
            <Button size="sm" className="gap-1.5 text-xs">
              <HugeiconsIcon icon={Calendar01Icon} className="size-3.5" />
              <span>Reservas</span>
            </Button>
          </Link>
          <Button variant="ghost" size="icon-sm" onClick={refreshData} title="Refrescar">
            <HugeiconsIcon icon={Refresh01Icon} className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              {t("admin.totalCanchas")}
            </span>
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <HugeiconsIcon icon={FootballIcon} className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-serif font-bold text-foreground">
              {loading ? <Skeleton className="h-7 w-12" /> : canchas.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {canchas.filter((c) => c.activa).length} activas y disponibles
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              {t("admin.totalReservas")}
            </span>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600">
              <HugeiconsIcon icon={Calendar01Icon} className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-serif font-bold text-foreground">
              {loading ? <Skeleton className="h-7 w-12" /> : reservasConfirmadas.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Partidos confirmados en agenda
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              {t("admin.pendingRequests")}
            </span>
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600">
              <HugeiconsIcon icon={WhatsappIcon} className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-serif font-bold text-amber-600">
              {loading ? <Skeleton className="h-7 w-12" /> : solicitudesPendientes.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Requieren revisión / WhatsApp
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              {t("admin.totalRevenue")}
            </span>
            <div className="p-1.5 rounded-md bg-primary/10 text-primary font-bold text-xs">
              ₡
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-serif font-bold text-primary">
              {loading ? <Skeleton className="h-7 w-20" /> : formatCurrency(totalRevenue)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Basado en reservas confirmadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sección: Solicitudes de Visitantes por Aprobar */}
      <Card className="border-border shadow-xs">
        <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <HugeiconsIcon icon={WhatsappIcon} className="size-4 text-emerald-600" />
              Solicitudes Pendientes de Visitantes
            </CardTitle>
            <CardDescription className="text-xs">
              Solicitudes generadas por visitantes sin sesión para coordinar vía WhatsApp.
            </CardDescription>
          </div>
          <Link to="/admin/reservas">
            <Button variant="ghost" size="xs" className="text-xs gap-1 text-primary">
              <span>Ver todas</span>
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-4 pt-0">
          {solicitudesPendientes.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              🎉 No hay solicitudes pendientes por revisar.
            </p>
          ) : (
            <div className="space-y-3">
              {solicitudesPendientes.map((sol) => {
                const cancha = canchasMap[sol.canchaId]
                return (
                  <div
                    key={sol.id}
                    className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{sol.nombreSolicitante}</span>
                        <Badge variant="outline" className="text-[10px] text-amber-700 dark:text-amber-300 border-amber-500/30">
                          Pendiente
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        {cancha ? cancha.nombre : "Cancha"} •{" "}
                        <span className="text-foreground font-medium">{formatDate(sol.fecha)}</span>{" "}
                        ({sol.horaInicio} - {sol.horaFin})
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Email: {sol.correoSolicitante} • Tel: {sol.telefonoSolicitante || "No provisto"}
                      </p>
                      {sol.notas && (
                        <p className="text-[11px] italic text-muted-foreground/80">&quot;{sol.notas}&quot;</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <Button
                        size="xs"
                        variant="default"
                        onClick={() => handleAprobar(sol.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-[11px] h-7 px-2"
                      >
                        <HugeiconsIcon icon={Tick02Icon} className="size-3" />
                        <span>Aprobar</span>
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleRechazar(sol.id)}
                        className="text-destructive hover:bg-destructive/10 gap-1 text-[11px] h-7 px-2"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
                        <span>Rechazar</span>
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => openWhatsApp(sol)}
                        title="Contactar por WhatsApp"
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        <HugeiconsIcon icon={WhatsappIcon} className="size-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Próximas reservas confirmadas */}
      <Card className="border-border shadow-xs">
        <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <HugeiconsIcon icon={Calendar01Icon} className="size-4 text-primary" />
              Agenda Reciente de Partidos
            </CardTitle>
            <CardDescription className="text-xs">
              Últimas reservas confirmadas en la plataforma.
            </CardDescription>
          </div>
          <Link to="/admin/reservas">
            <Button variant="ghost" size="xs" className="text-xs gap-1 text-primary">
              <span>Gestionar todas</span>
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-4 pt-0">
          {reservasConfirmadas.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              No hay reservas confirmadas registradas.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {reservasConfirmadas.slice(0, 5).map((res) => {
                const cancha = canchasMap[res.canchaId]
                return (
                  <div key={res.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{res.nombreSolicitante}</span>
                        <span className="text-muted-foreground">• {cancha?.nombre || "Cancha"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span>{formatDate(res.fecha)}</span>
                        <span className="flex items-center gap-1">
                          <HugeiconsIcon icon={AlarmClockIcon} className="size-3" />
                          {res.horaInicio} - {res.horaFin}
                        </span>
                      </div>
                    </div>
                    <Badge className="bg-emerald-600 text-white text-[10px]">Confirmada</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
