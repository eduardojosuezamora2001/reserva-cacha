import { useTheme, type AppTheme } from "@/components/theme-provider"
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
import { HugeiconsIcon } from "@hugeicons/react"
import { Sun01Icon, Tick02Icon } from "@hugeicons/core-free-icons"

interface ThemeSwitcherProps {
  variant?: "ghost" | "outline" | "default"
  size?: "default" | "sm" | "xs" | "icon"
  showLabel?: boolean
}

export function ThemeSwitcher({
  variant = "ghost",
  size = "sm",
  showLabel = false,
}: ThemeSwitcherProps) {
  const { theme, setTheme, themes } = useTheme()
  const { locale, t } = useI18n()

  const currentThemeConfig = themes.find((item) => item.id === theme) || themes[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant={variant} size={size} className="gap-2 justify-start" />}>
        <span
          className="size-3.5 rounded-full ring-1 ring-border shadow-xs shrink-0"
          style={{ backgroundColor: currentThemeConfig.primaryColor }}
        />
        {showLabel ? (
          <span className="text-xs font-medium">
            {locale === "es" ? currentThemeConfig.labelEs : currentThemeConfig.labelEn}
          </span>
        ) : (
          <HugeiconsIcon icon={Sun01Icon} className="size-4 shrink-0 text-muted-foreground" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          {t("navigation.theme")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((th) => (
          <DropdownMenuItem
            key={th.id}
            onClick={() => setTheme(th.id as AppTheme)}
            className="flex items-center justify-between cursor-pointer py-1.5"
          >
            <div className="flex items-center gap-2.5">
              <span
                className="size-3.5 rounded-full ring-1 ring-border shadow-xs shrink-0"
                style={{ backgroundColor: th.primaryColor }}
              />
              <span className="text-xs font-medium">
                {locale === "es" ? th.labelEs : th.labelEn}
              </span>
            </div>
            {theme === th.id && (
              <HugeiconsIcon icon={Tick02Icon} className="size-3.5 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
