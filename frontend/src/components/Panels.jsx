import { panicStages } from "../content"
import { clock, useNow } from "../hooks"

export function elapsedSeconds(startedAt, frozenAt, penalty, now) {
  return Math.max(0, Math.floor(((frozenAt ?? now) - startedAt) / 1000)) + penalty * 60
}

export function TimerPanel({ startedAt, frozenAt, penalty }) {
  const now = useNow()
  const seconds = elapsedSeconds(startedAt, frozenAt, penalty, now)
  return (
    <section className="panel" aria-label="Time on the case">
      <h3>Time on the case</h3>
      <p className="face">{clock(seconds)}</p>
      <p className="panel-note">
        {penalty > 0
          ? `Includes ${penalty} min of Elder fees.`
          : "Counting from the moment you opened the grid."}
      </p>
    </section>
  )
}

export function PanicPanel({ ticks, total }) {
  const level = Math.round(((total - ticks) / total) * 100)
  const stage = panicStages.find((entry) => ticks <= entry.upTo) ?? panicStages.at(-1)
  const line = stage.lines[ticks % stage.lines.length]
  return (
    <section className="panel panic" aria-label="Mayor Lewis panic level">
      <div className="panic-top">
        <h3>Mayor Lewis panic level</h3>
        <p className="face small">{level}%</p>
      </div>
      <div
        className="meter"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={level}
      >
        <i style={{ width: `${level}%` }} />
      </div>
      <p className="panel-note">{line}</p>
      <p className="panel-note faint">It drops as you tick matches. It does not know if you are right.</p>
    </section>
  )
}
