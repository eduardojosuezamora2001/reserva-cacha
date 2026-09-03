import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useI18n } from "@/components/i18n/i18n-provider"
import {
  createCancha,
  updateCancha,
  type Cancha,
  type CreateCanchaInput,
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
  Location01Icon,
  FootballIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"

const canchaSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  descripcion: z.string().optional(),
  direccion: z.string().min(5, "Ingresa una dirección detallada"),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  horarioApertura: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
  horarioCierre: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
  precioPorHora: z.coerce.number().min(0).optional(),
  activa: z.boolean().default(true),
  imagen: z.string().url("URL de imagen inválida").optional().or(z.literal("")),
})

type CanchaFormValues = z.infer<typeof canchaSchema>

interface CanchaFormModalProps {
  cancha?: Cancha | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const UBICACION_PRESETS = [
  { nombre: "San José, La California", lat: 9.9333, lng: -84.0722, direccion: "Av. Central 450, Barrio La California, San José, Costa Rica" },
  { nombre: "Parque La Sabana", lat: 9.9388, lng: -84.1018, direccion: "Costado Norte Parque La Sabana, San José, Costa Rica" },
  { nombre: "Escazú, Multiplaza", lat: 9.9431, lng: -84.1485, direccion: "200m Oeste de Multiplaza Escazú, San José, Costa Rica" },
  { nombre: "San Pedro, Hispanidad", lat: 9.9328, lng: -84.0531, direccion: "San Pedro, 100m Este de la Fuente de la Hispanidad, San José, Costa Rica" },
]

export function CanchaFormModal({
  cancha,
  open,
  onOpenChange,
  onSuccess,
}: CanchaFormModalProps) {
  const { t } = useI18n()
  const [submitting, setSubmitting] = React.useState(false)

  const isEditing = !!cancha

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CanchaFormValues>({
    resolver: zodResolver(canchaSchema) as never,
    defaultValues: {
      nombre: "",
      descripcion: "",
      direccion: "",
      lat: 9.9333,
      lng: -84.0722,
      horarioApertura: "08:00",
      horarioCierre: "23:00",
      precioPorHora: 25000,
      activa: true,
      imagen: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1200&q=80",
    },
  })

  const currentLat = watch("lat")
  const currentLng = watch("lng")

  React.useEffect(() => {
    if (cancha) {
      reset({
        nombre: cancha.nombre,
        descripcion: cancha.descripcion,
        direccion: cancha.direccion,
        lat: cancha.lat,
        lng: cancha.lng,
        horarioApertura: cancha.horarioApertura,
        horarioCierre: cancha.horarioCierre,
        precioPorHora: cancha.precioPorHora || 0,
        activa: cancha.activa,
        imagen: cancha.imagen || "",
      })
    } else {
      reset({
        nombre: "",
        descripcion: "",
        direccion: UBICACION_PRESETS[0].direccion,
        lat: UBICACION_PRESETS[0].lat,
        lng: UBICACION_PRESETS[0].lng,
        horarioApertura: "08:00",
        horarioCierre: "23:00",
        precioPorHora: 25000,
        activa: true,
        imagen: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1200&q=80",
      })
    }
  }, [cancha, reset])

  const onSubmit = async (values: CanchaFormValues) => {
    setSubmitting(true)
    try {
      const payload: CreateCanchaInput = {
        nombre: values.nombre,
        descripcion: values.descripcion || "",
        direccion: values.direccion,
        lat: Number(values.lat),
        lng: Number(values.lng),
        horarioApertura: values.horarioApertura,
        horarioCierre: values.horarioCierre,
        precioPorHora: values.precioPorHora ? Number(values.precioPorHora) : undefined,
        activa: values.activa,
        imagen: values.imagen || undefined,
      }

      if (isEditing && cancha) {
        await updateCancha(cancha.id, payload)
        toast.success(t("admin.canchaUpdated"))
      } else {
        await createCancha(payload)
        toast.success(t("admin.canchaCreated"))
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar la cancha"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const applyPreset = (preset: (typeof UBICACION_PRESETS)[0]) => {
    setValue("lat", preset.lat)
    setValue("lng", preset.lng)
    setValue("direccion", preset.direccion)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <HugeiconsIcon icon={FootballIcon} className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                {isEditing ? t("admin.editCancha") : t("admin.createCancha")}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isEditing ? "Modifica los datos de la cancha" : "Registra una nueva cancha con ubicación en mapa"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="c-nombre" className="text-xs font-medium">
              {t("admin.canchaForm.nameLabel")} *
            </Label>
            <Input
              id="c-nombre"
              placeholder="Ej: Cancha 5 - Estadio Azul"
              {...register("nombre")}
              className="text-xs h-8"
            />
            {errors.nombre && (
              <p className="text-[11px] text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="c-desc" className="text-xs font-medium">
              {t("admin.canchaForm.descLabel")}
            </Label>
            <Textarea
              id="c-desc"
              rows={2}
              placeholder="Césped sintético, iluminación LED, vestuarios..."
              {...register("descripcion")}
              className="text-xs"
            />
          </div>

          {/* Integración Google Maps y Ubicación */}
          <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <HugeiconsIcon icon={Location01Icon} className="size-4 text-primary" />
                <span>Ubicación y Google Maps</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Places & Coordenadas</span>
            </div>

            {/* Presets rápidos */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] text-muted-foreground mr-1">Lugares rápidos:</span>
              {UBICACION_PRESETS.map((p) => (
                <Button
                  key={p.nombre}
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => applyPreset(p)}
                  className="text-[10px] h-6 px-2 bg-background hover:border-primary/40"
                >
                  {p.nombre}
                </Button>
              ))}
            </div>

            <div className="space-y-1">
              <Label htmlFor="c-direccion" className="text-xs font-medium">
                {t("admin.canchaForm.addressLabel")} *
              </Label>
              <Input
                id="c-direccion"
                placeholder="Dirección formateada por Google Places..."
                {...register("direccion")}
                className="text-xs h-8 bg-background"
              />
              {errors.direccion && (
                <p className="text-[11px] text-destructive">{errors.direccion.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="c-lat" className="text-xs font-medium">
                  {t("admin.canchaForm.latLabel")}
                </Label>
                <Input
                  id="c-lat"
                  type="number"
                  step="any"
                  {...register("lat")}
                  className="text-xs h-8 bg-background"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="c-lng" className="text-xs font-medium">
                  {t("admin.canchaForm.lngLabel")}
                </Label>
                <Input
                  id="c-lng"
                  type="number"
                  step="any"
                  {...register("lng")}
                  className="text-xs h-8 bg-background"
                />
              </div>
            </div>

            {/* Preview interactivo de mapa */}
            {currentLat && currentLng && (
              <div className="rounded-lg overflow-hidden border border-border h-36 relative">
                <iframe
                  title="Preview de mapa"
                  src={`https://maps.google.com/maps?q=${currentLat},${currentLng}&hl=es&z=15&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  className="grayscale-25"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="c-apertura" className="text-xs font-medium">
                {t("admin.canchaForm.openingLabel")}
              </Label>
              <Input
                id="c-apertura"
                type="time"
                {...register("horarioApertura")}
                className="text-xs h-8"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="c-cierre" className="text-xs font-medium">
                {t("admin.canchaForm.closingLabel")}
              </Label>
              <Input
                id="c-cierre"
                type="time"
                {...register("horarioCierre")}
                className="text-xs h-8"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="c-precio" className="text-xs font-medium">
                {t("admin.canchaForm.priceLabel")}
              </Label>
              <Input
                id="c-precio"
                type="number"
                step="1000"
                {...register("precioPorHora")}
                className="text-xs h-8"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="c-imagen" className="text-xs font-medium">
              {t("admin.canchaForm.imageLabel")}
            </Label>
            <Input
              id="c-imagen"
              placeholder="https://..."
              {...register("imagen")}
              className="text-xs h-8"
            />
            {errors.imagen && (
              <p className="text-[11px] text-destructive">{errors.imagen.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="c-activa"
              {...register("activa")}
              className="size-4 rounded border-border text-primary accent-primary"
            />
            <Label htmlFor="c-activa" className="text-xs font-medium cursor-pointer">
              {t("admin.canchaForm.activeLabel")}
            </Label>
          </div>

          <DialogFooter className="pt-3">
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
