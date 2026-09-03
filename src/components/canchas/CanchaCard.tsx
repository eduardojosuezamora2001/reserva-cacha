import { Link } from "react-router-dom"
import type { Cancha } from "@/lib/data"
import { useI18n } from "@/components/i18n/i18n-provider"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Location01Icon,
  AlarmClockIcon,
  ArrowRight01Icon,
  FootballIcon,
} from "@hugeicons/core-free-icons"

interface CanchaCardProps {
  cancha: Cancha
}

export function CanchaCard({ cancha }: CanchaCardProps) {
  const { t, formatCurrency } = useI18n()

  return (
    <Card className="flex flex-col overflow-hidden border-border/80 bg-card hover:border-primary/50 transition-all duration-200 hover:shadow-md group">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <img
          src={cancha.imagen || "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80"}
          alt={cancha.nombre}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          {cancha.activa ? (
            <Badge className="bg-emerald-600/90 hover:bg-emerald-600 text-white text-[10px] backdrop-blur-xs font-semibold">
              {t("canchas.activePitch")}
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-[10px] backdrop-blur-xs font-semibold">
              {t("canchas.inactivePitch")}
            </Badge>
          )}
        </div>

        {cancha.precioPorHora && (
          <div className="absolute bottom-2.5 left-2.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-background/90 text-foreground text-xs font-bold shadow-xs backdrop-blur-xs">
              {formatCurrency(cancha.precioPorHora)}
              <span className="text-[10px] font-normal text-muted-foreground ml-1">
                {t("common.perHour")}
              </span>
            </span>
          </div>
        )}
      </div>

      <CardHeader className="p-4 pb-2">
        <h3 className="font-serif font-bold text-base text-foreground leading-snug group-hover:text-primary transition-colors">
          {cancha.nombre}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
          {cancha.descripcion}
        </p>
      </CardHeader>

      <CardContent className="p-4 pt-1 flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <HugeiconsIcon icon={Location01Icon} className="size-3.5 text-primary shrink-0" />
          <span className="truncate">{cancha.direccion}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <HugeiconsIcon icon={AlarmClockIcon} className="size-3.5 text-primary shrink-0" />
          <span>
            {cancha.horarioApertura} - {cancha.horarioCierre}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Link to={`/canchas/${cancha.id}`} className="w-full">
          <Button variant="default" size="sm" className="w-full justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={FootballIcon} className="size-3.5" />
              {t("canchas.reserveNow")}
            </span>
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
