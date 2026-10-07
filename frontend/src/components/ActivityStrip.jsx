import { useEffect, useRef, useState } from "react"

const KINDS = new Set(["join", "leave", "cross", "tick", "untick", "undo", "redo", "elder", "refused", "start", "doubtCleared"])

function rowsFrom(log, members, me) {
  return [...(log ?? [])]
    .reverse()
    .filter((entry) => KINDS.has(entry.kind))
    .slice(0, 8)
    .map((entry) => {
      const mine = Boolean(entry.byId) && entry.byId === me
      const named = Boolean(entry.by) && entry.text.startsWith(`${entry.by} `)
      const who = named ? (mine ? "You" : entry.by) : ""
      const rest = named ? entry.text.slice(entry.by.length + 1) : entry.text
      const color = members.find((member) => member.id === entry.byId)?.color
      return { key: `${entry.t}-${entry.kind}-${entry.text}`, who, rest, color, mine }
    })
}

export function ActivityList({ log, members, me }) {
  const rows = rowsFrom(log, members, me)
  if (rows.length === 0) return <p className="activity-empty">Nothing yet. The first mark will show up here.</p>
  return (
    <ul className="activity-list">
      {rows.map((row) => (
        <li key={row.key} className={row.mine ? "mine" : undefined}>
          <i className="seat-dot" style={{ "--seat": row.color ?? "var(--muted)" }} aria-hidden="true" />
          <span>
            {row.who && <b>{row.who} </b>}
            {row.rest}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function ActivityMenu({ log, members, me }) {
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function away(event) {
      if (box.current && !box.current.contains(event.target)) setOpen(false)
    }
    function esc(event) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", away)
    document.addEventListener("keydown", esc)
    return () => {
      document.removeEventListener("pointerdown", away)
      document.removeEventListener("keydown", esc)
    }
  }, [open])

  return (
    <div className="activity-menu" ref={box}>
      <button
        type="button"
        className={open ? "ghost small on" : "ghost small"}
        aria-expanded={open}
        aria-controls="activity-pop"
        onClick={() => setOpen((prev) => !prev)}
      >
        Activity
      </button>
      {open && (
        <div className="activity-pop" id="activity-pop" role="region" aria-label="Recent table activity">
          <p className="activity-title">Latest at the table</p>
          <ActivityList log={log} members={members} me={me} />
        </div>
      )}
    </div>
  )
}
