import { useI18n } from "../i18n.jsx"

export default function Doubt({ lead, question, onClear, onKeep }) {
  const { t } = useI18n()
  return (
    <div className="doubt" role="alertdialog" aria-label={t("Mayor Lewis has a question")}>
      <p className="doubt-kicker">{t("Mayor Lewis taps one of your ticks")}</p>
      {lead && <p className="doubt-lead">{t(lead)}</p>}
      <p className="doubt-question">{question}</p>
      <div className="doubt-actions">
        <button type="button" className="solid" onClick={onClear}>
          {t("Clear that tick")}
        </button>
        <button type="button" className="ghost" onClick={onKeep}>
          {t("I stand by it")}
        </button>
      </div>
    </div>
  )
}
