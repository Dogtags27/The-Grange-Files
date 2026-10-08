import { Link } from "react-router-dom"
import { useI18n } from "../i18n.jsx"

export default function Footer() {
  const { t } = useI18n()
  return (
    <footer className="foot">
      <p>{t("A personal project for MSCS Align, CS5002. Solo sheets stay in this browser only.")}</p>
      <nav aria-label="Legal">
        <Link to="/credits">{t("Credits")}</Link>
        <Link to="/terms">{t("Terms")}</Link>
        <Link to="/privacy">{t("Privacy")}</Link>
      </nav>
    </footer>
  )
}
