import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { pickOne } from "../api"
import { finaleLines } from "../content"
import { clock } from "../hooks"
import { copyText, downloadHtml, rankFor, reportDocument, textReport } from "../report"
import Figure from "./Figure"

export default function Celebration({ result, puzzle, cells, seconds, penalty, stats, log, onClose }) {
  const [finale] = useState(() => pickOne(finaleLines))
  const [copied, setCopied] = useState(null)
  const scene = useRef(null)
  const { culprit, solution } = result
  const rank = rankFor(stats)
  const data = { puzzle, result, cells, seconds, penalty, stats, log }

  async function copy() {
    setCopied((await copyText(textReport(data))) ? "yes" : "no")
    setTimeout(() => setCopied(null), 3500)
  }

  useEffect(() => {
    scene.current?.scrollTo(0, 0)
  }, [])

  return (
    <div ref={scene} className="scene solved" role="dialog" aria-modal="true" aria-label="Case closed">
      <div className="scene-inner">
        <p className="file">File CS5002-1</p>
        <h2>{culprit.suspect} did it.</h2>
        <p className="rank">Rank earned: {rank.title}</p>
        <div className="parade">
          {solution.map((row) => (
            <div key={row.suspect} className={row.suspect === culprit.suspect ? "fig front" : "fig back"}>
              <Figure name={row.suspect} size={150} />
              <p>{row.suspect}</p>
            </div>
          ))}
        </div>
        <p className="stamp">Case closed</p>
        <div className="finale">
          <p className="confession">
            {culprit.suspect} was at the {culprit.location}, holding the {culprit.item}, and
            insisted: "{culprit.alibi}"
          </p>
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Suspect</th>
                <th>Location</th>
                <th>Item</th>
                <th>Alibi</th>
              </tr>
            </thead>
            <tbody>
              {solution.map((row) => (
                <tr key={row.suspect} className={row.suspect === culprit.suspect ? "culprit" : undefined}>
                  <td>{row.suspect}</td>
                  <td>{row.location}</td>
                  <td>{row.item}</td>
                  <td>{row.alibi}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="stats">
            <div>
              <dt>Time on the case</dt>
              <dd>{clock(seconds)}</dd>
            </div>
            <div>
              <dt>Visits to the Elder</dt>
              <dd>{stats.elder}</dd>
            </div>
            <div>
              <dt>Wrong accusations</dt>
              <dd>{stats.wrong}</dd>
            </div>
          </dl>
          <p className="mayor-line">{finale}</p>
          <p className="rank-joke">{rank.joke}</p>
          <div className="scene-actions">
            <button type="button" className="solid" onClick={copy}>
              Copy the report
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => downloadHtml("grange-case-file.html", reportDocument(data))}
            >
              Download the full case file
            </button>
            <button type="button" className="ghost" onClick={onClose}>
              Look at my grid
            </button>
            <Link className="ghost" to="/">
              Back to the case file
            </Link>
          </div>
          <p className="copy-note" role="status">
            {copied === "yes" && "Copied. Paste it somewhere smug."}
            {copied === "no" && "Your browser blocked copying. The full case file download still works."}
          </p>
        </div>
      </div>
    </div>
  )
}
