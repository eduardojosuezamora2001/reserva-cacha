import { useI18n, type Locale } from "@/components/i18n/i18n-provider"
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
import { Globe02Icon, Tick02Icon } from "@hugeicons/core-free-icons"

interface LanguageSwitcherProps {
  variant?: "ghost" | "outline" | "default"
  size?: "default" | "sm" | "xs" | "icon"
  showLabel?: boolean
}

export function LanguageSwitcher({
  variant = "ghost",
  size = "sm",
  showLabel = false,
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n()

  const languages: { id: Locale; label: string; flag: string }[] = [
    { id: "es", label: "Español", flag: "🇨🇷" },
    { id: "en", label: "English", flag: "🇺🇸" },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant={variant} size={size} className="gap-2 justify-start" />}>
        <HugeiconsIcon icon={Globe02Icon} className="size-4 shrink-0 text-muted-foreground" />
        {showLabel ? (
          <span className="text-xs font-medium uppercase tracking-wider">{locale}</span>
        ) : (
          <span className="sr-only">Cambiar idioma</span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          {t("navigation.language")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.id}
            onClick={() => setLocale(lang.id)}
            className="flex items-center justify-between cursor-pointer py-1.5"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{lang.flag}</span>
              <span className="text-xs font-medium">{lang.label}</span>
            </div>
            {locale === lang.id && (
              <HugeiconsIcon icon={Tick02Icon} className="size-3.5 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
