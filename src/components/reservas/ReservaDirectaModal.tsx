import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/components/i18n/i18n-provider"
import { createReservaDirecta, type Cancha } from "@/lib/data"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { FootballIcon, Tick02Icon } from "@hugeicons/core-free-icons"

const reservaSchema = z.object({
  fecha: z.string().min(1, "La fecha es requerida"),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm requerido"),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm requerido"),
  telefono: z.string().optional(),
  notas: z.string().optional(),
})

type ReservaFormValues = z.infer<typeof reservaSchema>

interface ReservaDirectaModalProps {
  cancha: Cancha
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDate?: string
  initialSlot?: { horaInicio: string; horaFin: string } | null
  onSuccess?: () => void
}

export function ReservaDirectaModal({
  cancha,
  open,
  onOpenChange,
  initialDate,
  initialSlot,
  onSuccess,
}: ReservaDirectaModalProps) {
  const { user } = useAuth()
  const { t, formatCurrency } = useI18n()
  const [submitting, setSubmitting] = React.useState(false)

  const defaultDate = initialDate || new Date().toISOString().split("T")[0]
  const defaultStart = initialSlot?.horaInicio || "18:00"
  const defaultEnd = initialSlot?.horaFin || "19:00"

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ReservaFormValues>({
    resolver: zodResolver(reservaSchema),
    defaultValues: {
      fecha: defaultDate,
      horaInicio: defaultStart,
      horaFin: defaultEnd,
      telefono: "",
      notas: "",
    },
  })

  // Sincronizar si cambia slot seleccionado desde timeline
  React.useEffect(() => {
    if (initialDate) setValue("fecha", initialDate)
    if (initialSlot?.horaInicio) setValue("horaInicio", initialSlot.horaInicio)
    if (initialSlot?.horaFin) setValue("horaFin", initialSlot.horaFin)
  }, [initialDate, initialSlot, setValue])

  const onSubmit = async (values: ReservaFormValues) => {
    if (!user) {
      toast.error("Debes iniciar sesión para realizar una reserva directa.")
      return
    }

    setSubmitting(true)
    try {
      await createReservaDirecta({
        canchaId: cancha.id,
        userId: user.id,
        nombreSolicitante: user.nombre,
        correoSolicitante: user.correo,
        telefonoSolicitante: values.telefono,
        fecha: values.fecha,
        horaInicio: values.horaInicio,
        horaFin: values.horaFin,
        notas: values.notas,
      })

      toast.success(t("reservas.bookingSuccess"))
      onOpenChange(false)
      onSuccess?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar la reserva"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <HugeiconsIcon icon={FootballIcon} className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                {t("reservas.directBookingTitle")}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {cancha.nombre} • {formatCurrency(cancha.precioPorHora)}/h
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 pt-1">
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/80 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t("reservas.clientName")}:</span>
            <span className="font-semibold text-foreground">{user?.nombre} ({user?.correo})</span>
          </div>

          <div className="space-y-1">
            <Label htmlFor="fecha" className="text-xs font-medium">
              {t("common.date")}
            </Label>
            <Input
              id="fecha"
              type="date"
              min={new Date().toISOString().split("T")[0]}
              {...register("fecha")}
              className="text-xs h-8"
            />
            {errors.fecha && (
              <p className="text-[11px] text-destructive">{errors.fecha.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="horaInicio" className="text-xs font-medium">
                {t("guestForm.startTime")}
              </Label>
              <Input
                id="horaInicio"
                type="time"
                {...register("horaInicio")}
                className="text-xs h-8"
              />
              {errors.horaInicio && (
                <p className="text-[11px] text-destructive">{errors.horaInicio.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="horaFin" className="text-xs font-medium">
                {t("guestForm.endTime")}
              </Label>
              <Input
                id="horaFin"
                type="time"
                {...register("horaFin")}
                className="text-xs h-8"
              />
              {errors.horaFin && (
                <p className="text-[11px] text-destructive">{errors.horaFin.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="telefono" className="text-xs font-medium">
              {t("common.phone")} ({t("common.optional")})
            </Label>
            <Input
              id="telefono"
              placeholder="+506 8888 1111"
              {...register("telefono")}
              className="text-xs h-8"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="notas" className="text-xs font-medium">
              {t("common.notes")} ({t("common.optional")})
            </Label>
            <Textarea
              id="notas"
              rows={2}
              placeholder="Ej: Balón prestado, chalecos..."
              {...register("notas")}
              className="text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
            <Badge variant="secondary" className="text-[10px] px-1 py-0 font-semibold">
              CONFIRMACIÓN INMEDIATA
            </Badge>
            <span>Tu horario se reserva en tiempo real en la base de datos.</span>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
              <HugeiconsIcon icon={Tick02Icon} className="size-3.5" />
              {submitting ? t("common.loading") : t("common.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
