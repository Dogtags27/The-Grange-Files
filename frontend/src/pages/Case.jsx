import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { apiUrl, pickOne, plural, postJson } from "../api"
import ClueList from "../components/ClueList"
import Doubt from "../components/Doubt"
import { ElderConfirm, ElderResult } from "../components/Elder"
import LogicSheet from "../components/LogicSheet"
import Mark from "../components/Mark"
import MobileWorkspace, { HowTo } from "../components/MobileWorkspace"
import Nudge from "../components/Nudge"
import { PanicPanel, TimerChip, TimerPanel, elapsedSeconds } from "../components/Panels"
import Reveal from "../components/Reveal"
import { CaseSkeleton } from "../components/Skeletons"
import { refuseLines } from "../content"
import { useCompact, useNudge } from "../hooks"
import { applyClick, collectMarks, countAllTicks, placeTick, removeMarks } from "../logic"
import { describeCell, emptyStats, printSheet } from "../report"
import { clearSave, hasProgress, loadSave, writeSave } from "../storage"

const Lineup = lazy(() => import("../components/Lineup"))
const Celebration = lazy(() => import("../components/Celebration"))

const MAX_TICKS = 30
const LOG_LIMIT = 400
const NO_VERDICT = { result: null, failed: false }
const openingEntry = { t: 0, p: 0, kind: "start", text: "Opened the case file" }

