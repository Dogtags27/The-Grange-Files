import { Fragment, useMemo, useRef, useState } from "react"
import { useParsedClues } from "../hooks"
import { countTicks } from "../logic"
import ClueList, { ClueText } from "./ClueList"
import Mark from "./Mark"
import Sheet from "./Sheet"

const HOLD_MS = 480
const DRIFT_PX = 10
const SWIPE_PX = 56

const plain = (value) => value.replace(/\.$/, "")

function tag(value, focus, lit) {
  if (focus === value) return "pin"
  return lit ? "lit" : undefined
}

function say(mark) {
  if (mark === "yes") return "Ticked, a match"
  if (mark === "no") return "Crossed out"
  return "Blank"
}

function listBlocks(bands) {
  return bands.flatMap((band, bandIndex) =>
    [...band.grids]
      .sort((a, b) => a.colIndex - b.colIndex)
      .map((grid) => ({ band, bandIndex, grid, colId: grid.id.split("__")[1] })),
  )
}

export function HowTo() {
  return (
    <div className="m-how">
      <p>
        <span className="swatch no">
          <Mark kind="no" />
        </span>
        Tap once to cross a cell out.
      </p>
      <p>
        <span className="swatch yes">
          <Mark kind="yes" />
        </span>
        Tap again to tick it. That crosses out the rest of its row and column in the square.
      </p>
      <p className="m-how-more">A third tap clears it. Hold a cell to pencil a maybe. Swipe the grid to change square.</p>
    </div>
  )
}

function useSwipe(onNext, onPrev) {
  const from = useRef(null)
  return {
    onTouchStart(event) {
      const touch = event.touches[0]
      from.current = [touch.clientX, touch.clientY]
    },
    onTouchEnd(event) {
      const start = from.current
      from.current = null
      if (!start) return
      const touch = event.changedTouches[0]
      const dx = touch.clientX - start[0]
      const dy = touch.clientY - start[1]
      if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.6) (dx < 0 ? onNext : onPrev)()
    },
  }
}

