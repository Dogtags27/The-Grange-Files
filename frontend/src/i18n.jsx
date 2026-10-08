import { createContext, useContext, useEffect, useMemo, useState } from "react"
import ar from "./locales/ar.js"
import es from "./locales/es.js"
import fr from "./locales/fr.js"
import ja from "./locales/ja.js"
import ru from "./locales/ru.js"
import zh from "./locales/zh.js"

export const LANGS = [
  { id: "en", native: "English", dir: "ltr" },
  { id: "es", native: "Español", dir: "ltr" },
  { id: "fr", native: "Français", dir: "ltr" },
  { id: "zh", native: "中文", dir: "ltr" },
  { id: "ja", native: "日本語", dir: "ltr" },
  { id: "ru", native: "Русский", dir: "ltr" },
  { id: "ar", native: "العربية", dir: "rtl" },
]

const DICTS = { es, fr, zh, ja, ru, ar }
const KEY = "grange-lang"
const COMPACT = "(max-width: 700px), (max-height: 500px) and (pointer: coarse)"

const known = new Set(LANGS.map((item) => item.id))

function baseTag(tag) {
  const base = String(tag ?? "").toLowerCase().split("-")[0]
  if (base === "zh") return "zh"
  return known.has(base) ? base : ""
}

export function initialLang() {
  try {
    const saved = localStorage.getItem(KEY)
    if (known.has(saved)) return saved
  } catch {
    return "en"
  }
  const compact = typeof window !== "undefined" && window.matchMedia(COMPACT).matches
  if (!compact) return "en"
  const tags = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const tag of tags) {
    const hit = baseTag(tag)
    if (hit) return hit
  }
  return "en"
}

let active = {}

export function translate(text, vars) {
  if (text == null) return ""
  const source = String(text)
  let out = active[source] ?? source
  if (vars) {
    for (const [key, value] of Object.entries(vars)) out = out.replaceAll(`{${key}}`, value ?? "")
  }
  return out
}

export function translateTerm(value) {
  if (!value) return value
  const bare = String(value).replace(/\.$/, "")
  const hit = active[`@${bare}`]
  if (!hit) return value
  return String(value).endsWith(".") && !hit.endsWith(".") ? `${hit}.` : hit
}

function apply(lang) {
  active = DICTS[lang] ?? {}
  const item = LANGS.find((entry) => entry.id === lang) ?? LANGS[0]
  document.documentElement.lang = lang === "zh" ? "zh-Hans" : lang
  document.documentElement.dir = item.dir
  document.title = translate("Someone wrecked the Grange Display")
}

const LocaleContext = createContext(null)

export function LocaleProvider({ children }) {
  const [lang, setLang] = useState(initialLang)
  apply(lang)

  useEffect(() => {
    apply(lang)
  }, [lang])

  const api = useMemo(
    () => ({
      lang,
      setLang(next) {
        if (!known.has(next)) return
        try {
          localStorage.setItem(KEY, next)
        } catch {
          /* private mode */
        }
        setLang(next)
      },
      t: translate,
      term: translateTerm,
    }),
    [lang],
  )

  return <LocaleContext.Provider value={api}>{children}</LocaleContext.Provider>
}

export function useI18n() {
  const value = useContext(LocaleContext)
  if (!value) throw new Error("locale")
  return value
}