export default function Case() {
  const [saved] = useState(loadSave)
  const [resumeNote, setResumeNote] = useState(() => hasProgress(saved))
  const [puzzle, setPuzzle] = useState(null)
  const [error, setError] = useState(false)
  const [cells, setCells] = useState(saved?.cells ?? {})
  const [history, setHistory] = useState([])
  const [future, setFuture] = useState([])
  const [notes, setNotes] = useState(saved?.notes ?? {})
  const [pencil, setPencil] = useState(false)
  const [checked, setChecked] = useState(saved?.checked ?? {})
  const [focus, setFocus] = useState(null)
  const [toast, setToast] = useState(null)
  const [armed, setArmed] = useState(false)
  const [startedAt, setStartedAt] = useState(() => Date.now() - (saved?.elapsedMs ?? 0))
  const [frozenAt, setFrozenAt] = useState(null)
  const [penalty, setPenalty] = useState(saved?.penalty ?? 0)
  const [stats, setStats] = useState({ ...emptyStats, ...saved?.stats })
  const [log, setLog] = useState(saved?.log ?? [openingEntry])
  const [spotlight, setSpotlight] = useState([])
  const [elder, setElder] = useState(null)
  const [doubt, setDoubt] = useState(null)
  const [scene, setScene] = useState(null)
  const [checking, setChecking] = useState(false)
  const [accused, setAccused] = useState(null)
  const [finalSeconds, setFinalSeconds] = useState(0)
  const [verdict, setVerdict] = useState(NO_VERDICT)
  const latest = useRef(null)
  const compact = useCompact()

  useEffect(() => {
    let alive = true
    fetch(apiUrl("/api/puzzle"))
      .then((res) => {
        if (!res.ok) throw new Error("missing")
        return res.json()
      })
      .then((data) => {
        if (alive) setPuzzle(data)
      })
      .catch(() => {
        if (alive) setError(true)
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    latest.current = { cells, notes, checked, penalty, stats, log, startedAt, done: Boolean(verdict.result?.correct) }
  })

  const persist = useCallback(() => {
    const now = latest.current
    if (!now) return
    if (now.done) {
      clearSave()
      return
    }
    writeSave({
      cells: now.cells,
      notes: now.notes,
      checked: now.checked,
      penalty: now.penalty,
      stats: now.stats,
      log: now.log,
      elapsedMs: Date.now() - now.startedAt,
    })
  }, [])

  useEffect(() => {
    persist()
  }, [cells, notes, checked, penalty, stats, log, verdict, persist])

  useEffect(() => {
    const id = setInterval(persist, 10000)
    window.addEventListener("pagehide", persist)
    return () => {
      clearInterval(id)
      window.removeEventListener("pagehide", persist)
      persist()
    }
  }, [persist])

  useEffect(() => {
    if (!toast) return undefined
    const id = setTimeout(() => setToast(null), 5200)
    return () => clearTimeout(id)
  }, [toast])

  useEffect(() => {
    if (!armed) return undefined
    const id = setTimeout(() => setArmed(false), 4000)
    return () => clearTimeout(id)
  }, [armed])

  useEffect(() => {
    if (!spotlight.length) return
    document.querySelector(`[data-key="${spotlight[0]}"]`)?.scrollIntoView({ block: "center", inline: "center" })
  }, [spotlight])

  const bump = useCallback((patch) => {
    setStats((prev) => {
      const next = { ...prev }
      Object.entries(patch).forEach(([name, amount]) => {
        next[name] += amount
      })
      return next
    })
  }, [])

  function record(kind, text, extraPenalty = 0) {
    const t = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
    setLog((prev) => [...prev.slice(-(LOG_LIMIT - 1)), { t, p: penalty + extraPenalty, kind, text }])
  }

  function commit(next) {
    setHistory((prev) => [...prev, cells])
    setFuture([])
    setCells(next)
  }

  const undo = useCallback(() => {
    if (!history.length || scene) return
    setFuture((prev) => [...prev, cells])
    setCells(history[history.length - 1])
    setHistory((prev) => prev.slice(0, -1))
    setToast(null)
    bump({ undos: 1 })
  }, [history, cells, scene, bump])

  const redo = useCallback(() => {
    if (!future.length || scene) return
    setHistory((prev) => [...prev, cells])
    setCells(future[future.length - 1])
    setFuture((prev) => prev.slice(0, -1))
    setToast(null)
    bump({ redos: 1 })
  }, [future, cells, scene, bump])

  useEffect(() => {
    function onKey(event) {
      const mod = event.ctrlKey || event.metaKey
      const key = event.key.toLowerCase()
      if (mod && key === "z") {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
      } else if (mod && key === "y") {
        event.preventDefault()
        redo()
      } else if (!mod && key === "p" && !scene && !elder) {
        setPencil((prev) => !prev)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [undo, redo, scene, elder])

  const [nudgeLine, dismissNudge] = useNudge({
    startedAt,
    active: Boolean(puzzle) && !verdict.result?.correct,
    quiet: Boolean(scene || elder || doubt),
    onShow: () => {
      bump({ nudges: 1 })
      record("nudge", "The Elder waved at you from across the Grange")
    },
  })

  const values = useMemo(
    () => (puzzle ? puzzle.categories.flatMap((category) => category.values) : []),
    [puzzle],
  )
  const suspects = puzzle?.categories.find((category) => category.id === "suspects")?.values ?? []
  const ticks = countAllTicks(cells)
  const full = ticks === MAX_TICKS
  const outlined = [...(toast?.blockers ?? []), ...spotlight]

  function toggleNote(key) {
    setNotes((prev) => {
      const next = { ...prev }
      if (next[key]) delete next[key]
      else next[key] = true
      return next
    })
    if (!notes[key]) bump({ notes: 1 })
  }

  function onCell(grid, r, c) {
    setArmed(false)
    setSpotlight([])
    const key = `${grid.id}:${r}:${c}`
    if (pencil) {
      toggleNote(key)
      return
    }
    const result = applyClick(cells, grid.id, r, c, grid.rowValues.length, grid.rowValues, grid.colValues)
    if (result.state !== cells) {
      const before = cells[key]?.mark
      const after = result.state[key]?.mark
      const patch = { clicks: 1 }
      if (after === "no") patch.crosses = 1
      if (after === "yes") {
        patch.ticks = 1
        record("tick", `Ticked ${describeCell(puzzle, key)}`)
      }
      if (before === "yes" && !after) {
        patch.clears = 1
        record("untick", `Took back the tick on ${describeCell(puzzle, key)}`)
      }
      bump(patch)
      commit(result.state)
    } else {
      bump({ blocked: 1 })
    }
    setToast(result.toast ? { text: result.toast, blockers: result.blockers, n: Date.now() } : null)
  }

  function toggleClue(index) {
    setChecked((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  function toggleFocus(value) {
    setFocus((prev) => (prev === value ? null : value))
  }

  async function askElder() {
    setElder({ mode: "loading" })
    try {
      const result = await postJson("/api/hint", collectMarks(cells))
      let next = cells
      if (result.kind === "cleanup") next = removeMarks(cells, result.wrongTicks, result.wrongCrosses)
      if (result.kind === "step") next = placeTick(cells, result.key)
      if (next !== cells) {
        setCells(next)
        setHistory([])
        setFuture([])
      }
      setSpotlight(result.kind === "step" ? [result.key] : [])
      if (result.penalty > 0) {
        const wiped = [result.wrongTicks.length ? plural(result.wrongTicks.length, "wrong tick") : "", result.wrongCrosses.length ? plural(result.wrongCrosses.length, "wrong cross") : ""].filter(Boolean).join(" and ")
        const what = result.kind === "cleanup" ? `wiped ${wiped}` : `showed the way: ${result.title}`
        record("elder", `Visited the Elder, who ${what} (+${result.penalty} min)`, result.penalty)
        setPenalty((prev) => prev + result.penalty)
        bump({ elder: 1 })
      }
      setElder({ mode: "result", result, seed: Math.random() })
    } catch {
      setElder({ mode: "error" })
    }
  }

  function showDoubt(found, lead) {
    setDoubt({ ...found, lead })
    setSpotlight([found.key])
  }

  async function openLineup() {
    setChecking(true)
    try {
      const result = await postJson("/api/check", { ticks: collectMarks(cells).ticks })
      if (result.ok) {
        setScene("lineup")
      } else {
        bump({ refused: 1 })
        record("refused", "Asked for the lineup, but the sheet was not right yet")
        if (result.doubt) showDoubt(result.doubt, pickOne(refuseLines))
      }
    } catch {
      setToast({ text: "Mayor Lewis could not reach the backend. Try again in a moment.", blockers: [], n: Date.now() })
    } finally {
      setChecking(false)
    }
  }

  async function present(name) {
    setAccused(name)
    setVerdict(NO_VERDICT)
    setScene("reveal")
    const now = Date.now()
    setFrozenAt(now)
    setFinalSeconds(elapsedSeconds(startedAt, now, penalty, now))
    try {
      const result = await postJson("/api/accuse", { suspect: name, ticks: collectMarks(cells).ticks })
      if (result.correct) {
        record("solved", `Accused ${name}: guilty. Case closed`)
      } else {
        bump({ wrong: 1 })
        record("wrong", `Accused ${name}: not guilty`)
      }
      setVerdict({ result, failed: false })
    } catch {
      setVerdict({ result: null, failed: true })
    }
  }

  function afterWrong() {
    setScene(null)
    setFrozenAt(null)
    const found = verdict.result?.doubt
    if (found) {
      showDoubt(found)
    } else {
      setToast({
        text: "Every tick on your sheet holds up. Maybe re-read the clue about the saboteur.",
        blockers: [],
        n: Date.now(),
      })
    }
  }

  function afterFailed() {
    setScene(null)
    setFrozenAt(null)
  }

  const afterSolved = useCallback(() => setScene("solved"), [])

  function clearDoubted() {
    if (doubt) {
      record("doubtCleared", `Cleared the tick on ${describeCell(puzzle, doubt.key)} after the Mayor's question`)
      commit(removeMarks(cells, [doubt.key], []))
    }
    setDoubt(null)
    setSpotlight([])
  }

  function keepDoubted() {
    if (doubt) record("doubtKept", `Stood by the tick on ${describeCell(puzzle, doubt.key)}`)
    setDoubt(null)
    setSpotlight([])
  }

  function startOver() {
    if (!armed) {
      setArmed(true)
      return
    }
    clearSave()
    setCells({})
    setHistory([])
    setFuture([])
    setNotes({})
    setPencil(false)
    setChecked({})
    setFocus(null)
    setToast(null)
    setSpotlight([])
    setDoubt(null)
    setElder(null)
    setScene(null)
    setVerdict(NO_VERDICT)
    setPenalty(0)
    setStats(emptyStats)
    setLog([openingEntry])
    setFrozenAt(null)
    setArmed(false)
    setResumeNote(false)
    setStartedAt(Date.now())
  }

  return (
    <div className={compact ? "case compact" : "case"}>
      <header className="topbar">
        <Link className="back" to="/">
          Case file
        </Link>
        <h1 className="case-title">The Grange Display Case</h1>
        {compact ? (
          <TimerChip startedAt={startedAt} frozenAt={frozenAt} penalty={penalty} />
        ) : (
          <div className="actions">
            <button type="button" className="ghost" onClick={undo} disabled={!history.length}>
              Undo
            </button>
            <button type="button" className="ghost" onClick={redo} disabled={!future.length}>
              Redo
            </button>
            <button type="button" className="ghost" onClick={() => setElder({ mode: "confirm" })} disabled={!puzzle}>
              Ask the Elder
            </button>
            <button type="button" className={armed ? "ghost armed" : "ghost"} onClick={startOver}>
              {armed ? "Really clear it all?" : "Start over"}
            </button>
          </div>
        )}
      </header>
      {!compact && <div className="strip">
        <span className="swatch no">
          <Mark kind="no" />
        </span>
        <p>One click crosses a cell.</p>
        <span className="swatch yes">
          <Mark kind="yes" />
        </span>
        <p>A second click ticks it and crosses out the rest of its row and column in that block.</p>
        <p>A third click clears it.</p>
        <p className="keys">Arrow keys move, Enter cycles, N pencils a maybe.</p>
        <div className="strip-tools">
          <button
            type="button"
            className={pencil ? "ghost small on" : "ghost small"}
            aria-pressed={pencil}
            onClick={() => setPencil((prev) => !prev)}
            title="Pencil mode (P). Right-click also pencils."
          >
            {pencil ? "Pencil on" : "Pencil"}
          </button>
          <button type="button" className="ghost small" onClick={() => printSheet(puzzle, cells)} disabled={!puzzle}>
            Print sheet
          </button>
        </div>
      </div>}
      {resumeNote && !scene && (
        <div className="toast resume-toast" role="status">
          <div>
            <p className="toast-title">Picked up where you left off</p>
            <p>This browser kept your solo sheet. Start over clears it.</p>
          </div>
          <button type="button" onClick={() => setResumeNote(false)}>
            Close
          </button>
        </div>
      )}
      {full && puzzle && !scene && (
        <div className="accuse-bar">
          <p>Every block is full. Mayor Lewis has noticed and is trying very hard to look casual.</p>
          <button type="button" className="solid" onClick={openLineup} disabled={checking}>
            {checking ? "Mayor is checking your sheet..." : "Name the culprit"}
          </button>
        </div>
      )}
      {toast && (
        <div className="toast" role="status" key={toast.n}>
          <div>
            <p className="toast-title">Hold on</p>
            <p>{toast.text}</p>
          </div>
          <button type="button" onClick={() => setToast(null)}>
            Close
          </button>
        </div>
      )}
      {doubt && <Doubt lead={doubt.lead} question={doubt.question} onClear={clearDoubted} onKeep={keepDoubted} />}
      {nudgeLine && !scene && !elder && (
        <Nudge
          line={nudgeLine}
          onDismiss={dismissNudge}
          onAsk={() => {
            dismissNudge()
            setElder({ mode: "confirm" })
          }}
        />
      )}
      {error && <p className="status">The case file did not load. Is the backend running?</p>}
      {!error && !puzzle && <CaseSkeleton />}
      {puzzle && compact && (
        <div className="workspace">
          <MobileWorkspace
            puzzle={puzzle}
            cells={cells}
            notes={notes}
            pencil={pencil}
            onPencil={() => setPencil((prev) => !prev)}
            focus={focus}
            onFocus={toggleFocus}
            outlined={outlined}
            onCell={onCell}
            onNote={toggleNote}
            checked={checked}
            onToggleClue={toggleClue}
            onUndo={undo}
            canUndo={history.length > 0}
            onRedo={redo}
            canRedo={future.length > 0}
            menu={(close) => (
              <div className="m-menu">
                <HowTo />
                <div className="m-menu-list">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                      close()
                      setElder({ mode: "confirm" })
                    }}
                  >
                    Ask the Elder
                  </button>
                  <button type="button" className="ghost" onClick={() => printSheet(puzzle, cells)}>
                    Print sheet
                  </button>
                  <button
                    type="button"
                    className={armed ? "ghost armed" : "ghost"}
                    onClick={() => {
                      if (armed) close()
                      startOver()
                    }}
                  >
                    {armed ? "Really clear it all?" : "Start over"}
                  </button>
                </div>
                <TimerPanel startedAt={startedAt} frozenAt={frozenAt} penalty={penalty} />
                <PanicPanel ticks={ticks} total={MAX_TICKS} />
              </div>
            )}
          />
        </div>
      )}
      {puzzle && !compact && (
        <div className="workspace">
          <div className="sheet-scroll">
            <LogicSheet
              columns={puzzle.columns}
              bands={puzzle.bands}
              cells={cells}
              notes={notes}
              pencil={pencil}
              focus={focus}
              outlined={outlined}
              onCell={onCell}
              onNote={toggleNote}
              timer={<TimerPanel startedAt={startedAt} frozenAt={frozenAt} penalty={penalty} />}
              panic={<PanicPanel ticks={ticks} total={MAX_TICKS} />}
            />
          </div>
          <ClueList
            clues={puzzle.clues}
            values={values}
            checked={checked}
            focus={focus}
            onToggle={toggleClue}
            onFocus={toggleFocus}
          />
        </div>
      )}
      {elder?.mode === "confirm" && <ElderConfirm onCancel={() => setElder(null)} onConfirm={askElder} />}
      {elder && elder.mode !== "confirm" && <ElderResult ui={elder} onClose={() => setElder(null)} />}
      <Suspense fallback={null}>
        {scene === "lineup" && <Lineup suspects={suspects} onBack={() => setScene(null)} onPresent={present} />}
      </Suspense>
      {scene === "reveal" && (
        <Reveal
          name={accused}
          result={verdict.result}
          failed={verdict.failed}
          onWrong={afterWrong}
          onSolved={afterSolved}
          onBack={afterFailed}
        />
      )}
      <Suspense fallback={null}>
        {scene === "solved" && verdict.result?.correct && (
          <Celebration
            result={verdict.result}
            puzzle={puzzle}
            cells={cells}
            seconds={finalSeconds}
            penalty={penalty}
            stats={stats}
            log={log}
            onClose={() => setScene(null)}
          />
        )}
      </Suspense>
    </div>
  )
}
