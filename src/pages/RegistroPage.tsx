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
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { FootballIcon, BadgePlusIcon } from "@hugeicons/core-free-icons"

const registroSchema = z.object({
  nombre: z.string().min(2, "Ingresa tu nombre completo"),
  correo: z.string().email("Correo electrónico inválido"),
  password: z.string().min(4, "La contraseña debe tener al menos 4 caracteres"),
})

type RegistroFormValues = z.infer<typeof registroSchema>

export function RegistroPage() {
  const { register: authRegister } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistroFormValues>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      nombre: "",
      correo: "",
      password: "",
    },
  })

  const onSubmit = async (values: RegistroFormValues) => {
    setSubmitting(true)
    try {
      const newUser = await authRegister(values.nombre, values.correo, values.password)
      toast.success(`${t("auth.registerSuccess")} ¡Bienvenido ${newUser.nombre}!`)
      navigate("/canchas")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrar la cuenta"
      toast.error(msg)
    } finally {
      setSubmitting(false)
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
            {t("auth.registerTitle")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("auth.registerSubtitle")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div className="space-y-1">
              <Label htmlFor="reg-nombre" className="text-xs font-medium">
                {t("auth.name")}
              </Label>
              <Input
                id="reg-nombre"
                placeholder="Roberto Alvarado"
                {...register("nombre")}
                className="text-xs h-9"
              />
              {errors.nombre && (
                <p className="text-[11px] text-destructive">{errors.nombre.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="reg-correo" className="text-xs font-medium">
                {t("auth.email")}
              </Label>
              <Input
                id="reg-correo"
                type="email"
                placeholder="roberto@ejemplo.com"
                {...register("correo")}
                className="text-xs h-9"
              />
              {errors.correo && (
                <p className="text-[11px] text-destructive">{errors.correo.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="reg-password" className="text-xs font-medium">
                {t("auth.password")}
              </Label>
              <Input
                id="reg-password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className="text-xs h-9"
              />
              {errors.password && (
                <p className="text-[11px] text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" size="sm" disabled={submitting} className="w-full gap-2 mt-3">
              <HugeiconsIcon icon={BadgePlusIcon} className="size-4" />
              {submitting ? t("common.loading") : t("auth.createAccount")}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-0 text-center text-xs">
          <div className="text-muted-foreground">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              {t("auth.loginTitle")}
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
