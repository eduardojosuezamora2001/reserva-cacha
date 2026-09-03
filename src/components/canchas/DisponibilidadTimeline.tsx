import * as React from "react"
import type { Cancha, Reserva } from "@/lib/data"
import { calcularSlotsDelDia } from "@/lib/data"
import { useI18n } from "@/components/i18n/i18n-provider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  AlarmClockIcon,
  Tick02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"

interface DisponibilidadTimelineProps {
  cancha: Cancha
  reservas: Reserva[]
  selectedDate: string
  onDateChange: (newDate: string) => void
  onSelectSlot?: (horaInicio: string, horaFin: string) => void
  selectedSlot?: { horaInicio: string; horaFin: string } | null
}

export function DisponibilidadTimeline({
  cancha,
  reservas,
  selectedDate,
  onDateChange,
  onSelectSlot,
  selectedSlot,
}: DisponibilidadTimelineProps) {
  const { t, formatDate } = useI18n()

  const slots = React.useMemo(() => {
    return calcularSlotsDelDia(cancha, selectedDate, reservas, 60)
  }, [cancha, selectedDate, reservas])

  const libresCount = slots.filter((s) => !s.ocupado).length
  const ocupadosCount = slots.filter((s) => s.ocupado).length

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <HugeiconsIcon icon={AlarmClockIcon} className="size-4 text-primary" />
              {t("canchas.schedule")}
            </CardTitle>
            <CardDescription className="text-xs">
              {formatDate(selectedDate, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} •{" "}
              {cancha.horarioApertura} - {cancha.horarioCierre}
            </CardDescription>
          </div>

          {/* Selector de fecha rápido */}
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Calendar03Icon} className="size-4 text-muted-foreground shrink-0" />
            <Input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => {
                if (e.target.value) {
                  onDateChange(e.target.value)
                }
              }}
              className="h-8 text-xs w-36 bg-background"
            />
          </div>
        </div>

        {/* Resumen de ocupación */}
        <div className="flex items-center gap-3 pt-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">
              {libresCount} {t("canchas.available").toLowerCase()}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-destructive" />
            <span className="text-muted-foreground">
              {ocupadosCount} {t("canchas.occupied").toLowerCase()}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {slots.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No hay horarios definidos para esta fecha.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {slots.map((slot) => {
              const isSelected =
                selectedSlot?.horaInicio === slot.horaInicio &&
                selectedSlot?.horaFin === slot.horaFin

              if (slot.ocupado) {
                return (
                  <div
                    key={`${slot.horaInicio}-${slot.horaFin}`}
                    className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-destructive/20 bg-destructive/5 text-muted-foreground cursor-not-allowed opacity-75 select-none"
                    title="Horario reservado"
                  >
                    <div className="flex items-center gap-1 text-xs font-semibold text-destructive/80">
                      <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
                      <span>{slot.horaInicio} - {slot.horaFin}</span>
                    </div>
                    <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0 border-destructive/30 text-destructive">
                      {t("canchas.occupied")}
                    </Badge>
                  </div>
                )
              }

              return (
                <button
                  type="button"
                  key={`${slot.horaInicio}-${slot.horaFin}`}
                  onClick={() => onSelectSlot?.(slot.horaInicio, slot.horaFin)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all text-left group ${
                    isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary shadow-xs"
                      : "border-border bg-card hover:border-primary/50 hover:bg-accent/50 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-1 text-xs font-semibold text-foreground group-hover:text-primary">
                    <HugeiconsIcon icon={AlarmClockIcon} className="size-3 text-muted-foreground group-hover:text-primary" />
                    <span>{slot.horaInicio} - {slot.horaFin}</span>
                  </div>
                  <Badge
                    variant={isSelected ? "default" : "secondary"}
                    className="mt-1 text-[10px] px-1.5 py-0"
                  >
                    {isSelected ? (
                      <span className="flex items-center gap-1">
                        <HugeiconsIcon icon={Tick02Icon} className="size-2.5" />
                        Seleccionado
                      </span>
                    ) : (
                      t("canchas.available")
                    )}
                  </Badge>
                </button>
              )
            })}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground mt-3 text-center">
          {t("canchas.slotsDescription")}
        </p>
      </CardContent>
    </Card>
  )
}
