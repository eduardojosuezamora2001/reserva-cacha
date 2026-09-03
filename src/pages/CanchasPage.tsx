import * as React from "react"
import { getCanchas, type Cancha } from "@/lib/data"
import { useI18n } from "@/components/i18n/i18n-provider"
import { CanchaCard } from "@/components/canchas/CanchaCard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiSearchIcon,
  FootballIcon,
  Refresh01Icon,
} from "@hugeicons/core-free-icons"

export function CanchasPage() {
  const { t } = useI18n()
  const [canchas, setCanchas] = React.useState<Cancha[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [onlyActive, setOnlyActive] = React.useState(true)

  const refreshCanchas = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getCanchas(false)
      setCanchas(data)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    let ignore = false
    getCanchas(false).then((data) => {
      if (!ignore) {
        setCanchas(data)
        setLoading(false)
      }
    })

    const handleUpdate = () => {
      getCanchas(false).then((data) => {
        if (!ignore) setCanchas(data)
      })
    }

    window.addEventListener("canchas-db-updated", handleUpdate)
    return () => {
      ignore = true
      window.removeEventListener("canchas-db-updated", handleUpdate)
    }
  }, [])

  const filtered = canchas.filter((c) => {
    if (onlyActive && !c.activa) return false
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    return (
      c.nombre.toLowerCase().includes(term) ||
      c.descripcion.toLowerCase().includes(term) ||
      c.direccion.toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-6">
      {/* Banner de bienvenida */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-accent/20 p-6 md:p-8 border border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-semibold">
            <HugeiconsIcon icon={FootballIcon} className="size-3.5" />
            <span>{t("common.appName")}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground tracking-tight">
            {t("canchas.title")}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            {t("canchas.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOnlyActive(!onlyActive)}
            className="text-xs"
          >
            {onlyActive ? "Mostrando solo activas" : "Mostrando todas"}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={refreshCanchas}
            title="Refrescar"
            className="text-muted-foreground"
          >
            <HugeiconsIcon icon={Refresh01Icon} className="size-4" />
          </Button>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <HugeiconsIcon icon={AiSearchIcon} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("common.search")}
            className="pl-9 h-9 text-xs bg-background"
          />
        </div>
      </div>

      {/* Grid de canchas */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-4 space-y-3">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-border rounded-xl">
          <HugeiconsIcon icon={FootballIcon} className="size-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-serif font-semibold text-base text-foreground">
            {t("canchas.noCanchas")}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Intenta con otro término de búsqueda o cambia los filtros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((cancha) => (
            <CanchaCard key={cancha.id} cancha={cancha} />
          ))}
        </div>
      )}
    </div>
  )
}
