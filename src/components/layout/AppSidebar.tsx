import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/components/i18n/i18n-provider"
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher"
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher"
import { RoleSwitcher } from "@/components/layout/RoleSwitcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  FootballIcon,
  Calendar03Icon,
  DashboardCircleIcon,
  Grid02Icon,
  Calendar01Icon,
  AccountSetting01Icon,
  Login01Icon,
  Logout01Icon,
  BadgePlusIcon,
} from "@hugeicons/core-free-icons"

export function AppSidebar() {
  const { user, isAdmin, isClient, logout } = useAuth()
  const { t } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/canchas")
  }

  // Elementos de navegación según el rol
  const adminNav = [
    { title: t("navigation.dashboard"), url: "/admin", icon: DashboardCircleIcon },
    { title: t("navigation.adminCanchas"), url: "/admin/canchas", icon: Grid02Icon },
    { title: t("navigation.adminReservas"), url: "/admin/reservas", icon: Calendar01Icon },
    { title: t("navigation.canchas"), url: "/canchas", icon: FootballIcon },
    { title: t("navigation.settings"), url: "/configuracion", icon: AccountSetting01Icon },
  ]

  const clientNav = [
    { title: t("navigation.canchas"), url: "/canchas", icon: FootballIcon },
    { title: t("navigation.myReservations"), url: "/mis-reservas", icon: Calendar03Icon },
    { title: t("navigation.settings"), url: "/configuracion", icon: AccountSetting01Icon },
  ]

  const guestNav = [
    { title: t("navigation.canchas"), url: "/canchas", icon: FootballIcon },
    { title: t("navigation.login"), url: "/login", icon: Login01Icon },
    { title: t("navigation.register"), url: "/registro", icon: BadgePlusIcon },
  ]

  const items = isAdmin ? adminNav : isClient ? clientNav : guestNav

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-3 border-b border-border/60">
        <div className="flex items-center justify-between gap-2">
          <Link to="/canchas" className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs">
              <HugeiconsIcon icon={FootballIcon} className="size-5 text-current" />
            </div>
            <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="font-serif font-bold text-sm leading-tight truncate">
                Fútbol Pro
              </span>
              <span className="text-[11px] text-muted-foreground leading-none truncate">
                Sistema de Reservas
              </span>
            </div>
          </Link>
        </div>

        {/* Selector de rol de demo rápido para pruebas */}
        <div className="pt-2 group-data-[collapsible=icon]:hidden">
          <RoleSwitcher />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {isAdmin ? "Panel Admin" : isClient ? "Mi Espacio" : "Explorar"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive =
                  item.url === "/admin"
                    ? location.pathname === "/admin"
                    : location.pathname.startsWith(item.url)

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      render={
                        <Link
                          to={item.url}
                          className={isActive ? "bg-accent text-accent-foreground font-semibold" : ""}
                        />
                      }
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <HugeiconsIcon icon={item.icon} className="size-4 shrink-0 text-current" />
                      <span className="truncate">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2.5 border-t border-border/60 flex flex-col gap-2">
        {/* Controles de Theming e Idioma */}
        <div className="flex items-center justify-between gap-1 group-data-[collapsible=icon]:flex-col">
          <ThemeSwitcher variant="ghost" size="xs" showLabel={false} />
          <LanguageSwitcher variant="ghost" size="xs" showLabel={true} />
        </div>

        <SidebarSeparator className="my-0.5" />

        {/* Perfil o botón de login */}
        {user ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="size-7 rounded-md border border-border">
                <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                  {user.nombre.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="text-xs font-semibold leading-tight truncate">{user.nombre}</span>
                <span className="text-[10px] text-muted-foreground leading-none truncate">
                  {user.correo}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleLogout}
              title={t("navigation.logout")}
              className="text-muted-foreground hover:text-destructive shrink-0 group-data-[collapsible=icon]:hidden"
            >
              <HugeiconsIcon icon={Logout01Icon} className="size-3.5" />
            </Button>
          </div>
        ) : (
          <div className="group-data-[collapsible=icon]:hidden">
            <Link to="/login" className="w-full">
              <Button variant="outline" size="xs" className="w-full justify-center gap-1.5 text-xs">
                <HugeiconsIcon icon={Login01Icon} className="size-3.5" />
                <span>{t("navigation.login")}</span>
              </Button>
            </Link>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
