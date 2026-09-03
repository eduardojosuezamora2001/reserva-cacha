import * as React from "react"
import { useTheme, type AppTheme } from "@/components/theme-provider"
import { useI18n, type Locale } from "@/components/i18n/i18n-provider"
import { resetToSeedData } from "@/lib/data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  AccountSetting01Icon,
  Sun01Icon,
  Globe02Icon,
  Refresh01Icon,
  Tick02Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons"

export function ConfiguracionPage() {
  const { theme, setTheme, themes } = useTheme()
  const { locale, setLocale, t } = useI18n()

  const [resetModalOpen, setResetModalOpen] = React.useState(false)
  const [resetting, setResetting] = React.useState(false)

  const handleResetData = async () => {
    setResetting(true)
    try {
      await resetToSeedData()
      toast.success(t("common.resetDemoSuccess"))
      setResetModalOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al reiniciar los datos"
      toast.error(msg)
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground tracking-tight flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <HugeiconsIcon icon={AccountSetting01Icon} className="size-6 text-current" />
          </div>
          {t("navigation.settings")}
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Personaliza la apariencia, el idioma y los datos de prueba de la aplicación.
        </p>
      </div>

      {/* Selector de Temas (4 temas) */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <HugeiconsIcon icon={Sun01Icon} className="size-4 text-primary" />
            Temas de Color (Theming)
          </CardTitle>
          <CardDescription className="text-xs">
            Selecciona entre los 4 esquemas de color integrados con tokens semánticos de shadcn.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themes.map((th) => {
              const isSelected = theme === th.id
              return (
                <button
                  type="button"
                  key={th.id}
                  onClick={() => setTheme(th.id as AppTheme)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary shadow-xs"
                      : "border-border hover:border-border/80 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="size-8 rounded-lg shadow-xs flex items-center justify-center border border-black/10"
                      style={{ backgroundColor: th.primaryColor }}
                    >
                      <div
                        className="size-3 rounded-full border border-white/50"
                        style={{ backgroundColor: th.accentColor }}
                      />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        {locale === "es" ? th.labelEs : th.labelEn}
                      </span>
                      <span className="text-[11px] text-muted-foreground capitalize">
                        Modo {th.mode === "dark" ? "Oscuro" : "Claro"}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Badge variant="default" className="text-[10px] px-2 py-0.5 gap-1 font-semibold">
                      <HugeiconsIcon icon={Tick02Icon} className="size-3" />
                      Activo
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selector de Idioma (i18n) */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <HugeiconsIcon icon={Globe02Icon} className="size-4 text-primary" />
            {t("navigation.language")} (i18n)
          </CardTitle>
          <CardDescription className="text-xs">
            Cambia el idioma de toda la interfaz y las plantillas de WhatsApp.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
            {[
              { id: "es" as Locale, label: "Español", flag: "🇨🇷", desc: "Predeterminado (Costa Rica)" },
              { id: "en" as Locale, label: "English", flag: "🇺🇸", desc: "Standard English" },
            ].map((lang) => {
              const isSelected = locale === lang.id
              return (
                <button
                  type="button"
                  key={lang.id}
                  onClick={() => setLocale(lang.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary shadow-xs"
                      : "border-border hover:border-border/80 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{lang.flag}</span>
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        {lang.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {lang.desc}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <HugeiconsIcon icon={Tick02Icon} className="size-4 text-primary" />
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Restablecer datos de ejemplo */}
      <Card className="border-destructive/30 bg-destructive/5 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <HugeiconsIcon icon={Refresh01Icon} className="size-4 text-destructive" />
            {t("common.resetDemo")}
          </CardTitle>
          <CardDescription className="text-xs">
            Restaura la base de datos simulada en memoria y localStorage a los datos originales de db.json.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
            <HugeiconsIcon icon={InformationCircleIcon} className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            <span>
              Útil para volver a la configuración inicial de demostración si has creado reservas de prueba o modificado canchas.
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setResetModalOpen(true)}
            className="text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            {t("common.resetDemo")}
          </Button>
        </CardContent>
      </Card>

      {/* Dialog de confirmación de Reset */}
      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <HugeiconsIcon icon={Refresh01Icon} className="size-4 text-destructive" />
              {t("common.resetDemo")}
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              {t("common.resetDemoConfirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetModalOpen(false)}
              disabled={resetting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleResetData}
              disabled={resetting}
            >
              {resetting ? t("common.loading") : "Sí, restablecer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
