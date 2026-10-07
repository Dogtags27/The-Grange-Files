import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import Pusher from "pusher-js"
import ClueList from "../components/ClueList"
import Doubt from "../components/Doubt"
import { ElderConfirm, ElderResult } from "../components/Elder"
import LogicSheet from "../components/LogicSheet"
import Mark from "../components/Mark"
import Nudge from "../components/Nudge"
import { PanicPanel, TimerPanel } from "../components/Panels"
import Reveal from "../components/Reveal"
import { CaseSkeleton } from "../components/Skeletons"
import TableForm from "../components/TableForm"
import { apiUrl } from "../api"
import { useNudge } from "../hooks"
import { copyText } from "../report"
import { act, clearSeat, leaveTable, loadSeat, loadTable, noteInk, pingTable, unpackCells } from "../table"

const Lineup = lazy(() => import("../components/Lineup"))
const Celebration = lazy(() => import("../components/Celebration"))

const MAX_TICKS = 30

function problem(error) {
  if (error === "slow") return "The table is rate limiting you. Wait a minute."
  if (error === "tie") return "It's a tie. Someone has to switch."
  return "The table did not take that."
}

export default function TablePlay() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [seat, setSeat] = useState(() => loadSeat(code))
  const [table, setTable] = useState(null)
  const [puzzle, setPuzzle] = useState(null)
  const [gone, setGone] = useState(false)
  const [live, setLive] = useState(true)
  const [focus, setFocus] = useState(null)
  const [pencil, setPencil] = useState(false)
  const [armed, setArmed] = useState(false)
  const [elderAsk, setElderAsk] = useState(false)
  const [toastOff, setToastOff] = useState(0)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(null)
  const seen = useRef(0)

  const take = useCallback((next) => {
    if (!next) return
    if (next.gone) {
      setGone(true)
      return
    }
    if (next.refetch) {
      const current = loadSeat(code)
      if (current) loadTable(code, current.token).then((data) => take(data)).catch(() => {})
      return
    }
    if (typeof next.rev === "number" && next.rev < seen.current) return
    if (typeof next.rev === "number") seen.current = next.rev
    setTable((prev) => ({
      ...next,
      me: next.me || prev?.me,
      pusherKey: next.pusherKey || prev?.pusherKey,
      cluster: next.cluster || prev?.cluster || "us2",
    }))
  }, [code])

  useEffect(() => {
    let alive = true
    fetch(apiUrl("/api/puzzle"))
      .then((res) => res.json())
      .then((data) => {
        if (alive) setPuzzle(data)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const current = loadSeat(code)
    if (!current) return undefined
    let pusher
    let stop = false
    loadTable(code, current.token)
      .then((data) => {
        if (stop) return
        take(data)
        if (!data.pusherKey) {
          setLive(false)
          return
        }
        pusher = new Pusher(data.pusherKey, {
          cluster: data.cluster,
          forceTLS: true,
          authEndpoint: apiUrl("/api/pusher/auth"),
          auth: { params: { token: current.token } },
        })
        const channel = pusher.subscribe(`private-table-${code}`)
        channel.bind("state", (payload) => take(payload))
        channel.bind("pusher:subscription_succeeded", () => setLive(true))
        channel.bind("pusher:subscription_error", () => setLive(false))
      })
      .catch((err) => {
        if (stop) return
        if (err.status === 401 || err.status === 404) {
          clearSeat(code)
          setSeat(null)
          setGone(err.status === 404)
        }
      })
    const ping = setInterval(() => {
      pingTable(code, current.token).catch(() => {})
    }, 20000)
    return () => {
      stop = true
      clearInterval(ping)
      pusher?.disconnect()
    }
  }, [code, seat, take])

  useEffect(() => {
    function onKey(event) {
      const mod = event.ctrlKey || event.metaKey
      const key = event.key.toLowerCase()
      if (mod && key === "z") {
        event.preventDefault()
        op({ type: event.shiftKey ? "redo" : "undo" })
      } else if (mod && key === "y") {
        event.preventDefault()
        op({ type: "redo" })
      } else if (!mod && key === "p" && !table?.scene) {
        setPencil((prev) => !prev)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const [nudgeLine, dismissNudge] = useNudge({
    startedAt: table?.startedAt ?? 0,
    active: Boolean(table) && table.scene !== "solved",
    quiet: Boolean(table?.scene || table?.elder || table?.doubt || elderAsk),
  })

  async function op(body) {
    const current = loadSeat(code)
    if (!current) return
    try {
      take(await act(code, current.token, body))
      setError("")
    } catch (err) {
      setError(problem(err.message))
    }
  }

  async function copyLink() {
    setCopied((await copyText(`${window.location.origin}/case/${code}`)) ? "yes" : "no")
    setTimeout(() => setCopied(null), 3500)
  }

  async function leave() {
    const current = loadSeat(code)
    if (current) await leaveTable(code, current.token).catch(() => {})
    clearSeat(code)
    navigate("/")
  }

  if (!CODE_RE_SAFE(code)) return <p className="status">That table code is not one of ours.</p>
  if (!seat) {
    return (
      <div className="case">
        {gone && <p className="status">That table was cleared 15 minutes after the last person left.</p>}
        <TableForm mode="join" fixedCode={code} onCancel={() => navigate("/")} onSeated={() => setSeat(loadSeat(code))} />
      </div>
    )
  }
  if (!table || !puzzle) return <CaseSkeleton />

  const cells = unpackCells(table.cells)
  const ticks = Object.values(table.cells).filter((value) => value === 1).length
  const suspects = puzzle.categories.find((category) => category.id === "suspects")?.values ?? []
  const values = puzzle.categories.flatMap((category) => category.values)
  const ballots = table.members
    .filter((member) => table.votes[member.id])
    .map((member) => ({
      name: member.id === table.me ? "You" : member.name,
      suspect: table.votes[member.id],
      mine: member.id === table.me,
    }))
  const counts = Object.values(table.split ?? {})
  const top = counts.length ? Math.max(...counts) : 0
  const tie = counts.filter((count) => count === top).length > 1
  const splitNote = table.split
    ? `${Object.entries(table.split).map(([name, count]) => `${count} say ${name}`).join(". ")}.${tie ? " It's a tie, so someone has to switch." : " The bigger group can go ahead."}`
    : ballots.length
      ? "Circle a suspect. The envelope opens when everyone agrees."
      : ""

  return (
    <div className="case">
      <header className="topbar">
        <Link className="back" to="/">
          Case file
        </Link>
        <h1 className="case-title">Table {table.code}</h1>
        <div className="actions">
          <button type="button" className="ghost" onClick={() => op({ type: "undo" })} disabled={!table.canUndo}>
            Undo
          </button>
          <button type="button" className="ghost" onClick={() => op({ type: "redo" })} disabled={!table.canRedo}>
            Redo
          </button>
          <button type="button" className="ghost" onClick={() => setElderAsk(true)} disabled={Boolean(table.scene)}>
            Ask the Elder
          </button>
          <button type="button" className={armed ? "ghost armed" : "ghost"} onClick={() => (armed ? op({ type: "start" }).then(() => setArmed(false)) : setArmed(true))}>
            {armed ? "Really clear it all?" : "Start over"}
          </button>
          <button type="button" className="ghost" onClick={leave}>
            Leave
          </button>
        </div>
      </header>
      <ul className="seated">
        {table.members.map((member) => (
          <li key={member.id} style={{ borderColor: member.color }}>
            {member.name}
            {member.id === table.me ? " (you)" : ""}
          </li>
        ))}
        {!live && <li className="seat-warn">Live updates are off. Refresh to see the others.</li>}
        <li className="copy-link">
          <span role="status">{copied === "yes" ? "Link copied" : copied === "no" ? "Copy blocked. Share the code instead." : ""}</span>
          <button type="button" className="ghost small" onClick={copyLink}>
            Copy table link
          </button>
        </li>
      </ul>
      <div className="strip">
        <span className="swatch no"><Mark kind="no" /></span>
        <p>One click crosses a cell.</p>
        <span className="swatch yes"><Mark kind="yes" /></span>
        <p>A second click ticks it. A third clears it. N pencils a maybe, in your color.</p>
        <div className="strip-tools">
          <button type="button" className={pencil ? "ghost small on" : "ghost small"} aria-pressed={pencil} onClick={() => setPencil((prev) => !prev)}>
            {pencil ? "Pencil on" : "Pencil"}
          </button>
        </div>
      </div>
      {ticks === MAX_TICKS && !table.scene && (
        <div className="accuse-bar">
          <p>Every block is full. The whole table has to agree before Mayor Lewis opens the envelope.</p>
          <button type="button" className="solid" onClick={() => op({ type: "check" })}>Name the culprit</button>
        </div>
      )}
      {error && <p className="status">{error}</p>}
      {table.toast && table.rev !== toastOff && (
        <div className="toast" role="status">
          <div>
            <p className="toast-title">Hold on</p>
            <p>{table.toast.text}</p>
          </div>
          <button type="button" onClick={() => setToastOff(table.rev)}>Close</button>
        </div>
      )}
      {table.doubt && (
        <Doubt
          lead={table.doubt.lead}
          question={table.doubt.question}
          onClear={() => op({ type: "doubtClear" })}
          onKeep={() => op({ type: "doubtKeep" })}
        />
      )}
      {nudgeLine && !table.scene && !elderAsk && !table.elder && (
        <Nudge line={nudgeLine} onDismiss={dismissNudge} onAsk={() => { dismissNudge(); setElderAsk(true) }} />
      )}
      <div className="workspace">
        <div className="sheet-scroll">
          <LogicSheet
            columns={puzzle.columns}
            bands={puzzle.bands}
            cells={cells}
            notes={noteInk(table.notes, table.members)}
            pencil={pencil}
            focus={focus}
            outlined={[...(table.toast?.blockers ?? []), ...table.spotlight]}
            onCell={(grid, r, c) => op(pencil ? { type: "note", key: `${grid.id}:${r}:${c}` } : { type: "click", gridId: grid.id, r, c })}
            onNote={(key) => op({ type: "note", key })}
            timer={<TimerPanel startedAt={table.startedAt} frozenAt={table.frozenAt} penalty={table.penalty} />}
            panic={<PanicPanel ticks={ticks} total={MAX_TICKS} />}
          />
        </div>
        <ClueList
          clues={puzzle.clues}
          values={values}
          checked={table.checked}
          focus={focus}
          onToggle={(index) => op({ type: "clue", index })}
          onFocus={(value) => setFocus((prev) => (prev === value ? null : value))}
        />
      </div>
      {elderAsk && <ElderConfirm onCancel={() => setElderAsk(false)} onConfirm={() => { setElderAsk(false); op({ type: "hint" }) }} />}
      {table.elder && <ElderResult ui={{ mode: "result", result: table.elder.result, seed: table.rev }} onClose={() => op({ type: "elderClose" })} />}
      <Suspense fallback={null}>
        {table.scene === "lineup" && (
          <Lineup
            suspects={suspects}
            ballots={ballots}
            onPick={(suspect) => op({ type: "vote", suspect })}
            onBack={() => op({ type: "back" })}
            onPresent={() => op({ type: "present" })}
            presentOff={!table.split || tie}
            presentText={tie ? "It's a tie" : table.split ? "Present the majority" : "Waiting for the table"}
            note={splitNote}
          />
        )}
        {table.scene === "solved" && table.verdict?.correct && (
          <Celebration
            result={table.verdict}
            puzzle={puzzle}
            cells={cells}
            seconds={table.finalSeconds}
            penalty={table.penalty}
            stats={table.stats}
            log={table.log}
            onClose={() => op({ type: "look" })}
          />
        )}
      </Suspense>
      {table.scene === "reveal" && (
        <Reveal
          name={table.accused}
          result={table.verdict}
          failed={!table.verdict}
          onWrong={() => op({ type: "finish" })}
          onSolved={() => op({ type: "finish" })}
          onBack={() => op({ type: "finish" })}
        />
      )}
    </div>
  )
}

function CODE_RE_SAFE(code) {
  return /^[a-z]{3,5}-[a-z]{3,5}$/.test(code ?? "")
}
