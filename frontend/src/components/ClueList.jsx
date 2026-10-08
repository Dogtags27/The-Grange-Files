import { useEffect, useRef } from "react"
import { useParsedClues } from "../hooks"
import { useI18n } from "../i18n.jsx"

export function ClueText({ parts, focus, onFocus }) {
  return parts.map((part, i) =>
    part.value ? (
      <span
        key={i}
        role="button"
        tabIndex={0}
        className={focus === part.value ? "term on" : "term"}
        aria-pressed={focus === part.value}
        onClick={(event) => {
          event.stopPropagation()
          onFocus(part.value)
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            event.stopPropagation()
            onFocus(part.value)
          }
        }}
      >
        {part.text}
      </span>
    ) : (
      <span key={i}>{part.text}</span>
    ),
  )
}

export default function ClueList({ clues, values, checked, focus, onToggle, onFocus, current, tip, sheet }) {
  const { t } = useI18n()
  const parsed = useParsedClues(clues, values)
  const done = clues.filter((_, index) => checked[index]).length
  const now = useRef(null)

  useEffect(() => {
    now.current?.scrollIntoView({ block: "center" })
  }, [])

  return (
    <aside className={sheet ? "clues in-sheet" : "clues"}>
      <div className="clues-head">
        <div className="clues-title">
          <h2>{t("Clues")}</h2>
          <p className="count">
            {t("{done} of {total} crossed off", { done, total: clues.length })}
          </p>
        </div>
        <div
          className="meter thin"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={clues.length}
          aria-valuenow={done}
        >
          <i style={{ width: `${(done / clues.length) * 100}%` }} />
        </div>
        <p className="tip">
          {tip ?? t("Names with a dashed line are live. Press one to light it up on the grid and in every clue.")}
        </p>
      </div>
      <div className="clue-scroll">
        <ol>
          {parsed.map((parts, index) => (
            <li
              key={clues[index]}
              ref={index === current ? now : undefined}
              className={`${checked[index] ? "clue used" : "clue"}${index === current ? " now" : ""}`}
            >
              <input
                type="checkbox"
                checked={Boolean(checked[index])}
                onChange={() => onToggle(index)}
                aria-label={t("Clue {n}, crossed off", { n: index + 1 })}
              />
              <p onClick={() => onToggle(index)}>
                <span className="num">{index + 1}.</span> <ClueText parts={parts} focus={focus} onFocus={onFocus} />
              </p>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  )
}
