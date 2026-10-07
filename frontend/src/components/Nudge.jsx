import { nudge } from "../content"
import { NUDGE_VISIBLE_MS } from "../hooks"

export default function Nudge({ line, onAsk, onDismiss }) {
  return (
    <aside className="nudge" role="status" aria-live="polite">
      <p className="nudge-title">{nudge.title}</p>
      <p>{line}</p>
      <div className="nudge-actions">
        <button type="button" className="solid" onClick={onAsk}>
          {nudge.ask}
        </button>
        <button type="button" className="ghost" onClick={onDismiss}>
          {nudge.dismiss}
        </button>
      </div>
      <div className="nudge-timer" aria-hidden="true">
        <i style={{ animationDuration: `${NUDGE_VISIBLE_MS}ms` }} />
      </div>
    </aside>
  )
}
