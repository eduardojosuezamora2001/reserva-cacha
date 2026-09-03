import { Link, useLocation } from "react-router-dom"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useI18n } from "@/components/i18n/i18n-provider"
import { RoleSwitcher } from "@/components/layout/RoleSwitcher"

export function AppHeader() {
  const location = useLocation()
  const { t } = useI18n()

  const segments = location.pathname.split("/").filter(Boolean)

  const getSegmentName = (seg: string, index: number): string => {
    if (seg === "canchas") return t("navigation.canchas")
    if (seg === "mis-reservas") return t("navigation.myReservations")
    if (seg === "admin") return t("navigation.dashboard")
    if (seg === "reservas") return t("navigation.adminReservas")
    if (seg === "configuracion") return t("navigation.settings")
    if (seg === "login") return t("navigation.login")
    if (seg === "registro") return t("navigation.register")
    if (segments[index - 1] === "canchas") return t("canchas.details")
    return seg
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border/70 bg-background/95 backdrop-blur-md px-4 justify-between transition-[width,height] ease-linear">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
        <Separator orientation="vertical" className="mr-2 h-4" />

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/canchas" />}>
                {t("common.appName")}
              </BreadcrumbLink>
            </BreadcrumbItem>

            {segments.length === 0 ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t("navigation.canchas")}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : (
              segments.map((seg, idx) => {
                const isLast = idx === segments.length - 1
                const path = "/" + segments.slice(0, idx + 1).join("/")
                const label = getSegmentName(seg, idx)

                return (
                  <span key={path} className="inline-flex items-center gap-1.5">
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage className="font-semibold">{label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink render={<Link to={path} />}>{label}</BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </span>
                )
              })
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2">
        <RoleSwitcher />
      </div>
    </header>
  )
}
