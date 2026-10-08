import { useEffect, useState } from "react"
import { tableRules } from "../content"
import { useCompact } from "../hooks"
import { useI18n } from "../i18n.jsx"
import { createTable, joinTable, previewTable, saveSeat } from "../table"
import Modal from "./Modal"

const CODE_RE = /^[a-z]{3,5}-[a-z]{3,5}$/

function problem(error) {
  if (error === "full") return "That table is full. Five is the limit."
  if (error === "table") return "That table is gone. Empty tables are cleared after 15 minutes."
  if (error === "name") return "Use a name made of letters, up to 16. No digits."
  if (error === "slow") return "Too many tries. Wait a minute."
  if (error === "busy") return "Every table is taken. Wait a few minutes and try again."
  if (error === "offline") return "The table server is not answering. Start the backend, then try again."
  return "The table did not answer. Is the backend running?"
}

function lookUp(code) {
  return previewTable(code)
    .then((data) => ({ kind: "ready", data }))
    .catch((err) => {
      if (err.status === 404) return { kind: "missing" }
      return { kind: "offline" }
    })
}

export default function TableForm({ mode, fixedCode = "", onCancel, onSeated }) {
  const [typed, setTyped] = useState("")
  const [name, setName] = useState("")
  const [look, setLook] = useState(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [tick, setTick] = useState(0)
  const compact = useCompact()
  const { t } = useI18n()
  const joining = mode === "join"
  const clean = (fixedCode || typed).trim().toLowerCase()
  const valid = CODE_RE.test(clean)
  const shown = look?.code === clean ? look : joining && valid ? { kind: "loading" } : null

  useEffect(() => {
    if (!joining || !valid) return undefined
    let alive = true
    lookUp(clean).then((next) => {
      if (alive) setLook({ code: clean, ...next })
    })
    return () => {
      alive = false
    }
  }, [clean, joining, valid, tick])

  useEffect(() => {
    if (!joining || shown?.kind !== "offline") return undefined
    const id = setInterval(() => setTick((n) => n + 1), 4000)
    return () => clearInterval(id)
  }, [joining, shown?.kind])

  async function go(event) {
    event.preventDefault()
    setBusy(true)
    setError("")
    try {
      const result = joining ? await joinTable(clean, name) : await createTable(name)
      saveSeat(result.code, result)
      onSeated(result.code)
    } catch (err) {
      const key = err.status === 404 ? "table" : err.message === "offline" || !err.status ? "offline" : err.message
      setError(problem(key))
      if (joining) setTick((n) => n + 1)
      setBusy(false)
    }
  }

  const seated = shown?.data?.members?.map((member) => member.name) ?? []
  const names = seated.length < 2 ? seated[0] : `${seated.slice(0, -1).join(", ")} and ${seated.at(-1)}`
  const ready = name.trim().length > 0 && (!joining || shown?.kind === "ready")

  return (
    <Modal
      kicker={joining ? t("Sit down") : t("Open a table")}
      title={t("House rules")}
      onClose={onCancel}
      actions={
        <>
          <button type="button" className="ghost" onClick={onCancel}>
            {t("Not now")}
          </button>
          <button type="submit" form="seat-form" className="solid" disabled={!ready || busy}>
            {busy ? t("Saving your seat...") : joining ? t("Sit down") : t("Open the table")}
          </button>
        </>
      }
    >
      <form id="seat-form" onSubmit={go}>
        {tableRules.map((line) => (
          <p key={line}>{t(line)}</p>
        ))}
        {joining && fixedCode && (
          <p className="modal-note">
            Table code <strong className="table-code">{clean}</strong>
          </p>
        )}
        {joining && !fixedCode && (
          <label className="field">
            {t("Table code")}
            <input
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              placeholder="pail-well"
            />
          </label>
        )}
        {joining && shown?.kind === "loading" && <p className="modal-note">Looking for that table...</p>}
        {joining && shown?.kind === "ready" && (
          <p className="modal-note">
            {names
              ? `${names} ${shown.data.members.length === 1 ? "is" : "are"} already seated.`
              : "The sheet is still on the table, but the chairs are empty."}
          </p>
        )}
        {joining && shown?.kind === "missing" && (
          <p className="modal-note">
            No table by that code. Ask the host to open one and share a fresh link, or{" "}
            <button type="button" className="text-link" onClick={() => setTick((n) => n + 1)}>
              check again
            </button>
            .
          </p>
        )}
        {joining && shown?.kind === "offline" && (
          <p className="modal-note">
            Cannot reach the table server. Keep this page open. It will retry on its own, or{" "}
            <button type="button" className="text-link" onClick={() => setTick((n) => n + 1)}>
              try now
            </button>
            .
          </p>
        )}
        <label className="field">
          {t("Your name")}
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={16}
            autoComplete="nickname"
            autoFocus={!compact}
            enterKeyHint="go"
            placeholder={t("Letters only")}
          />
        </label>
        {joining && name.trim() && shown?.kind !== "ready" && (
          <p className="modal-note">Sit down unlocks once the table is found.</p>
        )}
        {error && <p className="modal-note">{error}</p>}
      </form>
    </Modal>
  )
}
