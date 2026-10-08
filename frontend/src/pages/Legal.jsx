import { Link } from "react-router-dom"
import Footer from "../components/Footer"
import Masthead from "../components/Masthead"
import { legal } from "../content"
import { useI18n } from "../i18n.jsx"

export default function Legal({ kind }) {
  const { t } = useI18n()
  const page = legal[kind]
  return (
    <div className="home">
      <Masthead />
      <main className="wrap legal">
        <p className="file">{t("Fine print")}</p>
        <h1>{t(page.title)}</h1>
        <ol>
          {page.items.map((item) => (
            <li key={item}>{t(item)}</li>
          ))}
        </ol>
        <Link className="back" to="/">
          {t("Back to the case file")}
        </Link>
      </main>
      <Footer />
    </div>
  )
}
