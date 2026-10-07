import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Footer from "../components/Footer"
import Masthead from "../components/Masthead"
import { LedgerSkeleton } from "../components/Skeletons"
import TableForm from "../components/TableForm"
import { apiUrl } from "../api"
import { groundRule, homeTease, story } from "../content"
import { clock } from "../hooks"
import { clearSave, hasProgress, loadSave } from "../storage"

export default function Home() {
  const [puzzle, setPuzzle] = useState(null)
  const [failed, setFailed] = useState(false)
  const [gate, setGate] = useState(null)
  const [save] = useState(() => (hasProgress() ? loadSave() : null))
  const navigate = useNavigate()

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

  function startFresh() {
    clearSave()
    navigate("/case")
  }

  return (
    <div className="home">
      <Masthead />
      <main className="wrap home-main">
        <section className="lede">
          <p className="file">File CS5002-1</p>
          <h1>Someone wrecked the Grange Display</h1>
          {story.map((paragraph) => (
            <p className="deck" key={paragraph}>
              {paragraph}
            </p>
          ))}
          <p className="ground">{groundRule}</p>
          {save ? (
            <>
              <Link className="enter" to="/case">
                Continue the case
              </Link>
              <p className="resume-note">
                Sheet in this browser · about {clock(Math.floor((save.elapsedMs ?? 0) / 1000))} on the clock
              </p>
              <p className="table-links">
                <button type="button" onClick={startFresh}>
                  Start a fresh sheet
                </button>
                <Link to="/practice">Show me how</Link>
                <button type="button" onClick={() => setGate("create")}>
                  Open a table
                </button>
                <button type="button" onClick={() => setGate("join")}>
                  Join a table
                </button>
              </p>
            </>
          ) : (
            <>
              <Link className="enter" to="/case">
                Take the case
              </Link>
              <p className="table-links">
                <Link to="/practice">Show me how</Link>
                <button type="button" onClick={() => setGate("create")}>
                  Open a table
                </button>
                <button type="button" onClick={() => setGate("join")}>
                  Join a table
                </button>
              </p>
            </>
          )}
          <p className="judges">{homeTease}</p>
          {gate && (
            <TableForm
              mode={gate}
              onCancel={() => setGate(null)}
              onSeated={(code) => navigate(`/case/${code}`)}
            />
          )}
        </section>
        <section className="ledger" aria-label="Evidence index">
          <h2>Evidence index</h2>
          {!puzzle && !failed && <LedgerSkeleton />}
          {failed && <p className="note">The evidence room is locked. Start the backend and refresh.</p>}
          {puzzle && (
            <dl>
              {puzzle.categories.map((category) => (
                <div key={category.id}>
                  <dt>{category.name}</dt>
                  <dd>
                    <ul>
                      {category.values.map((value) => (
                        <li key={value}>{value}</li>
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
  )
}
