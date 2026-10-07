import { useRef, useState } from "react"
import { countTicks } from "../logic"
import Mark from "./Mark"

function spoken(mark) {
  if (mark === "yes") return "ticked"
  if (mark === "no") return "crossed"
  return "blank"
}

function labelClass(value, focus, lit) {
  if (focus === value) return "pin"
  return lit ? "lit" : undefined
}

function Block({
  band,
  bandIndex,
  grid,
  cells,
  notes,
  hover,
  setHover,
  outlined,
  active,
  setActive,
  onCell,
  onNote,
  onKeyNav,
}) {
  const here = hover && hover.gridId === grid.id ? hover : null
  const count = countTicks(cells, grid.id)
  return (
    <div className={count === 5 ? "block full" : "block"}>
      <div
        className="subgrid"
        role="group"
        aria-label={`${band.row.name} against ${grid.colName}`}
        onMouseLeave={() => setHover(null)}
      >
        {grid.rowValues.flatMap((rowValue, r) =>
          grid.colValues.map((colValue, c) => {
            const key = `${grid.id}:${r}:${c}`
            const mark = cells[key]?.mark ?? "empty"
            const ruled = here && (here.r === r || here.c === c)
            const classes = ["cell", mark]
            if (ruled) classes.push("ruled")
            if (here && here.r === r && here.c === c) classes.push("aim")
            if (outlined.includes(key)) classes.push("blocker")
            const pencilled = Boolean(notes[key])
            const ink = typeof notes[key] === "string" ? notes[key] : null
            const aim = { gridId: grid.id, bandId: band.row.id, colIndex: grid.colIndex, r, c }
            return (
              <button
                key={key}
                type="button"
                data-key={key}
                className={classes.join(" ")}
                aria-label={`${rowValue} and ${colValue}, ${spoken(mark)}${pencilled ? ", pencilled" : ""}`}
                aria-pressed={mark === "yes"}
                tabIndex={active === key ? 0 : -1}
                onClick={() => onCell(grid, r, c)}
                onContextMenu={(event) => {
                  event.preventDefault()
                  onNote(key)
                }}
                onKeyDown={(event) => onKeyNav(event, bandIndex, grid, r, c)}
                onMouseEnter={() => setHover(aim)}
                onFocus={() => {
                  setHover(aim)
                  setActive(key)
                }}
                onBlur={() => setHover(null)}
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
      <p className="tally">{count} of 5 matched</p>
    </div>
  )
}

export default function LogicSheet({
  columns,
  bands,
  cells,
  focus,
  outlined,
  notes,
  pencil,
  onCell,
  onNote,
  timer,
  panic,
}) {
  const [hover, setHover] = useState(null)
  const [active, setActive] = useState(`${bands[0].grids[0].id}:0:0`)
  const sheet = useRef(null)

  function onKeyNav(event, bandIndex, grid, r, c) {
    if (event.key.toLowerCase() === "n" && !event.ctrlKey && !event.metaKey) {
      event.preventDefault()
      onNote(`${grid.id}:${r}:${c}`)
      return
    }
    const dc = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0
    const dr = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0
    if (!dc && !dr) return
    event.preventDefault()
    const size = grid.rowValues.length
    let band = bandIndex
    let block = grid.colIndex
    let row = r + dr
    let col = c + dc
    if (col < 0 || col >= size) {
      block += dc
      col = (col + size) % size
    }
    if (row < 0 || row >= size) {
      band += dr
      row = (row + size) % size
    }
    const grids = bands[band]?.grids
    if (!grids) return
    if (dc && (block < 0 || block >= grids.length)) return
    const next = grids.find((item) => item.colIndex === Math.min(block, grids.length - 1))
    sheet.current?.querySelector(`[data-key="${next.id}:${row}:${col}"]`)?.focus()
  }

  return (
    <div className={pencil ? "sheet penciling" : "sheet"} ref={sheet}>
      <div className="sheet-head">
        <p className="corner">Hover a cell to follow its row and column.</p>
        {columns.map((column, colIndex) => (
          <div className="colband" key={column.id}>
            <p className="band-name">{column.name}</p>
            <div className="vlabels">
              {column.values.map((value, j) => {
                const lit = hover && hover.colIndex === colIndex && hover.c === j
                return (
                  <span key={value} className={labelClass(value, focus, lit)} title={value}>
                    {value}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {bands.map((band, bandIndex) => (
        <section className="sheet-band" key={band.row.id}>
          <div className="band-body">
            <div className="band-title">
              <span>{band.row.name}</span>
            </div>
            <div className="hlabels">
              {band.row.values.map((value, i) => {
                const lit = hover && hover.bandId === band.row.id && hover.r === i
                return (
                  <span key={value} className={labelClass(value, focus, lit)} title={value}>
                    {value}
                  </span>
                )
              })}
            </div>
            {[0, 1, 2].map((colIndex) => {
              const grid = band.grids.find((item) => item.colIndex === colIndex)
              if (grid) {
                return (
                  <Block
                    key={grid.id}
                    band={band}
                    bandIndex={bandIndex}
                    grid={grid}
                    cells={cells}
                    notes={notes}
                    active={active}
                    setActive={setActive}
                    onNote={onNote}
                    onKeyNav={onKeyNav}
                    hover={hover}
                    setHover={setHover}
                    outlined={outlined}
                    onCell={onCell}
                  />
                )
              }
              if (bandIndex === 1 && colIndex === 2) {
                return (
                  <div key="timer" className="slot">
                    {timer}
                  </div>
                )
              }
              if (bandIndex === 2 && colIndex === 1) {
                return (
                  <div key="panic" className="slot wide">
                    {panic}
                  </div>
                )
              }
              return null
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
