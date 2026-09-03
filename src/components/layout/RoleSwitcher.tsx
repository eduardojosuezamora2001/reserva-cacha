import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/components/i18n/i18n-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon, MoreHorizontalCircle01Icon } from "@hugeicons/core-free-icons"

export function RoleSwitcher() {
  const { role, switchRole } = useAuth()
  const { t } = useI18n()

  const roleConfigs: { id: "admin" | "cliente" | "visitante"; label: string; badgeVariant: "default" | "secondary" | "outline" }[] = [
    { id: "admin", label: `${t("common.admin")} (Admin Pro)`, badgeVariant: "default" },
    { id: "cliente", label: `${t("common.client")} (Carlos G.)`, badgeVariant: "secondary" },
    { id: "visitante", label: `${t("common.guest")} (Sin sesión)`, badgeVariant: "outline" },
  ]

  const active = roleConfigs.find((r) => r.id === role) || roleConfigs[2]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="xs" className="h-7 text-xs font-normal gap-1.5 px-2 bg-background/80" />}>
        <span className="text-[11px] text-muted-foreground">{t("common.role")}:</span>
        <Badge variant={active.badgeVariant} className="text-[10px] px-1.5 py-0 h-4 font-semibold">
          {role.toUpperCase()}
        </Badge>
        <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="size-3 text-muted-foreground ml-0.5 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          {t("navigation.switchDemoRole")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roleConfigs.map((item) => (
          <DropdownMenuItem
            key={item.id}
            onClick={() => switchRole(item.id)}
            className="flex items-center justify-between cursor-pointer py-1.5"
          >
            <div className="flex items-center gap-2">
              <Badge variant={item.badgeVariant} className="text-[10px] px-1 py-0 h-4">
                {item.id.slice(0, 3).toUpperCase()}
              </Badge>
              <span className="text-xs font-medium">{item.label}</span>
            </div>
            {role === item.id && (
              <HugeiconsIcon icon={Tick02Icon} className="size-3.5 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
