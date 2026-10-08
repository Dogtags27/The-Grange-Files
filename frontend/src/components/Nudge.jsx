import { nudge } from "../content"
import { NUDGE_VISIBLE_MS } from "../hooks"
import { useI18n } from "../i18n.jsx"

export default function Nudge({ line, onAsk, onDismiss }) {
  const { t } = useI18n()
  return (
    <aside className="nudge" role="status" aria-live="polite">
      <p className="nudge-title">{t(nudge.title)}</p>
      <p>{t(line)}</p>
      <div className="nudge-actions">
        <button type="button" className="solid" onClick={onAsk}>
          {t(nudge.ask)}
        </button>
        <button type="button" className="ghost" onClick={onDismiss}>
          {t(nudge.dismiss)}
        </button>
      </div>
      <div className="nudge-timer" aria-hidden="true">
        <i style={{ animationDuration: `${NUDGE_VISIBLE_MS}ms` }} />
      </div>
    </aside>
  )
}
