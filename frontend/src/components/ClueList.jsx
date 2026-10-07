import { useMemo } from "react"
import { splitClue } from "../logic"

export default function ClueList({ clues, values, checked, focus, onToggle, onFocus }) {
  const parsed = useMemo(() => clues.map((clue) => splitClue(clue, values)), [clues, values])
  const done = clues.filter((_, index) => checked[index]).length

  return (
    <aside className="clues">
      <div className="clues-head">
        <div className="clues-title">
          <h2>Clues</h2>
          <p className="count">
            {done} of {clues.length} crossed off
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
          Names with a dashed line are live. Press one to light it up on the grid
          and in every clue.
        </p>
      </div>
      <div className="clue-scroll">
        <ol>
          {parsed.map((parts, index) => (
            <li key={clues[index]} className={checked[index] ? "clue used" : "clue"}>
              <input
                type="checkbox"
                checked={Boolean(checked[index])}
                onChange={() => onToggle(index)}
                aria-label={`Clue ${index + 1}, crossed off`}
              />
              <p onClick={() => onToggle(index)}>
                <span className="num">{index + 1}.</span>{" "}
                {parts.map((part, i) =>
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
                )}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  )
}
