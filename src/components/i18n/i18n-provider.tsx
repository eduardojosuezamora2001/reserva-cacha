/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import esMessages from "@/messages/es.json"
import enMessages from "@/messages/en.json"

export type Locale = "es" | "en"

const STORAGE_LOCALE_KEY = "canchas_locale"

type MessagesType = typeof esMessages

const messagesMap: Record<Locale, MessagesType> = {
  es: esMessages,
  en: enMessages,
}

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
  formatDate: (dateStr: string, options?: Intl.DateTimeFormatOptions) => string
  formatCurrency: (amount?: number) => string
}

const I18nContext = React.createContext<I18nContextType | undefined>(undefined)

// Helper para resolver clave profunda "canchas.title" o "reservas.status.confirmada"
function getNestedValue(obj: unknown, path: string): string | undefined {
  const parts = path.split(".")
  let current: unknown = obj
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  return typeof current === "string" ? current : undefined
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(() => {
    const saved = localStorage.getItem(STORAGE_LOCALE_KEY)
    if (saved === "es" || saved === "en") {
      return saved
    }
    return "es"
  })

  const setLocale = React.useCallback((nextLocale: Locale) => {
    localStorage.setItem(STORAGE_LOCALE_KEY, nextLocale)
    setLocaleState(nextLocale)
  }, [])

  const t = React.useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const activeDictionary = messagesMap[locale] || messagesMap.es
      let text = getNestedValue(activeDictionary, key)

      // Fallback a español si falta en inglés
      if (!text && locale !== "es") {
        text = getNestedValue(messagesMap.es, key)
      }

      if (!text) {
        return key
      }

      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text?.replace(new RegExp(`\\{${k}\\}`, "g"), String(v))
        })
      }

      return text
    },
    [locale]
  )

  const formatDate = React.useCallback(
    (dateStr: string, options?: Intl.DateTimeFormatOptions): string => {
      try {
        // Para evitar desfasajes horarios de zona al parsear solo "YYYY-MM-DD", agregamos mediodía
        const [y, m, d] = dateStr.split("-").map(Number)
        const date = new Date(y, m - 1, d, 12, 0, 0)
        return new Intl.DateTimeFormat(
          locale === "es" ? "es-CR" : "en-US",
          options || {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          }
        ).format(date)
      } catch {
        return dateStr
      }
    },
    [locale]
  )

  const formatCurrency = React.useCallback(
    (amount?: number): string => {
      if (amount === undefined || amount === null) return "₡0"
      return new Intl.NumberFormat(locale === "es" ? "es-CR" : "en-US", {
        style: "currency",
        currency: "CRC",
        maximumFractionDigits: 0,
      }).format(amount)
    },
    [locale]
  )

  const value = React.useMemo(
    () => ({
      locale,
      setLocale,
      t,
      formatDate,
      formatCurrency,
    }),
    [locale, setLocale, t, formatDate, formatCurrency]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

/**
 * Hook `useTranslations` según AGENTS.md sección 9:
 * Permite usar con o sin namespace:
 * const t = useTranslations("canchas")
 * t("title") // busca en canchas.title
 * O:
 * const { t, locale, setLocale, formatDate, formatCurrency } = useI18n()
 */
export function useTranslations(namespace?: string) {
  const context = React.useContext(I18nContext)
  if (!context) {
    throw new Error("useTranslations must be used within an I18nProvider")
  }

  const translate = React.useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key
      return context.t(fullKey, params)
    },
    [context, namespace]
  )

  return translate
}

export function useI18n() {
  const context = React.useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}
