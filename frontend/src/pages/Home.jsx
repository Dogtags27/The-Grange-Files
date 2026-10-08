import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Footer from "../components/Footer"
import Masthead from "../components/Masthead"
import { suspectNames } from "../components/portraits"
import NoirDesk from "../noir/NoirDesk"
import { canUse3d, prefersStill } from "../noir/support"
import { LedgerSkeleton } from "../components/Skeletons"
import TableForm from "../components/TableForm"
import { apiUrl } from "../api"
import { groundRule, homeTease, story } from "../content"
import { clock } from "../hooks"
import { useI18n } from "../i18n.jsx"
import { introBed } from "../introBed"
import { clearSave, hasProgress, loadSave } from "../storage"

const SEEN = "grange-intro-seen"
const ROOM_WAIT_MS = 60 * 1000
const DESK_MS = 10500
const SETTLE_MS = 2200

function skipIntro() {
  try {
    return !canUse3d() || prefersStill() || sessionStorage.getItem(SEEN) === "1"
  } catch {
    return true
  }
}

function bannerHeight(vh) {
  return vh < 640 || window.innerWidth >= 640 ? Math.min(380, Math.max(220, Math.round(vh * 0.36))) : Math.min(400, Math.max(300, Math.round(vh * 0.42)))
}

export default function Home() {
  const [phase, setPhase] = useState(() => (skipIntro() ? "done" : "room"))
  const [begun, setBegun] = useState(false)
  const [vh, setVh] = useState(() => window.innerHeight)
  const [puzzle, setPuzzle] = useState(null)
  const [failed, setFailed] = useState(false)
  const [gate, setGate] = useState(null)
  const [save] = useState(() => (hasProgress() ? loadSave() : null))
  const navigate = useNavigate()
  const { t, term } = useI18n()

  function begin() {
    const bed = introBed()
    if (phase === "room") bed.enterRoom()
    else if (phase === "desk") bed.approach()
    else bed.hold()
    setBegun(true)
  }

  function stepUp() {
    introBed().approach()
    setPhase("desk")
  }

  function skipToSettle() {
    introBed().hold()
    setPhase("settle")
  }

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
        if (alive) setFailed(true)
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  useEffect(() => {
    if (!begun) return
    const bed = introBed()
    if (phase === "room") bed.enterRoom()
    else if (phase === "desk") bed.approach()
    else bed.hold()
  }, [phase, begun])

  useEffect(() => {
    if (!begun) return undefined
    const next = { room: ["desk", ROOM_WAIT_MS], desk: ["settle", DESK_MS], settle: ["done", SETTLE_MS] }[phase]
    if (!next) return undefined
    if (phase === "room") markSeen()
    const id = setTimeout(() => setPhase(next[0]), next[1])
    return () => clearTimeout(id)
  }, [phase, begun])

  function markSeen() {
    try {
      sessionStorage.setItem(SEEN, "1")
    } catch {
      return
    }
  }

  function startFresh() {
    clearSave()
    navigate("/case")
  }

    return (
    <div className={phase === "done" ? "home" : phase === "settle" ? "home intro" : "home intro hold"}>
      {!begun && (
        <div className="begin-frost" role="dialog" aria-modal="true" aria-labelledby="begin-title">
          <div className="begin-card">
            <p id="begin-title" className="intro-title">{t("The Grange Files")}</p>
            <p className="intro-sub">{t("File CS5002-1. One lamp is still on.")}</p>
            <button type="button" className="solid" onClick={begin} autoFocus>
              {t("Begin")}
            </button>
          </div>
        </div>
      )}
      <div className="home-live" inert={begun ? undefined : true}>
      <div className={phase === "room" || phase === "desk" ? "mast-wrap folded" : "mast-wrap"}>
        <div>
          <Masthead />
        </div>
      </div>
      <div
        className="home-stage"
        style={{ height: phase === "room" || phase === "desk" ? vh : bannerHeight(vh) }}
      >
        <NoirDesk
          className="home-desk"
          suspects={suspectNames}
          view={phase === "room" ? "room" : phase === "desk" ? "desk" : "banner"}
          room
          mood={phase === "room" ? "room" : "idle"}
          sweep={phase === "room" ? null : phase === "desk" ? "fast" : "slow"}
          sway
          onEnter={phase === "room" ? stepUp : undefined}
          label="A dim detective office with a lit desk and five mugshot cards while a lamp light drifts across them"
        />
        {phase === "room" && (
          <div className="intro-ui">
            <div aria-hidden="true">
              <p className="intro-title">{t("The Grange Files")}</p>
              <p className="intro-sub">{t("File CS5002-1. One lamp is still on.")}</p>
            </div>
            <div className="intro-actions">
              <button type="button" className="solid" onClick={stepUp}>
                {t("Step up to the desk")}
              </button>
              <button type="button" className="intro-skip" onClick={skipToSettle}>
                {t("Skip")}
              </button>
            </div>
          </div>
        )}
        {phase === "desk" && (
          <p className="intro-caption" aria-hidden="true">
            {t("Five names. One of them did it.")}
          </p>
        )}
      </div>
      <div className="home-body">
      <main className="wrap home-main">
        <section className="lede">
          <p className="file">{t("File CS5002-1")}</p>
          <h1>{t("Someone wrecked the Grange Display")}</h1>
          {story.map((paragraph) => (
            <p className="deck" key={paragraph}>
              {t(paragraph)}
            </p>
          ))}
          <p className="ground">{t(groundRule)}</p>
          {save ? (
            <>
              <Link className="enter" to="/case">
                {t("Continue the case")}
              </Link>
              <p className="resume-note">
                {t("Sheet in this browser · about {time} on the clock", {
                  time: clock(Math.floor((save.elapsedMs ?? 0) / 1000)),
                })}
              </p>
              <p className="table-links">
                <button type="button" onClick={startFresh}>
                  {t("Start a fresh sheet")}
                </button>
                <Link to="/practice">{t("Show me how")}</Link>
                <button type="button" onClick={() => setGate("create")}>
                  {t("Open a table")}
                </button>
                <button type="button" onClick={() => setGate("join")}>
                  {t("Join a table")}
                </button>
              </p>
            </>
          ) : (
            <>
              <Link className="enter" to="/case">
                {t("Take the case")}
              </Link>
              <p className="table-links">
                <Link to="/practice">{t("Show me how")}</Link>
                <button type="button" onClick={() => setGate("create")}>
                  {t("Open a table")}
                </button>
                <button type="button" onClick={() => setGate("join")}>
                  {t("Join a table")}
                </button>
              </p>
            </>
          )}
          <p className="judges">{t(homeTease)}</p>
          {gate && (
            <TableForm
              mode={gate}
              onCancel={() => setGate(null)}
              onSeated={(code) => navigate(`/case/${code}`)}
            />
          )}
        </section>
        <section className="ledger" aria-label={t("Evidence index")}>
          <h2>{t("Evidence index")}</h2>
          {!puzzle && !failed && <LedgerSkeleton />}
          {failed && <p className="note">{t("The evidence room is locked. Start the backend and refresh.")}</p>}
          {puzzle && (
            <dl>
              {puzzle.categories.map((category) => (
                <div key={category.id}>
                  <dt>{term(category.name)}</dt>
                  <dd>
                    <ul>
                      {category.values.map((value) => (
                        <li key={value}>{term(value)}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      </main>
      <Footer />
      </div>
      </div>
    </div>
  )
}
