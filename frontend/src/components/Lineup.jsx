import { useEffect, useRef, useState } from "react"
import { fill, pickOne } from "../api"
import { accuseLines } from "../content"
import { useCompact, useNow } from "../hooks"
import { useI18n } from "../i18n.jsx"
import NoirDesk from "../noir/NoirDesk"
import Figure from "./Figure"

const marks = [
  { label: `5'0"`, offset: 150 },
  { label: `5'6"`, offset: 200 },
  { label: `6'0"`, offset: 250 },
]

function Circle() {
  return (
    <svg className="marker" viewBox="0 0 160 160" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M80 8 C128 4 154 44 152 84 C150 128 118 154 78 152 C34 150 8 120 10 78 C12 36 40 10 90 10"
        pathLength="1"
        fill="none"
        stroke="#c8102e"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function VoteClock({ endsAt, skew = 0, onExpire }) {
  const now = useNow(250)
  const fired = useRef(false)
  const left = endsAt ? Math.max(0, Math.ceil((endsAt - (now + skew)) / 1000)) : 0

  useEffect(() => {
    if (!endsAt) return
    if (left > 0) {
      fired.current = false
      return
    }
    if (fired.current) return
    fired.current = true
    onExpire?.()
  }, [endsAt, left, onExpire])

  if (!endsAt) return null

  return (
    <p className="vote-clock" role="timer" aria-live="polite">
      {left > 0 ? (
        <>
          {t("{left}s left to circle a suspect", { left })}
        </>
      ) : (
        <>{t("Time is up. Waiting for at least one circle.")}</>
      )}
    </p>
  )
}

export default function Lineup({
  suspects,
  onBack,
  onPresent,
  ballots,
  onPick,
  presentText,
  presentOff,
  note,
  voteEndsAt,
  skew = 0,
  onVoteExpire,
}) {
  const compact = useCompact()
  const { t } = useI18n()
  const [pick, setPick] = useState(null)
  const [line, setLine] = useState("")
  const shared = Array.isArray(ballots)
  const chosen = shared ? (ballots.find((item) => item.mine)?.suspect ?? null) : pick
  const buttons = useRef([])

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onBack()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onBack])

  function choose(name) {
    if (shared) {
      onPick?.(name)
      return
    }
    if (name === pick) return
    setPick(name)
    setLine(fill(pickOne(accuseLines), { name }))
  }

  function onArrow(event, index) {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = (index + step + suspects.length) % suspects.length
    buttons.current[next]?.focus()
    choose(suspects[next])
  }

  const voters = {}
  for (const item of ballots ?? []) {
    if (item.suspect) voters[item.suspect] = voters[item.suspect] ? `${voters[item.suspect]}, ${item.name}` : item.name
  }

  const wall = (
      <div className="wall">
          <div className="floor" />
          {marks.map((mark) => (
            <p key={mark.label} className="ruler" style={{ bottom: `calc(var(--plate) + ${mark.offset}px)` }}>
              <span>{mark.label}</span>
            </p>
          ))}
          <div className="row" role="radiogroup" aria-label="Suspects">
            {suspects.map((name, index) => (
              <button
                key={name}
                ref={(node) => {
                  buttons.current[index] = node
                }}
                type="button"
                role="radio"
                aria-checked={chosen === name}
                tabIndex={chosen ? (chosen === name ? 0 : -1) : index === 0 ? 0 : -1}
                className={chosen === name ? "suspect picked" : "suspect"}
                onClick={() => choose(name)}
                onKeyDown={(event) => onArrow(event, index)}
              >
                <span className="figure-wrap">
                  <Figure name={name} />
                  {chosen === name && <Circle key={name} />}
                </span>
                <span className="plate">
                  <b>No. {index + 1}</b>
                  <span>{name}</span>
                  {shared && (
                    <small>
                      {(ballots ?? [])
                        .filter((item) => item.suspect === name)
                        .map((item) => item.name)
                        .join(", ")}
                    </small>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
  )

  return (
    <div className="scene lineup" role="dialog" aria-modal="true" aria-label="The lineup">
      <div className="scene-inner">
        <p className="file">{t("The lineup")}</p>
        <h2>{t("Who did it?")}</h2>
        <p className="scene-sub">
          {shared
            ? compact
              ? "Tap a suspect to cast your circle. Skipping is fine."
              : "Click a suspect to cast your circle, or use the arrow keys. Skipping is fine."
            : compact
              ? "Tap a suspect to circle them."
              : "Click a suspect to circle them, or use the arrow keys."}{" "}
          {shared
            ? "The envelope opens when everyone has voted, or when the timer ends with at least one circle."
            : "You can change your mind until you present your answer."}
        </p>
        {shared && <VoteClock endsAt={voteEndsAt} skew={skew} onExpire={onVoteExpire} />}
        <NoirDesk
          className="lineup-desk"
          suspects={suspects}
          focus={chosen}
          circled={chosen}
          voters={voters}
          onPick={choose}
          label="A detective desk with five mugshot cards. The lamp lights the suspect you circle."
          fallback={wall}
        >
          <div className="row-quiet" role="radiogroup" aria-label="Suspects">
            {suspects.map((name, index) => (
              <button
                key={name}
                ref={(node) => {
                  buttons.current[index] = node
                }}
                type="button"
                role="radio"
                aria-checked={chosen === name}
                tabIndex={chosen ? (chosen === name ? 0 : -1) : index === 0 ? 0 : -1}
                onClick={() => choose(name)}
                onKeyDown={(event) => onArrow(event, index)}
              >
                No. {index + 1} {name}
                {voters[name] ? `, circled by ${voters[name]}` : ""}
              </button>
            ))}
          </div>
        </NoirDesk>
        <p className="mayor-line" aria-live="polite">
          {note || (chosen ? line : t("Mayor Lewis is waiting, and he is very bad at it."))}
        </p>
        <div className="scene-actions">
          <button type="button" className="ghost" onClick={onBack}>
            {t("Back to the grid")}
          </button>
          <button
            type="button"
            className="solid"
            disabled={shared ? presentOff : !chosen}
            onClick={() => onPresent(chosen)}
          >
            {presentText ?? (chosen ? t("Present {name} to Mayor Lewis", { name: chosen }) : t("Pick a suspect first"))}
          </button>
        </div>
      </div>
    </div>
  )
}
