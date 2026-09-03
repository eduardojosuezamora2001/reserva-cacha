import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useI18n } from "@/components/i18n/i18n-provider"
import {
  createSolicitudVisitante,
  buildWhatsAppLink,
  type Cancha,
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
import {
  WhatsappIcon,
  InformationCircleIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"

const solicitudSchema = z.object({
  nombre: z.string().min(2, "Ingresa tu nombre completo"),
  correo: z.string().email("Correo electrónico inválido"),
  telefono: z.string().min(8, "Ingresa un número de teléfono/WhatsApp válido"),
  fecha: z.string().min(1, "La fecha es requerida"),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
  notas: z.string().optional(),
})

type SolicitudFormValues = z.infer<typeof solicitudSchema>

interface SolicitudVisitanteModalProps {
  cancha: Cancha
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDate?: string
  initialSlot?: { horaInicio: string; horaFin: string } | null
  onSuccess?: () => void
}

export function SolicitudVisitanteModal({
  cancha,
  open,
  onOpenChange,
  initialDate,
  initialSlot,
  onSuccess,
}: SolicitudVisitanteModalProps) {
  const { t, locale, formatCurrency } = useI18n()
  const [submitting, setSubmitting] = React.useState(false)
  const [createdWaUrl, setCreatedWaUrl] = React.useState<string | null>(null)

  const defaultDate = initialDate || new Date().toISOString().split("T")[0]
  const defaultStart = initialSlot?.horaInicio || "18:00"
  const defaultEnd = initialSlot?.horaFin || "19:00"

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SolicitudFormValues>({
    resolver: zodResolver(solicitudSchema),
    defaultValues: {
      nombre: "",
      correo: "",
      telefono: "",
      fecha: defaultDate,
      horaInicio: defaultStart,
      horaFin: defaultEnd,
      notas: "",
    },
  })

  React.useEffect(() => {
    if (initialDate) setValue("fecha", initialDate)
    if (initialSlot?.horaInicio) setValue("horaInicio", initialSlot.horaInicio)
    if (initialSlot?.horaFin) setValue("horaFin", initialSlot.horaFin)
  }, [initialDate, initialSlot, setValue])

  const onSubmit = async (values: SolicitudFormValues) => {
    setSubmitting(true)
    try {
      /**
       * NOTA DE ARQUITECTURA / INTEGRACIÓN WHATSAPP:
       * -------------------------------------------------------------
       * En un sistema con backend real (Node.js, Supabase, Cloud Functions):
       * 1. Se llamaría a un endpoint POST /api/solicitudes
       * 2. El servidor dispararía el mensaje mediante Meta WhatsApp Cloud API
       *    o Twilio Programmable Messaging con templates aprobados:
       *    await twilioClient.messages.create({
       *      from: 'whatsapp:+14155238886',
       *      to: `whatsapp:${adminPhone}`,
       *      body: templateMessage
       *    });
       * 3. Como este proyecto es una simulación frontend sin servidor,
       *    generamos un enlace 'wa.me' enriquecido y lo abrimos automáticamente.
       */
      await createSolicitudVisitante({
        canchaId: cancha.id,
        nombreSolicitante: values.nombre,
        correoSolicitante: values.correo,
        telefonoSolicitante: values.telefono,
        fecha: values.fecha,
        horaInicio: values.horaInicio,
        horaFin: values.horaFin,
        notas: values.notas,
      })

      // Generar link wa.me con los datos capturados
      const waUrl = buildWhatsAppLink(
        cancha.nombre,
        values.nombre,
        values.correo,
        values.fecha,
        values.horaInicio,
        values.horaFin,
        "50688889999", // Teléfono del negocio/admin
        locale
      )

      setCreatedWaUrl(waUrl)

      // Intentar abrir WhatsApp en pestaña nueva
      try {
        window.open(waUrl, "_blank", "noopener,noreferrer")
      } catch (e) {
        console.warn("Popup de WhatsApp bloqueado por el navegador:", e)
      }

      toast.success(t("reservas.requestSuccess"))
      onSuccess?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar la solicitud"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setCreatedWaUrl(null)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <HugeiconsIcon icon={WhatsappIcon} className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                {t("reservas.guestRequestTitle")}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {cancha.nombre} • {formatCurrency(cancha.precioPorHora)}/h
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {createdWaUrl ? (
          // Vista de confirmación con botón de WhatsApp
          <div className="space-y-4 py-3 text-center">
            <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <HugeiconsIcon icon={Tick02Icon} className="size-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">{t("reservas.requestSuccess")}</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {t("whatsapp.openDesc")}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={createdWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <HugeiconsIcon icon={WhatsappIcon} className="size-4" />
                  {t("whatsapp.openButton")}
                </Button>
              </a>
              <Button variant="outline" size="sm" onClick={handleClose}>
                {t("common.close")}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="g-nombre" className="text-xs font-medium">
                  {t("guestForm.name")} *
                </Label>
                <Input
                  id="g-nombre"
                  placeholder={t("guestForm.namePlaceholder")}
                  {...register("nombre")}
                  className="text-xs h-8"
                />
                {errors.nombre && (
                  <p className="text-[11px] text-destructive">{errors.nombre.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="g-telefono" className="text-xs font-medium">
                  {t("guestForm.phone")} *
                </Label>
                <Input
                  id="g-telefono"
                  placeholder={t("guestForm.phonePlaceholder")}
                  {...register("telefono")}
                  className="text-xs h-8"
                />
                {errors.telefono && (
                  <p className="text-[11px] text-destructive">{errors.telefono.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="g-correo" className="text-xs font-medium">
                {t("guestForm.email")} *
              </Label>
              <Input
                id="g-correo"
                type="email"
                placeholder={t("guestForm.emailPlaceholder")}
                {...register("correo")}
                className="text-xs h-8"
              />
              {errors.correo && (
                <p className="text-[11px] text-destructive">{errors.correo.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="g-fecha" className="text-xs font-medium">
                {t("guestForm.date")} *
              </Label>
              <Input
                id="g-fecha"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                {...register("fecha")}
                className="text-xs h-8"
              />
              {errors.fecha && (
                <p className="text-[11px] text-destructive">{errors.fecha.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="g-horaInicio" className="text-xs font-medium">
                  {t("guestForm.startTime")} *
                </Label>
                <Input
                  id="g-horaInicio"
                  type="time"
                  {...register("horaInicio")}
                  className="text-xs h-8"
                />
                {errors.horaInicio && (
                  <p className="text-[11px] text-destructive">{errors.horaInicio.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="g-horaFin" className="text-xs font-medium">
                  {t("guestForm.endTime")} *
                </Label>
                <Input
                  id="g-horaFin"
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
              <Label htmlFor="g-notas" className="text-xs font-medium">
                {t("guestForm.notes")} ({t("common.optional")})
              </Label>
              <Textarea
                id="g-notas"
                rows={2}
                placeholder={t("guestForm.notesPlaceholder")}
                {...register("notas")}
                className="text-xs"
              />
            </div>

            <div className="p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-start gap-2 text-[11px]">
              <HugeiconsIcon icon={InformationCircleIcon} className="size-3.5 shrink-0 mt-0.5" />
              <span>{t("guestForm.whatsappInfo")}</span>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={submitting}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <HugeiconsIcon icon={WhatsappIcon} className="size-3.5" />
                {submitting ? t("common.loading") : t("guestForm.submit")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
