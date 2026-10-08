import { LANGS, useI18n } from "../i18n.jsx"

export default function LangSelect() {
  const { lang, setLang, t } = useI18n()
  return (
    <label className="lang">
      <span className="lang-label">{t("Language")}</span>
      <select value={lang} onChange={(event) => setLang(event.target.value)} aria-label={t("Language")}>
        {LANGS.map((item) => (
          <option key={item.id} value={item.id}>
            {item.native}
          </option>
        ))}
      </select>
    </label>
  )
}
