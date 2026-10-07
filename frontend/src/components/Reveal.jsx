import { useEffect, useState } from "react"
import { fill, pickOne } from "../api"
import { revealBeats, wrongLines } from "../content"

const BEAT_MS = 2700
const LAST_STAGE = 7

export default function Reveal({ name, result, failed, onWrong, onSolved, onBack }) {
  const [stage, setStage] = useState(0)
  const [wrongLine] = useState(() => pickOne(wrongLines))

  useEffect(() => {
    const ids = []
    for (let i = 1; i <= LAST_STAGE; i++) {
      ids.push(setTimeout(() => setStage(i), i * BEAT_MS))
    }
    return () => ids.forEach(clearTimeout)
  }, [])

  const ready = stage >= LAST_STAGE && Boolean(result)
  const solved = ready && result.correct

  useEffect(() => {
    if (!solved) return undefined
    const id = setTimeout(onSolved, 3800)
    return () => clearTimeout(id)
  }, [solved, onSolved])

  const shownBeats = revealBeats.slice(0, Math.min(stage, revealBeats.length - 1) + 1)

  return (
    <div className="scene reveal" role="dialog" aria-modal="true" aria-label="The reveal">
      <div className="scene-inner">
        <div className="beats">
          {shownBeats.map((beat, index) => (
            <p key={beat} className={index === shownBeats.length - 1 && stage < 5 ? "beat now" : "beat"}>
              {fill(beat, { name })}
            </p>
          ))}
        </div>
        {stage >= 5 && <p className="big name">{name}</p>}
        {stage >= 6 && !failed && <p className="big is">is...</p>}
        {stage >= LAST_STAGE && !result && !failed && (
          <p className="beat now">Mayor Lewis is squinting at the small print...</p>
        )}
        {failed && (
          <div className="verdict">
            <p className="beat now">The envelope got lost. The backend did not answer.</p>
            <button type="button" className="solid" onClick={onBack}>
              Back to the grid
            </button>
          </div>
        )}
        {ready && !result.correct && (
          <div className="verdict">
            <p className="big no">Not guilty</p>
            <p className="beat now">{wrongLine}</p>
            <button type="button" className="solid" onClick={onWrong} autoFocus>
              Back to the grid
            </button>
          </div>
        )}
        {solved && (
          <div className="verdict">
            <p className="big yes">Guilty</p>
          </div>
        )}
      </div>
      <div className="fuse" aria-hidden="true">
        <i style={{ animationDuration: `${LAST_STAGE * BEAT_MS}ms` }} />
      </div>
    </div>
  )
}
