import * as React from "react"
import {
  getCanchas,
  deleteCancha,
  checkCanchaHasActiveReservations,
  type Cancha,
} from "@/lib/data"
import { useI18n } from "@/components/i18n/i18n-provider"
import { CanchaFormModal } from "@/components/canchas/CanchaFormModal"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Grid02Icon,
  BadgePlusIcon,
  PencilEdit01Icon,
  Delete01Icon,
  Refresh01Icon,
  Location01Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons"

export function AdminCanchasPage() {
  const { t, formatCurrency } = useI18n()
  const [canchas, setCanchas] = React.useState<Cancha[]>([])
  const [loading, setLoading] = React.useState(true)

  // Modal de crear/editar
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingCancha, setEditingCancha] = React.useState<Cancha | null>(null)

  // Modal de confirmación para eliminar
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [targetCancha, setTargetCancha] = React.useState<Cancha | null>(null)
  const [hasActiveRes, setHasActiveRes] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  const refreshData = React.useCallback(async () => {
    setLoading(true)
    try {
      const list = await getCanchas(false)
      setCanchas(list)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    let ignore = false
    getCanchas(false).then((list) => {
      if (!ignore) {
        setCanchas(list)
        setLoading(false)
      }
    })

    const handleUpdate = () => {
      getCanchas(false).then((list) => {
        if (!ignore) setCanchas(list)
      })
    }

    window.addEventListener("canchas-db-updated", handleUpdate)
    return () => {
      ignore = true
      window.removeEventListener("canchas-db-updated", handleUpdate)
    }
  }, [])

  const handleOpenCreate = () => {
    setEditingCancha(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (cancha: Cancha) => {
    setEditingCancha(cancha)
    setModalOpen(true)
  }

  const handlePromptDelete = async (cancha: Cancha) => {
    setTargetCancha(cancha)
    const hasActive = await checkCanchaHasActiveReservations(cancha.id)
    setHasActiveRes(hasActive)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!targetCancha) return
    setDeleting(true)
    try {
      const res = await deleteCancha(targetCancha.id)
      toast.success(res.message)
      setDeleteModalOpen(false)
      setTargetCancha(null)
      refreshData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar la cancha"
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon icon={Grid02Icon} className="size-6 text-current" />
            </div>
            {t("admin.canchasManagement")}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Crea, edita y administra las canchas deportivas y sus coordenadas de Google Maps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleOpenCreate} size="sm" className="gap-1.5 text-xs shadow-xs">
            <HugeiconsIcon icon={BadgePlusIcon} className="size-4" />
            <span>{t("admin.createCancha")}</span>
          </Button>
          <Button variant="outline" size="icon-sm" onClick={refreshData} title="Refrescar">
            <HugeiconsIcon icon={Refresh01Icon} className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Tabla de canchas */}
      <Card className="border-border overflow-hidden shadow-xs">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-xs">
                    <TableHead className="w-16">Foto</TableHead>
                    <TableHead>Cancha / Nombre</TableHead>
                    <TableHead>Dirección y Coordenadas</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Precio/h</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {canchas.map((c) => (
                    <TableRow key={c.id} className="text-xs hover:bg-muted/30">
                      <TableCell>
                        <img
                          src={c.imagen || "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=200&q=80"}
                          alt={c.nombre}
                          className="size-10 rounded-md object-cover border border-border shrink-0"
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        <div className="flex flex-col">
                          <span>{c.nombre}</span>
                          <span className="text-[11px] text-muted-foreground font-normal line-clamp-1 max-w-xs">
                            {c.descripcion}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="truncate text-muted-foreground">{c.direccion}</span>
                          <div className="flex items-center gap-1 text-[10px] text-primary">
                            <HugeiconsIcon icon={Location01Icon} className="size-3" />
                            <span>{c.lat.toFixed(4)}, {c.lng.toFixed(4)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {c.horarioApertura} - {c.horarioCierre}
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatCurrency(c.precioPorHora)}
                      </TableCell>
                      <TableCell>
                        {c.activa ? (
                          <Badge className="bg-emerald-600 text-white text-[10px] font-semibold">
                            Activa
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground border-destructive/30 text-destructive font-semibold">
                            Inactiva
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleOpenEdit(c)}
                            title={t("common.edit")}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <HugeiconsIcon icon={PencilEdit01Icon} className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handlePromptDelete(c)}
                            title={t("common.delete")}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <HugeiconsIcon icon={Delete01Icon} className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Crear / Editar Cancha */}
      <CanchaFormModal
        cancha={editingCancha}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={refreshData}
      />

      {/* Modal de Advertencia / Eliminación según AGENTS.md 3.1 */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-destructive flex items-center gap-2">
              <HugeiconsIcon icon={Alert02Icon} className="size-4" />
              Desactivar / Eliminar Cancha
            </DialogTitle>
            <DialogDescription className="text-xs pt-1 space-y-2">
              <p>
                ¿Deseas dar de baja la cancha <strong>{targetCancha?.nombre}</strong>?
              </p>
              {hasActiveRes ? (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                  ⚠️ <strong>Aviso de integridad (AGENTS.md sección 3.1):</strong> Esta cancha
                  tiene reservas futuras activas. Se aplicará un <em>soft delete</em> (desactivación
                  `activa: false`) para no dejar a los clientes sin su compromiso ni corromper el historial.
                </div>
              ) : (
                <p className="text-muted-foreground">
                  La cancha pasará a estar inactiva y no se mostrará para nuevas reservas al público.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? t("common.loading") : "Confirmar desactivación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
