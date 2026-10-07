import { Link } from "react-router-dom"

export default function Footer() {
  return (
    <footer className="foot">
      <p>Built by friends in MSCS Align. Not an official Northeastern project. Solo sheets stay in this browser only.</p>
      <nav aria-label="Legal">
        <Link to="/terms">Terms</Link>
        <Link to="/privacy">Privacy</Link>
      </nav>
    </footer>
  )
}
