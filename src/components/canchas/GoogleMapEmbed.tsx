import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import { Location01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { useI18n } from "@/components/i18n/i18n-provider"

interface GoogleMapEmbedProps {
  lat: number
  lng: number
  direccion: string
  canchaNombre?: string
  className?: string
  height?: number | string
}

export function GoogleMapEmbed({
  lat,
  lng,
  direccion,
  canchaNombre,
  className = "",
  height = 300,
}: GoogleMapEmbedProps) {
  const { t } = useI18n()

  // Soporte para API Key opcional configurada en entorno
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  // URL de Google Maps oficial o fallback seguro de embed
  const mapSrc = apiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=15`
    : `https://maps.google.com/maps?q=${lat},${lng}&hl=es&z=15&output=embed`

  const externalMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
            <HugeiconsIcon icon={Location01Icon} className="size-4" />
          </div>
          <span className="text-xs sm:text-sm font-medium text-foreground truncate" title={direccion}>
            {direccion}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-[10px] font-mono">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </Badge>
          <a
            href={externalMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Button variant="ghost" size="xs" className="gap-1 text-xs text-primary hover:text-primary/80">
              <span>{t("canchas.openInMaps")}</span>
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" />
            </Button>
          </a>
        </div>
      </div>

      <div className="relative w-full rounded-xl overflow-hidden border border-border bg-muted/40 shadow-xs">
        <iframe
          title={`Mapa de ${canchaNombre || "cancha"}`}
          src={mapSrc}
          width="100%"
          height={typeof height === "number" ? `${height}px` : height}
          style={{ border: 0 }}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full grayscale-25 contrast-105"
        />
      </div>
    </div>
  )
}