export default function MobileWorkspace({
  puzzle,
  cells,
  notes,
  pencil,
  onPencil,
  focus,
  onFocus,
  outlined,
  pulse,
  trace,
  onCell,
  onNote,
  checked,
  onToggleClue,
  onUndo,
  canUndo,
  onRedo,
  canRedo,
  menu,
}) {
  const blocks = useMemo(() => listBlocks(puzzle.bands), [puzzle.bands])
  const values = useMemo(() => puzzle.categories.flatMap((category) => category.values), [puzzle.categories])
  const parsed = useParsedClues(puzzle.clues, values)
  const clueCount = puzzle.clues.length
  const [at, setAt] = useState(0)
  const [dir, setDir] = useState(0)
  const [sel, setSel] = useState(null)
  const [sheet, setSheet] = useState(null)
  const [spotSeen, setSpotSeen] = useState(null)
  const [clueAt, setClueAt] = useState(() => {
    const first = puzzle.clues.findIndex((_, index) => !checked[index])
    return first < 0 ? 0 : first
  })
  const hold = useRef({ timer: 0, fired: false, x: 0, y: 0 })

  function go(next) {
    if (next < 0 || next >= blocks.length || next === at) return
    setDir(next > at ? 1 : -1)
    setAt(next)
  }

  const spot = outlined[0] ?? null
  if (spot !== spotSeen) {
    setSpotSeen(spot)
    const index = spot ? blocks.findIndex((block) => block.grid.id === spot.split(":")[0]) : -1
    if (index >= 0 && index !== at) {
      setDir(0)
      setAt(index)
    }
  }

  const stepClue = (amount) => setClueAt((index) => (index + amount + clueCount) % clueCount)
  const boardSwipe = useSwipe(() => go(at + 1), () => go(at - 1))
  const clueSwipe = useSwipe(() => stepClue(1), () => stepClue(-1))

  function reveal(value) {
    const categoryOf = (item) => puzzle.categories.find((category) => category.values.includes(item))?.id
    const id = categoryOf(value)
    if (!id) return
    const wanted = new Set(parsed[clueAt].filter((part) => part.value).map((part) => categoryOf(part.value)))
    wanted.add(id)
    const rank = (block) =>
      (block.band.row.id === id || block.colId === id ? 10 : 0) +
      (wanted.has(block.band.row.id) ? 1 : 0) +
      (wanted.has(block.colId) ? 1 : 0)
    let best = at
    blocks.forEach((block, index) => {
      if (rank(block) > rank(blocks[best])) best = index
    })
    go(best)
  }

  function pickTerm(value) {
    const turningOn = focus !== value
    onFocus(value)
    if (turningOn) reveal(value)
    return turningOn
  }

  function crossOff() {
    const wasDone = Boolean(checked[clueAt])
    onToggleClue(clueAt)
    if (wasDone) return
    for (let step = 1; step < clueCount; step += 1) {
      const next = (clueAt + step) % clueCount
      if (!checked[next]) {
        setClueAt(next)
        return
      }
    }
  }

  function press(event, grid, r, c) {
    const h = hold.current
    clearTimeout(h.timer)
    h.fired = false
    h.x = event.clientX
    h.y = event.clientY
    h.timer = setTimeout(() => {
      h.fired = true
      h.timer = 0
      navigator.vibrate?.(14)
      setSel({ id: grid.id, r, c })
      onNote(`${grid.id}:${r}:${c}`)
    }, HOLD_MS)
  }

  function drift(event) {
    const h = hold.current
    if (h.timer && (Math.abs(event.clientX - h.x) > DRIFT_PX || Math.abs(event.clientY - h.y) > DRIFT_PX)) {
      clearTimeout(h.timer)
      h.timer = 0
    }
  }

  function lift() {
    clearTimeout(hold.current.timer)
    hold.current.timer = 0
  }

  function tap(grid, r, c) {
    if (hold.current.fired) {
      hold.current.fired = false
      return
    }
    setSel({ id: grid.id, r, c })
    onCell(grid, r, c)
    navigator.vibrate?.(8)
  }

  const { band, grid } = blocks[at]
  const count = countTicks(cells, grid.id)
  const here = sel && sel.id === grid.id ? sel : null
  const pickedKey = here ? `${grid.id}:${here.r}:${here.c}` : null
  const pickedMark = pickedKey ? (cells[pickedKey]?.mark ?? "empty") : null
  const who = pickedKey && pickedMark !== "empty" && trace ? trace(pickedKey) : null
  const close = () => setSheet(null)
  const slide = dir > 0 ? " from-right" : dir < 0 ? " from-left" : ""

  return (
    <div className="m-work">
      <div className="m-nav">
        <button type="button" className="m-step" aria-label="Previous square" disabled={at === 0} onClick={() => go(at - 1)}>
          ‹
        </button>
        <button type="button" className="m-title" aria-haspopup="dialog" onClick={() => setSheet("map")}>
          <span className="m-name">
            {band.row.name} <i>×</i> {grid.colName}
          </span>
          <span className="m-meta">
            Square {at + 1} of {blocks.length} · {count} of 5 matched · Map
          </span>
        </button>
        <button
          type="button"
          className={count === 5 ? "m-step ready" : "m-step"}
          aria-label="Next square"
          disabled={at === blocks.length - 1}
          onClick={() => go(at + 1)}
        >
          ›
        </button>
      </div>

      <ol className="m-rail" aria-label="All squares">
        {blocks.map((block, index) => {
          const n = countTicks(cells, block.grid.id)
          const stirring = pulse && index !== at && pulse.key.startsWith(`${block.grid.id}:`)
          return (
            <li key={block.grid.id}>
              <button
                type="button"
                className={`${index === at ? "now" : ""}${n === 5 ? " full" : ""}${stirring ? " stir" : ""}`}
                style={stirring && pulse.color ? { "--pulse": pulse.color } : undefined}
                aria-label={`${block.band.row.name} by ${block.grid.colName}, ${n} of 5 matched`}
                aria-current={index === at ? "true" : undefined}
                onClick={() => go(index)}
              >
                <i>
                  <b style={{ width: `${n * 20}%` }} />
                </i>
              </button>
            </li>
          )
        })}
      </ol>

      <div className="m-stage" {...boardSwipe}>
        <div key={grid.id} className={`m-board${pencil ? " penciling" : ""}${slide}`}>
          <div className="m-corner">
            <span>Across</span>
            <b>{grid.colName}</b>
            <span>Down</span>
            <b>{band.row.name}</b>
          </div>
          <div className="m-cols">
            {grid.colValues.map((value, j) => (
              <span key={value} className={tag(value, focus, here && here.c === j)}>
                {plain(value)}
              </span>
            ))}
          </div>
          <div className="m-rows">
            {grid.rowValues.map((value, i) => (
              <span key={value} className={tag(value, focus, here && here.r === i)}>
                {plain(value)}
              </span>
            ))}
          </div>
          <div className={count === 5 ? "subgrid full" : "subgrid"} role="group" aria-label={`${band.row.name} against ${grid.colName}`}>
            {grid.rowValues.flatMap((rowValue, r) =>
              grid.colValues.map((colValue, c) => {
                const key = `${grid.id}:${r}:${c}`
                const mark = cells[key]?.mark ?? "empty"
                const classes = ["cell", mark]
                if (here && (here.r === r || here.c === c)) classes.push("ruled")
                if (here && here.r === r && here.c === c) classes.push("aim")
                if (outlined.includes(key)) classes.push("blocker")
                if (pulse?.key === key) classes.push("pulse")
                const pencilled = Boolean(notes[key])
                const ink = typeof notes[key] === "string" ? notes[key] : null
                return (
                  <button
                    key={key}
                    type="button"
                    data-key={key}
                    className={classes.join(" ")}
                    style={pulse?.key === key && pulse.color ? { "--pulse": pulse.color } : undefined}
                    aria-label={`${plain(rowValue)} and ${plain(colValue)}, ${say(mark).toLowerCase()}${pencilled ? ", pencilled" : ""}`}
                    aria-pressed={mark === "yes"}
                    onPointerDown={(event) => press(event, grid, r, c)}
                    onPointerMove={drift}
                    onPointerUp={lift}
                    onPointerCancel={lift}
                    onPointerLeave={lift}
                    onClick={() => tap(grid, r, c)}
                    onContextMenu={(event) => event.preventDefault()}
                  >
                    <Mark kind={mark} />
                    {pencilled && (
                      <i className="pencilmark" style={ink ? { borderColor: ink } : undefined} aria-hidden="true" />
                    )}
                  </button>
                )
              }),
            )}
          </div>
        </div>
      </div>

      <div className="m-caption" aria-live="polite">
        {here ? (
          <>
            <p className="m-cap-main">
              <b>{plain(grid.rowValues[here.r])}</b> and <b>{plain(grid.colValues[here.c])}</b>
            </p>
            <p className="m-cap-sub">
              {say(pickedMark)}
              {notes[pickedKey] ? ", pencilled" : ""}
              {who && (
                <>
                  {" · "}
                  {who.color && <i className="seat-dot" style={{ "--seat": who.color }} aria-hidden="true" />}
                  {who.who}, {who.ago}
                </>
              )}
            </p>
          </>
        ) : pencil ? (
          <>
            <p className="m-cap-main">Pencil is on.</p>
            <p className="m-cap-sub">Tap a cell to note a maybe. Tap Pencil again to stop.</p>
          </>
        ) : count === 5 ? (
          <>
            <p className="m-cap-main">All five matched here.</p>
            <p className="m-cap-sub">Swipe or tap › for the next square.</p>
          </>
        ) : (
          <>
            <p className="m-cap-main">Tap to cross. Tap again to tick.</p>
            <p className="m-cap-sub">A third tap clears it. Hold a cell to pencil a maybe.</p>
          </>
        )}
      </div>

      <div className="m-dock">
        <section className="m-clue" aria-label="Current clue" {...clueSwipe}>
          <button type="button" className="m-clue-step" aria-label="Previous clue" onClick={() => stepClue(-1)}>
            ‹
          </button>
          <div className="m-clue-main">
            <div className="m-clue-top">
              <span>
                Clue {clueAt + 1} of {clueCount}
              </span>
              <button type="button" className="text-link" onClick={crossOff}>
                {checked[clueAt] ? "Bring it back" : "Cross off"}
              </button>
            </div>
            <p className={checked[clueAt] ? "m-clue-text used" : "m-clue-text"}>
              <ClueText parts={parsed[clueAt]} focus={focus} onFocus={pickTerm} />
            </p>
          </div>
          <button type="button" className="m-clue-step" aria-label="Next clue" onClick={() => stepClue(1)}>
            ›
          </button>
        </section>
        <div className="m-bar" role="toolbar" aria-label="Tools">
          <button type="button" onClick={onUndo} disabled={!canUndo}>
            Undo
          </button>
          <button type="button" onClick={onRedo} disabled={!canRedo}>
            Redo
          </button>
          <button type="button" className={pencil ? "on" : undefined} aria-pressed={pencil} onClick={onPencil}>
            Pencil
          </button>
          <button type="button" aria-haspopup="dialog" onClick={() => setSheet("clues")}>
            Clues
          </button>
          <button type="button" aria-haspopup="dialog" onClick={() => setSheet("menu")}>
            More
          </button>
        </div>
      </div>

      {sheet === "map" && (
        <Sheet title="The sheet" onClose={close}>
          <div className="m-map">
            <span />
            {puzzle.columns.map((column) => (
              <b key={column.id} className="m-map-col">
                {column.name}
              </b>
            ))}
            {puzzle.bands.map((row) => (
              <Fragment key={row.row.id}>
                <b className="m-map-row">{row.row.name}</b>
                {puzzle.columns.map((column, colIndex) => {
                  const index = blocks.findIndex((block) => block.band === row && block.grid.colIndex === colIndex)
                  if (index < 0) return <span key={column.id} className="m-tile gap" aria-hidden="true" />
                  const n = countTicks(cells, blocks[index].grid.id)
                  return (
                    <button
                      key={column.id}
                      type="button"
                      className={`m-tile${index === at ? " now" : ""}${n === 5 ? " full" : ""}`}
                      aria-label={`${row.row.name} by ${column.name}, ${n} of 5 matched`}
                      onClick={() => {
                        go(index)
                        close()
                      }}
                    >
                      <b>{n}</b>
                      <span>of 5</span>
                    </button>
                  )
                })}
              </Fragment>
            ))}
          </div>
          <p className="m-map-note">Pick a square to jump to it. On the grid, swipe sideways to move between squares.</p>
        </Sheet>
      )}

      {sheet === "clues" && (
        <Sheet title="All clues" tall onClose={close}>
          <ClueList
            sheet
            clues={puzzle.clues}
            values={values}
            checked={checked}
            focus={focus}
            current={clueAt}
            tip="Tap a dashed name to jump to it on the grid. Tap a clue to cross it off."
            onToggle={(index) => {
              setClueAt(index)
              onToggleClue(index)
            }}
            onFocus={(value) => {
              if (pickTerm(value)) close()
            }}
          />
        </Sheet>
      )}

      {sheet === "menu" && (
        <Sheet title="More" onClose={close}>
          {menu(close)}
        </Sheet>
      )}
    </div>
  )
}
