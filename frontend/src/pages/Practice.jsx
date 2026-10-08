import { useState } from "react"
import { Link } from "react-router-dom"
import Footer from "../components/Footer"
import Mark from "../components/Mark"
import Masthead from "../components/Masthead"
import { useI18n } from "../i18n.jsx"
import { applyClick } from "../logic"
import { GRID, answer, clues, cols, rows, steps } from "../practice"

const SIZE = 3
const FRESH = { state: {}, history: [], step: 0, flags: { blocked: false }, toast: null, praise: "", used: {} }

function advance(from, state, flags) {
  let index = from
  let said = ""
  while (steps[index]?.kind === "task" && steps[index].done(state, flags)) {
    said = steps[index].praise
    index += 1
  }
  return { index, said }
}

export default function Practice() {
  const { t, term } = useI18n()
  const [run, setRun] = useState(FRESH)
  const { state, history, step, flags, toast, praise, used } = run
  const current = steps[step]
  const wrong = Object.keys(state).filter((key) => state[key].mark === "yes" && !answer.includes(key))
  const matched = answer.filter((key) => state[key]?.mark === "yes").length
  const lit = current.show ? current.show(state) : []
  const outlined = [...(toast?.blockers ?? []), ...(current.kind === "task" ? [current.target] : []), ...lit]

  function settle(prev, nextState, nextFlags, nextToast, nextHistory) {
    const { index, said } = advance(prev.step, nextState, nextFlags)
    setRun({
      ...prev,
      state: nextState,
      flags: nextFlags,
      toast: nextToast,
      history: nextHistory,
      step: index,
      praise: index !== prev.step ? said : prev.praise,
    })
  }

  function play(r, c) {
    const result = applyClick(state, GRID, r, c, SIZE, rows, cols)
    const changed = result.state !== state
    const nextFlags = !changed && result.toast ? { ...flags, blocked: true } : flags
    const nextToast = result.toast ? { text: result.toast, blockers: result.blockers } : null
    settle(run, result.state, nextFlags, nextToast, changed ? [...history, state] : history)
  }

  function assist() {
    const [, r, c] = current.target.split(":").map((part, index) => (index ? Number(part) : part))
    let next = state
    let nextFlags = flags
    let nextToast = null
    for (let i = 0; i < 3 && !current.done(next, nextFlags); i++) {
      const result = applyClick(next, GRID, r, c, SIZE, rows, cols)
      if (result.state === next) {
        if (result.toast) {
          nextFlags = { ...nextFlags, blocked: true }
          nextToast = { text: result.toast, blockers: result.blockers }
        }
        break
      }
      next = result.state
    }
    settle(run, next, nextFlags, nextToast, next === state ? history : [...history, state])
  }

  function undo() {
    if (!history.length) return
    const previous = history[history.length - 1]
    const first = steps.findIndex((item) => item.kind === "task" && !item.done(previous, flags))
    setRun({
      ...run,
      state: previous,
      history: history.slice(0, -1),
      toast: null,
      step: first !== -1 && first < step ? first : step,
      praise: "",
    })
  }

  function onKeyDown(event) {
    const dr = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0
    const dc = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0
    if (!dr && !dc) return
    const r = Number(event.target.dataset.r) + dr
    const c = Number(event.target.dataset.c) + dc
    if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) return
    event.preventDefault()
    event.currentTarget.querySelector(`[data-r="${r}"][data-c="${c}"]`)?.focus()
  }

  return (
    <div className="practice">
      <Masthead />
      <main className="wrap practice-main">
        <header className="practice-head">
          <p className="file">{t("Practice file")}</p>
          <h1>{t("The Missing Pie")}</h1>
          <p>
            {t("Three villagers, three places, two clues, one minute. Learn the moves here and the real case will feel familiar. Nothing here is saved.")}
          </p>
        </header>
        <div className="practice-body">
          <section className="practice-board" aria-label={t("Practice grid")}>
            <div className="pwrap">
              <div />
              <div className="pcols">
                {cols.map((name) => (
                  <span key={name}>{term(name)}</span>
                ))}
              </div>
              <div className="prows">
                {rows.map((name) => (
                  <span key={name}>{term(name)}</span>
                ))}
              </div>
              <div className={matched === SIZE ? "psub full" : "psub"} role="group" aria-label="Suspects against places" onKeyDown={onKeyDown}>
                {rows.flatMap((row, r) =>
                  cols.map((col, c) => {
                    const key = `${GRID}:${r}:${c}`
                    const mark = state[key]?.mark ?? "empty"
                    const spoken = mark === "yes" ? "ticked" : mark === "no" ? "crossed" : "blank"
                    return (
                      <button
                        key={key}
                        type="button"
                        data-r={r}
                        data-c={c}
                        className={["cell", mark, outlined.includes(key) ? "cue" : ""].join(" ").trim()}
                        aria-label={`${row} and ${col}, ${spoken}`}
                        aria-pressed={mark === "yes"}
                        onClick={() => play(r, c)}
                      >
                        <Mark kind={mark} />
                      </button>
                    )
                  }),
                )}
              </div>
            </div>
            <p className={matched === SIZE ? "tally done" : "tally"}>{matched} of 3 matched</p>
            {toast && (
              <p className="practice-toast" role="status">
                {toast.text}
              </p>
            )}
            <ol className="practice-clues">
              {clues.map((clue, index) => (
                <li key={clue} className={used[index] ? "clue used" : current.clue === index ? "clue now" : "clue"}>
                  <input
                    type="checkbox"
                    checked={Boolean(used[index])}
                    onChange={() => setRun({ ...run, used: { ...used, [index]: !used[index] } })}
                    aria-label={`Clue ${index + 1}, crossed off`}
                  />
                  <p>
                    <span className="num">{index + 1}.</span> {t(clue)}
                  </p>
                </li>
              ))}
            </ol>
            <p className="practice-note">Tick a clue's box once you have used it up. It is only for you.</p>
          </section>
          <aside className="coach" aria-live="polite">
            <div className="coach-top">
              <p className="coach-kicker">
                Step {step + 1} of {steps.length}
              </p>
              <div className="coach-steps" aria-hidden="true">
                {steps.map((item, index) => (
                  <i key={item.title} className={index < step ? "done" : index === step ? "now" : ""} />
                ))}
              </div>
            </div>
            {praise && current.kind !== "end" && <p className="coach-praise">{praise}</p>}
            <h2>{t(current.title)}</h2>
            <p>{current.text}</p>
            {current.list && (
              <dl className="coach-list">
                {current.list.map(([term, text]) => (
                  <div key={term}>
                    <dt>{term}</dt>
                    <dd>{text}</dd>
                  </div>
                ))}
              </dl>
            )}
            {wrong.length > 0 && current.kind !== "end" && (
              <p className="coach-warn">That tick goes against a clue. Click it until it clears, or press Undo.</p>
            )}
            <div className="coach-actions">
              {current.kind === "read" && (
                <button type="button" className="solid" onClick={() => setRun({ ...run, step: step + 1, praise: "" })}>
                  {current.button}
                </button>
              )}
              {current.kind === "task" && (
                <>
                  <p className="coach-wait">Your move. The outlined cell is the one.</p>
                  <button type="button" className="ghost small" onClick={assist}>
                    Do it for me
                  </button>
                </>
              )}
              {current.kind === "end" && (
                <>
                  <Link className="solid" to="/case">
                    Take the real case
                  </Link>
                  <button type="button" className="ghost" onClick={() => setRun(FRESH)}>
                    Play again
                  </button>
                </>
              )}
              {current.kind !== "end" && (
                <button type="button" className="ghost small" onClick={undo} disabled={!history.length}>
                  Undo
                </button>
              )}
            </div>
            {current.kind !== "end" && (
              <p className="coach-skip">
                <Link to="/case">Skip the practice</Link>
              </p>
            )}
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}
