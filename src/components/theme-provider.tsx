/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

export type AppTheme = "ocean" | "forest" | "sunset" | "midnight-violet"

export interface ThemeConfig {
  id: AppTheme
  labelEs: string
  labelEn: string
  mode: "light" | "dark"
  primaryColor: string // Para preview en el ThemeSwitcher
  accentColor: string
}

export const THEMES: ThemeConfig[] = [
  {
    id: "ocean",
    labelEs: "Ocean (Azul)",
    labelEn: "Ocean (Blue)",
    mode: "light",
    primaryColor: "oklch(0.48 0.22 255)",
    accentColor: "oklch(0.93 0.03 245)",
  },
  {
    id: "forest",
    labelEs: "Forest (Verde)",
    labelEn: "Forest (Green)",
    mode: "dark",
    primaryColor: "oklch(0.68 0.19 145)",
    accentColor: "oklch(0.27 0.04 145)",
  },
  {
    id: "sunset",
    labelEs: "Sunset (Naranja)",
    labelEn: "Sunset (Orange)",
    mode: "light",
    primaryColor: "oklch(0.58 0.20 45)",
    accentColor: "oklch(0.93 0.04 60)",
  },
  {
    id: "midnight-violet",
    labelEs: "Midnight Violet",
    labelEn: "Midnight Violet",
    mode: "dark",
    primaryColor: "oklch(0.66 0.24 295)",
    accentColor: "oklch(0.26 0.05 295)",
  },
]

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: AppTheme
  storageKey?: string
}

type ThemeProviderState = {
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
  isDark: boolean
  themes: ThemeConfig[]
}

const ThemeProviderContext = React.createContext<ThemeProviderState | undefined>(undefined)

function isAppTheme(value: string | null): value is AppTheme {
  return THEMES.some((t) => t.id === value)
}

export function ThemeProvider({
  children,
  defaultTheme = "ocean",
  storageKey = "canchas_theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<AppTheme>(() => {
    const stored = localStorage.getItem(storageKey)
    if (isAppTheme(stored)) {
      return stored
    }
    return defaultTheme
  })

  const setTheme = React.useCallback(
    (nextTheme: AppTheme) => {
      localStorage.setItem(storageKey, nextTheme)
      setThemeState(nextTheme)
    },
    [storageKey]
  )

  const applyTheme = React.useCallback((currentTheme: AppTheme) => {
    const root = document.documentElement
    // Asignar data-theme
    root.setAttribute("data-theme", currentTheme)

    // Si es forest o midnight-violet, agregar la clase 'dark' para compatibilidad con estilos dark:
    const isDarkMode = currentTheme === "forest" || currentTheme === "midnight-violet"
    if (isDarkMode) {
      root.classList.add("dark")
      root.classList.remove("light")
    } else {
      root.classList.add("light")
      root.classList.remove("dark")
    }
  }, [])

  React.useEffect(() => {
    applyTheme(theme)
  }, [theme, applyTheme])

  const isDark = theme === "forest" || theme === "midnight-violet"

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      isDark,
      themes: THEMES,
    }),
    [theme, setTheme, isDark]
  )

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
