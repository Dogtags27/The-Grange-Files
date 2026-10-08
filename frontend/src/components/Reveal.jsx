import { useEffect, useState } from "react"
import { fill, pickOne } from "../api"
import { revealBeats, wrongLines } from "../content"
import { useI18n } from "../i18n.jsx"
import NoirDesk from "../noir/NoirDesk"
import { announceVerdict, beginReveal, finishReveal, leaveReveal } from "../revealAudio"

const BEAT_MS = 2700
const LAST_STAGE = 7

export default function Reveal({ name, suspects = [], result, failed, onWrong, onSolved, onBack }) {
  const { t } = useI18n()
  const [stage, setStage] = useState(0)
  const [wrongLine] = useState(() => pickOne(wrongLines))

  useEffect(() => {
    beginReveal()
    const ids = []
    for (let i = 1; i <= LAST_STAGE; i++) {
      ids.push(setTimeout(() => setStage(i), i * BEAT_MS))
    }
    return () => {
      ids.forEach(clearTimeout)
      leaveReveal()
    }
  }, [])

  const ready = stage >= LAST_STAGE && Boolean(result)
  const solved = ready && result.correct

  useEffect(() => {
    if (failed) leaveReveal()
    else if (ready) announceVerdict(result.correct ? "guilty" : "clear")
  }, [ready, result, failed])

  useEffect(() => {
    if (!solved) return undefined
    const id = setTimeout(onSolved, 3800)
    return () => clearTimeout(id)
  }, [solved, onSolved])

  const beatIndex = Math.min(stage, revealBeats.length - 1)

  return (
    <div className="scene reveal" role="dialog" aria-modal="true" aria-label="The reveal">
      {suspects.length > 0 && (
        <NoirDesk
          className="reveal-desk"
          suspects={suspects}
          view="desk"
          room
          focus={stage >= 5 ? name : null}
          circled={stage >= 5 ? name : null}
          sweep={stage < 5 ? "fast" : null}
          mood={ready ? (result.correct ? "guilty" : "cleared") : "idle"}
          label="The desk lamp searches the five suspect cards, then settles on the accused."
        />
      )}
      <div className="reveal-shade" aria-hidden="true" />
      <div className="scene-inner reveal-text">
        {stage < 5 && (
          <div className="beats">
            <p key={beatIndex} className="beat now">
              {fill(t(revealBeats[beatIndex]), { name })}
            </p>
          </div>
        )}        {stage >= 5 && <p className="big name">{name}</p>}
        {stage >= 6 && !failed && <p className="big is">{t("is...")}</p>}
        {stage >= LAST_STAGE && !result && !failed && (
          <p className="beat now">{t("Mayor Lewis is squinting at the small print...")}</p>
        )}
        {failed && (
          <div className="verdict">
            <p className="beat now">{t("The envelope got lost. The backend did not answer.")}</p>
            <button type="button" className="solid" onClick={() => { finishReveal(); onBack() }}>
              {t("Back to the grid")}
            </button>
          </div>
        )}
        {ready && !result.correct && (
          <div className="verdict">
            <p className="big no">{t("Not guilty")}</p>
            <p className="beat now">{t(wrongLine)}</p>
            <button type="button" className="solid" onClick={() => { finishReveal(); onWrong() }} autoFocus>
              {t("Back to the grid")}
            </button>
          </div>
        )}
        {solved && (
          <div className="verdict">
            <p className="big yes">{t("Guilty")}</p>
          </div>
        )}
      </div>
      <div className="fuse" aria-hidden="true">
        <i style={{ animationDuration: `${LAST_STAGE * BEAT_MS}ms` }} />
      </div>
    </div>
  )
}
