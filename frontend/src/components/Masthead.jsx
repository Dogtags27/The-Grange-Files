import { Link } from "react-router-dom"

export default function Masthead() {
  return (
    <header className="mast">
      <div className="wrap">
        <Link to="/" className="mast-link">
          <span className="kicker">Northeastern University</span>
          <span className="course">MSCS Align, CS5002</span>
        </Link>
      </div>
    </header>
  )
}
