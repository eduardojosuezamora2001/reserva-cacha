import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/components/i18n/i18n-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, Login01Icon, FootballIcon } from "@hugeicons/core-free-icons"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "admin" | "cliente"
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isAdmin } = useAuth()
  const { t } = useI18n()

  if (requiredRole === "admin" && !isAdmin) {
    return (
      <div className="max-w-md mx-auto py-12">
        <Card className="border-destructive/40 shadow-md">
          <CardContent className="pt-6 space-y-4">
            <Alert variant="destructive">
              <HugeiconsIcon icon={Alert02Icon} className="size-4 shrink-0" />
              <AlertTitle className="font-semibold">Acceso restringido</AlertTitle>
              <AlertDescription className="text-xs">
                Esta sección requiere privilegios de Administrador. Tu cuenta actual{" "}
                {user ? `(${user.nombre})` : "(sin sesión)"} no tiene los permisos necesarios.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/login" className="w-full">
                <Button className="w-full gap-2">
                  <HugeiconsIcon icon={Login01Icon} className="size-4" />
                  Iniciar sesión como Admin
                </Button>
              </Link>
              <Link to="/canchas" className="w-full">
                <Button variant="outline" className="w-full gap-2">
                  <HugeiconsIcon icon={FootballIcon} className="size-4" />
                  Volver al listado de canchas
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (requiredRole === "cliente" && !isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12">
        <Card className="border-border shadow-md">
          <CardContent className="pt-6 space-y-4">
            <Alert>
              <HugeiconsIcon icon={Alert02Icon} className="size-4 shrink-0" />
              <AlertTitle className="font-semibold">Inicio de sesión requerido</AlertTitle>
              <AlertDescription className="text-xs">
                Para consultar tus reservas directas debes identificarte con tu cuenta registrada.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/login" className="w-full">
                <Button className="w-full gap-2">
                  <HugeiconsIcon icon={Login01Icon} className="size-4" />
                  {t("navigation.login")}
                </Button>
              </Link>
              <Link to="/registro" className="w-full">
                <Button variant="outline" className="w-full">
                  {t("navigation.register")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
