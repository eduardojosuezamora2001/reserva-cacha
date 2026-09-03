import * as React from "react"
import { useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/components/i18n/i18n-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { FootballIcon, Login01Icon } from "@hugeicons/core-free-icons"

const loginSchema = z.object({
  correo: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login, switchRole } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      correo: "carlos@cliente.com",
      password: "cliente123",
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitting(true)
    try {
      const loggedUser = await login(values.correo, values.password)
      toast.success(`${t("auth.loginSuccess")} ${loggedUser.nombre}`)
      if (loggedUser.rol === "admin") {
        navigate("/admin")
      } else {
        navigate("/canchas")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al iniciar sesión"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickLogin = (role: "admin" | "cliente") => {
    switchRole(role)
    toast.success(`${t("auth.loginSuccess")} (${role.toUpperCase()})`)
    if (role === "admin") {
      navigate("/admin")
    } else {
      navigate("/canchas")
    }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <Card className="border-border shadow-md">
        <CardHeader className="text-center pb-4">
          <div className="size-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2 shadow-sm">
            <HugeiconsIcon icon={FootballIcon} className="size-6 text-current" />
          </div>
          <CardTitle className="text-xl font-serif font-bold">
            {t("auth.loginTitle")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("auth.loginSubtitle")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Botones de acceso rápido Demo */}
          <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              {t("auth.demoAccounts")}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => handleQuickLogin("admin")}
                className="text-xs justify-start h-8 font-medium border-primary/30 text-primary hover:bg-primary/10"
              >
                👑 Admin Pro
              </Button>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => handleQuickLogin("cliente")}
                className="text-xs justify-start h-8 font-medium"
              >
                ⚽ Carlos (Cliente)
              </Button>
            </div>
          </div>

          <div className="relative flex items-center justify-center text-xs">
            <Separator />
            <span className="bg-card px-2 text-muted-foreground text-[11px]">o con credenciales</span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div className="space-y-1">
              <Label htmlFor="correo" className="text-xs font-medium">
                {t("auth.email")}
              </Label>
              <Input
                id="correo"
                type="email"
                placeholder="admin@canchas.com"
                {...register("correo")}
                className="text-xs h-9"
              />
              {errors.correo && (
                <p className="text-[11px] text-destructive">{errors.correo.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs font-medium">
                {t("auth.password")}
              </Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                className="text-xs h-9"
              />
              {errors.password && (
                <p className="text-[11px] text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" size="sm" disabled={submitting} className="w-full gap-2 mt-2">
              <HugeiconsIcon icon={Login01Icon} className="size-4" />
              {submitting ? t("common.loading") : t("auth.enter")}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-0 text-center text-xs">
          <div className="text-muted-foreground">
            {t("auth.dontHaveAccount")}{" "}
            <Link to="/registro" className="text-primary font-medium hover:underline">
              {t("auth.registerTitle")}
            </Link>
          </div>
          <Link to="/canchas" className="text-[11px] text-muted-foreground hover:text-foreground">
            {t("auth.guestContinue")}
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
