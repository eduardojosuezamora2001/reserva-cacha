import * as React from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import {
  getCanchaById,
  getReservasByCancha,
  type Cancha,
  type Reserva,
} from "@/lib/data"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/components/i18n/i18n-provider"
import { GoogleMapEmbed } from "@/components/canchas/GoogleMapEmbed"
import { DisponibilidadTimeline } from "@/components/canchas/DisponibilidadTimeline"
import { ReservaDirectaModal } from "@/components/reservas/ReservaDirectaModal"
import { SolicitudVisitanteModal } from "@/components/reservas/SolicitudVisitanteModal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeftIcon,
  Location01Icon,
  AlarmClockIcon,
  WhatsappIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"

export function CanchaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { t, formatCurrency } = useI18n()

  const [cancha, setCancha] = React.useState<Cancha | null>(null)
  const [reservas, setReservas] = React.useState<Reserva[]>([])
  const [loading, setLoading] = React.useState(true)

  const [selectedDate, setSelectedDate] = React.useState<string>(
    () => new Date().toISOString().split("T")[0]
  )
  const [selectedSlot, setSelectedSlot] = React.useState<{
    horaInicio: string
    horaFin: string
  } | null>(null)

  const [openDirecta, setOpenDirecta] = React.useState(false)
  const [openSolicitud, setOpenSolicitud] = React.useState(false)

  const refreshData = React.useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await getCanchaById(id)
      if (!data) {
        navigate("/canchas")
        return
      }
      setCancha(data)
      const res = await getReservasByCancha(id)
      setReservas(res)
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  React.useEffect(() => {
    if (!id) return
    let ignore = false

    Promise.all([getCanchaById(id), getReservasByCancha(id)]).then(([data, res]) => {
      if (!ignore) {
        if (!data) {
          navigate("/canchas")
          return
        }
        setCancha(data)
        setReservas(res)
        setLoading(false)
      }
    })

    const handleUpdate = () => {
      Promise.all([getCanchaById(id), getReservasByCancha(id)]).then(([data, res]) => {
        if (!ignore) {
          if (data) setCancha(data)
          setReservas(res)
        }
      })
    }

    window.addEventListener("canchas-db-updated", handleUpdate)
    return () => {
      ignore = true
      window.removeEventListener("canchas-db-updated", handleUpdate)
    }
  }, [id, navigate])

  const handleSelectSlot = (horaInicio: string, horaFin: string) => {
    setSelectedSlot({ horaInicio, horaFin })
  }

  const handleStartBooking = () => {
    if (isAuthenticated) {
      setOpenDirecta(true)
    } else {
      setOpenSolicitud(true)
    }
  }

  if (loading || !cancha) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="aspect-21/9 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 md:col-span-2 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Botón Volver */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/canchas")}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground -ml-2"
        >
          <HugeiconsIcon icon={ArrowLeftIcon} className="size-3.5" />
          <span>{t("common.back")}</span>
        </Button>

        <div className="flex items-center gap-2">
          {cancha.activa ? (
            <Badge className="bg-emerald-600 text-white text-xs font-semibold">
              {t("canchas.activePitch")}
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs font-semibold">
              {t("canchas.inactivePitch")}
            </Badge>
          )}
        </div>
      </div>

      {/* Hero de la Cancha */}
      <div className="relative rounded-2xl overflow-hidden border border-border shadow-sm bg-card">
        <div className="relative aspect-21/9 md:aspect-24/9 w-full overflow-hidden bg-muted">
          <img
            src={cancha.imagen || "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1200&q=80"}
            alt={cancha.nombre}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>

        <div className="p-6 md:p-8 -mt-20 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground tracking-tight">
              {cancha.nombre}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              {cancha.descripcion}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Location01Icon} className="size-4 text-primary" />
                <span>{cancha.direccion}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon icon={AlarmClockIcon} className="size-4 text-primary" />
                <span>{cancha.horarioApertura} - {cancha.horarioCierre}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
            {cancha.precioPorHora && (
              <div className="text-left md:text-right">
                <span className="text-2xl md:text-3xl font-bold font-serif text-primary">
                  {formatCurrency(cancha.precioPorHora)}
                </span>
                <span className="text-xs text-muted-foreground block">
                  {t("common.perHour")}
                </span>
              </div>
            )}

            {/* CTA principal */}
            {isAuthenticated ? (
              <Button
                onClick={handleStartBooking}
                size="default"
                disabled={!cancha.activa}
                className="gap-2 shadow-xs w-full md:w-auto"
              >
                <HugeiconsIcon icon={Tick02Icon} className="size-4" />
                <span>{t("canchas.reserveNow")}</span>
              </Button>
            ) : (
              <div className="flex flex-col gap-1.5 w-full md:w-auto">
                <Button
                  onClick={handleStartBooking}
                  size="default"
                  disabled={!cancha.activa}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <HugeiconsIcon icon={WhatsappIcon} className="size-4" />
                  <span>{t("canchas.requestBooking")}</span>
                </Button>
                <Link to="/login" className="text-[11px] text-center text-primary hover:underline">
                  {t("auth.alreadyHaveAccount")} {t("navigation.login")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Aviso para visitantes no autenticados */}
      {!isAuthenticated && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={WhatsappIcon} className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">
                  ¿Quieres reservar sin crear una cuenta?
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Puedes enviar tu solicitud y coordinar directamente con el administrador por WhatsApp.
                </p>
              </div>
            </div>
            <Button
              size="xs"
              variant="outline"
              onClick={() => setOpenSolicitud(true)}
              className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 shrink-0 text-xs"
            >
              Solicitar por WhatsApp
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Grid de Disponibilidad y Mapa de Google */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vista de disponibilidad interactiva */}
        <div className="lg:col-span-2 space-y-4">
          <DisponibilidadTimeline
            cancha={cancha}
            reservas={reservas}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onSelectSlot={handleSelectSlot}
            selectedSlot={selectedSlot}
          />

          {selectedSlot && (
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between gap-4 animate-in fade-in-50">
              <div className="text-xs">
                <span className="text-muted-foreground">Horario seleccionado: </span>
                <strong className="text-foreground">
                  {selectedSlot.horaInicio} - {selectedSlot.horaFin}
                </strong>{" "}
                el{" "}
                <span className="text-foreground font-medium">{selectedDate}</span>
              </div>
              <Button size="sm" onClick={handleStartBooking} className="gap-1 text-xs">
                <span>Continuar reserva</span>
              </Button>
            </div>
          )}
        </div>

        {/* Ubicación Google Maps */}
        <div className="space-y-4">
          <Card className="border-border shadow-xs">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-bold font-serif text-foreground flex items-center gap-2">
                <HugeiconsIcon icon={Location01Icon} className="size-4 text-primary" />
                {t("canchas.mapLocation")}
              </h3>
              <GoogleMapEmbed
                lat={cancha.lat}
                lng={cancha.lng}
                direccion={cancha.direccion}
                canchaNombre={cancha.nombre}
                height={260}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modales de Reserva */}
      <ReservaDirectaModal
        cancha={cancha}
        open={openDirecta}
        onOpenChange={setOpenDirecta}
        initialDate={selectedDate}
        initialSlot={selectedSlot}
        onSuccess={refreshData}
      />

      <SolicitudVisitanteModal
        cancha={cancha}
        open={openSolicitud}
        onOpenChange={setOpenSolicitud}
        initialDate={selectedDate}
        initialSlot={selectedSlot}
        onSuccess={refreshData}
      />
    </div>
  )
}
