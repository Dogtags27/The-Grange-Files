import { Link } from "react-router-dom"

export default function Footer() {
  return (
    <footer className="foot">
      <p>Built by friends in MSCS Align. Not an official Northeastern project. Nothing is saved.</p>
      <nav aria-label="Legal">
        <Link to="/terms">Terms</Link>
        <Link to="/privacy">Privacy</Link>
      </nav>
    </footer>
  )
}
