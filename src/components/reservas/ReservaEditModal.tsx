import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useI18n } from "@/components/i18n/i18n-provider"
import {
  modificarReserva,
  type Cancha,
  type Reserva,
  type ReservaEstado,
} from "@/lib/data"
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
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar01Icon, Tick02Icon } from "@hugeicons/core-free-icons"

const editSchema = z.object({
  fecha: z.string().min(1, "La fecha es requerida"),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
  estado: z.enum(["pendiente", "confirmada", "cancelada", "rechazada"]),
  notas: z.string().optional(),
})

type EditFormValues = z.infer<typeof editSchema>

interface ReservaEditModalProps {
  reserva: Reserva | null
  cancha?: Cancha | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ReservaEditModal({
  reserva,
  cancha,
  open,
  onOpenChange,
  onSuccess,
}: ReservaEditModalProps) {
  const { t } = useI18n()
  const [submitting, setSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      fecha: "",
      horaInicio: "",
      horaFin: "",
      estado: "confirmada",
      notas: "",
    },
  })

  React.useEffect(() => {
    if (reserva) {
      reset({
        fecha: reserva.fecha,
        horaInicio: reserva.horaInicio,
        horaFin: reserva.horaFin,
        estado: reserva.estado,
        notas: reserva.notas || "",
      })
    }
  }, [reserva, reset])

  const onSubmit = async (values: EditFormValues) => {
    if (!reserva) return
    setSubmitting(true)
    try {
      await modificarReserva(reserva.id, {
        fecha: values.fecha,
        horaInicio: values.horaInicio,
        horaFin: values.horaFin,
        estado: values.estado as ReservaEstado,
        notas: values.notas,
      })

      toast.success(t("admin.modifySuccess"))
      onOpenChange(false)
      onSuccess?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al modificar la reserva"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!reserva) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <HugeiconsIcon icon={Calendar01Icon} className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                {t("admin.modify")}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {cancha?.nombre || "Cancha"} • Solicitante: {reserva.nombreSolicitante}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label htmlFor="ed-fecha" className="text-xs font-medium">
              {t("common.date")}
            </Label>
            <Input
              id="ed-fecha"
              type="date"
              {...register("fecha")}
              className="text-xs h-8"
            />
            {errors.fecha && (
              <p className="text-[11px] text-destructive">{errors.fecha.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ed-horaInicio" className="text-xs font-medium">
                {t("guestForm.startTime")}
              </Label>
              <Input
                id="ed-horaInicio"
                type="time"
                {...register("horaInicio")}
                className="text-xs h-8"
              />
              {errors.horaInicio && (
                <p className="text-[11px] text-destructive">{errors.horaInicio.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="ed-horaFin" className="text-xs font-medium">
                {t("guestForm.endTime")}
              </Label>
              <Input
                id="ed-horaFin"
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
            <Label htmlFor="ed-estado" className="text-xs font-medium">
              {t("common.status")}
            </Label>
            <select
              id="ed-estado"
              {...register("estado")}
              className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
            >
              <option value="confirmada">{t("reservas.status.confirmada")}</option>
              <option value="pendiente">{t("reservas.status.pendiente")}</option>
              <option value="cancelada">{t("reservas.status.cancelada")}</option>
              <option value="rechazada">{t("reservas.status.rechazada")}</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="ed-notas" className="text-xs font-medium">
              {t("common.notes")}
            </Label>
            <Textarea
              id="ed-notas"
              rows={2}
              {...register("notas")}
              className="text-xs"
            />
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
              {submitting ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
