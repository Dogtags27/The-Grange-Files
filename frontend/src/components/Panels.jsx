import { panicStages } from "../content"
import { clock, useNow } from "../hooks"
import { useI18n } from "../i18n.jsx"

export function elapsedSeconds(startedAt, frozenAt, penalty, now) {
  return Math.max(0, Math.floor(((frozenAt ?? now) - startedAt) / 1000)) + penalty * 60
}

export function TimerChip({ startedAt, frozenAt, penalty }) {
  const now = useNow()
  const { t } = useI18n()
  return (
    <span className="time-chip" role="timer" aria-label={t("Time on the case")}>
      {clock(elapsedSeconds(startedAt, frozenAt, penalty, now))}
    </span>
  )
}

export function TimerPanel({ startedAt, frozenAt, penalty }) {
  const now = useNow()
  const { t } = useI18n()
  const seconds = elapsedSeconds(startedAt, frozenAt, penalty, now)
  return (
    <section className="panel" aria-label={t("Time on the case")}>
      <h3>{t("Time on the case")}</h3>
      <p className="face">{clock(seconds)}</p>
      <p className="panel-note">
        {penalty > 0
          ? t("Includes {penalty} min of Elder fees.", { penalty })
          : t("Counting from the moment you opened the grid.")}
      </p>
    </section>
  )
}

export function PanicPanel({ ticks, total }) {
  const level = Math.round(((total - ticks) / total) * 100)
  const stage = panicStages.find((entry) => ticks <= entry.upTo) ?? panicStages.at(-1)
  const { t } = useI18n()
  const line = stage.lines[ticks % stage.lines.length]
  return (
    <section className="panel panic" aria-label={t("Mayor Lewis panic level")}>
      <div className="panic-top">
        <h3>{t("Mayor Lewis panic level")}</h3>
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
      <p className="panel-note">{t(line)}</p>
      <p className="panel-note faint">It drops as you tick matches. It does not know if you are right.</p>
    </section>
  )
}
