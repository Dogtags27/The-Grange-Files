import { Link } from "react-router-dom"
import { useI18n } from "../i18n.jsx"
import LangSelect from "./LangSelect"

export default function Masthead() {
  const { t } = useI18n()
  return (
    <header className="mast">
      <div className="wrap mast-row">
        <Link to="/" className="mast-link">
          <span className="kicker">{t("Puzzle Challenge")}</span>
          <span className="course">MSCS Align, CS5002</span>
        </Link>
        <LangSelect />
      </div>
    </header>
  )
}
