import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { apiUrl } from "../api"

const QUICK_MS = 2500
const POLL_MS = 3000
const TYPICAL_SECONDS = 50

let awake = false

const TIPS = [
  "Tip: Start with the clues that name a single suspect. They anchor everything else.",
  "Trick: A tick in one cell means a cross in the rest of its row and column.",
  "Pencil notes are free. Use them for 'maybe' so your ticks stay honest.",
  "Fun fact: the butler is statistically innocent. Statistically.",
  "Tip: When two clues share a suspect, combine them before touching the grid.",
  "Trick: Count what is left. A row with one open cell is a confession.",
  "The server is napping on a free plan. It dreams of cold coffee.",
  "Never trust an alibi that arrives before the question.",
  "Tip: Re-read the clue you skipped. It is always that one.",
  "Trick: Work the most constrained category first. Fewer options, faster wins.",
]

const RIDDLES = [
  {
    q: "Ann, Bo and Cy each own one hat: red, blue, green. Ann hates red. Bo owns blue. Who owns red?",
    options: ["Ann", "Bo", "Cy"],
    answer: 2,
    why: "Bo has blue, Ann cannot have red, so Ann is green and Cy is red.",
  },
  {
    q: "The thief is either in the library or the cellar. The cellar was locked all night. Where was the thief?",
    options: ["Library", "Cellar"],
    answer: 0,
    why: "A locked cellar rules itself out. Eliminate, then conclude.",
  },
  {
    q: "Exactly one of three suspects is guilty and only the guilty one lies. Dot: 'Eli did it.' Eli: 'I did not.' Fay: 'Dot is lying.' Who is guilty?",
    options: ["Dot", "Eli", "Fay"],
    answer: 0,
    why: "If Dot were honest, Eli would be guilty and Eli's 'I did not' would be a lie, which fits too. But then Fay would be lying without being guilty. So Dot lies and is the culprit.",
  },
]

function Practice() {
  const [i, setI] = useState(0)
  const [pick, setPick] = useState(null)
  const r = RIDDLES[i % RIDDLES.length]
  return (
    <div className="gate-quiz">
      <p className="gate-quiz-label">Warm-up while you wait</p>
      <p className="gate-quiz-q">{r.q}</p>
      <div className="gate-quiz-opts">
        {r.options.map((o, n) => (
          <button
            key={o}
            type="button"
            disabled={pick !== null}
            className={pick === null ? "" : n === r.answer ? "right" : n === pick ? "wrong" : ""}
            onClick={() => setPick(n)}
          >
            {o}
          </button>
        ))}
      </div>
      {pick !== null && (
        <p className="gate-quiz-why">
          {pick === r.answer ? "Elementary. " : "Not quite. "}
          {r.why}{" "}
          <button
            type="button"
            className="gate-link"
            onClick={() => {
              setPick(null)
              setI(i + 1)
            }}
          >
            Another riddle
          </button>
        </p>
      )}
    </div>
  )
}

function Waiting() {
  const [seconds, setSeconds] = useState(0)
  const [tip, setTip] = useState(() => Math.floor(Math.random() * TIPS.length))

  useEffect(() => {
    const clock = setInterval(() => setSeconds((s) => s + 1), 1000)
    const tips = setInterval(() => setTip((n) => (n + 1) % TIPS.length), 6000)
    return () => {
      clearInterval(clock)
      clearInterval(tips)
    }
  }, [])

  const left = Math.max(0, TYPICAL_SECONDS - seconds)
  const lines = [
    "Waking the night clerk...",
    "Dusting for fingerprints...",
    "Interrogating the server...",
    "Following a suspicious trail of cold coffee...",
  ]
  const line = lines[Math.floor(seconds / 5) % lines.length]

  return (
    <main className="gate" aria-busy="true" role="status">
      <div className="gate-stage" aria-hidden="true">
        <div className="gate-lens">
          <span className="gate-glass" />
          <span className="gate-handle" />
          <span className="gate-print" />
        </div>
        <div className="gate-steps">
          <span>👣</span>
          <span>👣</span>
          <span>👣</span>
        </div>
      </div>
      <h1 className="gate-title">The case file is still in the cabinet</h1>
      <p className="gate-line">{line}</p>
      <p className="gate-note">
        Our free server sleeps when nobody visits. Waking it usually takes about {TYPICAL_SECONDS} seconds
        {left > 0 ? ` (roughly ${left}s to go)` : ", so any moment now"}. You have waited {seconds}s.
        This page will open the case on its own.
      </p>
      <Practice />
      <div className="gate-ribbon" aria-live="off">
        <span key={tip}>{TIPS[tip]}</span>
      </div>
      <p className="gate-foot">
        <Link to="/">Back to the office</Link>
      </p>
    </main>
  )
}

export default function BackendGate({ children }) {
  const [ready, setReady] = useState(awake)
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (awake) return undefined
    let alive = true
    let timer
    const quick = setTimeout(() => alive && setSlow(true), QUICK_MS)

    const ping = async () => {
      const ctl = new AbortController()
      const abort = setTimeout(() => ctl.abort(), 8000)
      try {
        const res = await fetch(apiUrl("/api/health"), { cache: "no-store", signal: ctl.signal })
        if (res.status === 200) {
          awake = true
          if (alive) setReady(true)
          return
        }
      } catch {
        // still asleep
      } finally {
        clearTimeout(abort)
      }
      if (alive) {
        setSlow(true)
        timer = setTimeout(ping, POLL_MS)
      }
    }
    ping()

    return () => {
      alive = false
      clearTimeout(quick)
      clearTimeout(timer)
    }
  }, [])

  if (ready) return children
  return slow ? <Waiting /> : null
}
