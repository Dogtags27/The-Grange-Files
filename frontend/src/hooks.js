import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { pickOne } from "./api"
import { nudge } from "./content"
import { translate, translateTerm, useI18n } from "./i18n.jsx"
import { splitClue } from "./logic"

export const NUDGE_EVERY_MS = 10 * 60 * 1000
export const NUDGE_VISIBLE_MS = 30 * 1000

export function useNudge({ startedAt, active, quiet, onShow }) {
  const [line, setLine] = useState(null)
  const quietRef = useRef(quiet)
  const showRef = useRef(onShow)

  useEffect(() => {
    quietRef.current = quiet
    showRef.current = onShow
  })

  useEffect(() => {
    if (!active) return undefined
    let round = 1
    let id
    const arm = () => {
      id = setTimeout(
        () => {
          if (!quietRef.current) {
            setLine(pickOne(nudge.lines))
            showRef.current?.()
          }
          round += 1
          arm()
        },
        Math.max(0, round * NUDGE_EVERY_MS - (Date.now() - startedAt)),
      )
    }
    arm()
    return () => clearTimeout(id)
  }, [active, startedAt])

  useEffect(() => {
    if (!line) return undefined
    const id = setTimeout(() => setLine(null), NUDGE_VISIBLE_MS)
    return () => clearTimeout(id)
  }, [line])

  return [line, () => setLine(null)]
}

export function useNow(step = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), step)
    return () => clearInterval(id)
  }, [step])
  return now
}

function useMedia(query) {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query)
      list.addEventListener("change", notify)
      return () => list.removeEventListener("change", notify)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export function useParsedClues(clues, values) {
  const { lang } = useI18n()
  return useMemo(
    () =>
      clues.map((clue) =>
        splitClue(translate(clue), values, (value) => translateTerm(value).replace(/\.$/, "")),
      ),
    [clues, values, lang],
  )
}

export const useCompact = () => useMedia("(max-width: 700px), (max-height: 500px) and (pointer: coarse)")

const pad = (n) => String(n).padStart(2, "0")

export function clock(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
