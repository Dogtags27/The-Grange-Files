import { useEffect, useState } from "react"
import { tableRules } from "../content"
import { createTable, joinTable, previewTable, saveSeat } from "../table"
import Modal from "./Modal"

const CODE_RE = /^[a-z]{3,5}-[a-z]{3,5}$/

function problem(error) {
  if (error === "full") return "That table is full. Five is the limit."
  if (error === "table") return "That table is gone. Empty tables are cleared after 15 minutes."
  if (error === "name") return "Use a name made of letters, up to 16."
  if (error === "slow") return "Too many tries. Wait a minute."
  if (error === "busy") return "Every table is taken. Wait a few minutes and try again."
  return "The table did not answer. Is the backend running?"
}

export default function TableForm({ mode, fixedCode = "", onCancel, onSeated }) {
  const [code, setCode] = useState(fixedCode)
  const [name, setName] = useState("")
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const joining = mode === "join"

  useEffect(() => {
    if (!joining) return undefined
    const clean = code.trim().toLowerCase()
    if (!CODE_RE.test(clean)) return undefined
    let alive = true
    previewTable(clean)
      .then((data) => {
        if (alive) setPreview(data)
      })
      .catch(() => {
        if (alive) setPreview({ missing: true })
      })
    return () => {
      alive = false
    }
  }, [code, joining])

  async function go(event) {
    event.preventDefault()
    setBusy(true)
    setError("")
    try {
      const result = joining ? await joinTable(code.trim().toLowerCase(), name) : await createTable(name)
      saveSeat(result.code, result)
      onSeated(result.code)
    } catch (err) {
      setError(problem(err.message))
      setBusy(false)
    }
  }

  const shown = CODE_RE.test(code.trim().toLowerCase()) ? preview : null
  const seated = shown?.members?.map((member) => member.name) ?? []
  const names = seated.length < 2 ? seated[0] : `${seated.slice(0, -1).join(", ")} and ${seated.at(-1)}`
  const ready = name.trim().length > 0 && (!joining || (shown && !shown.missing))

  return (
    <Modal
      kicker={joining ? "Sit down" : "Open a table"}
      title="House rules"
      onClose={onCancel}
      actions={
        <>
          <button type="button" className="ghost" onClick={onCancel}>
            Not now
          </button>
          <button type="submit" form="seat-form" className="solid" disabled={!ready || busy}>
            {busy ? "Saving your seat..." : joining ? "Sit down" : "Open the table"}
          </button>
        </>
      }
    >
      <form id="seat-form" onSubmit={go}>
        {tableRules.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {joining && !fixedCode && (
          <label className="field">
            Table code
            <input value={code} onChange={(event) => setCode(event.target.value)} autoComplete="off" spellCheck="false" />
          </label>
        )}
        {joining && shown?.members && (
          <p className="modal-note">
            {names ? `${names} ${shown.members.length === 1 ? "is" : "are"} already seated.` : "The sheet is still on the table, but the chairs are empty."}
          </p>
        )}
        {joining && shown?.missing && <p className="modal-note">No table by that code. It may have been cleared.</p>}
        <label className="field">
          Your name
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={16} autoComplete="nickname" />
        </label>
        {error && <p className="modal-note">{error}</p>}
      </form>
    </Modal>
  )
}
