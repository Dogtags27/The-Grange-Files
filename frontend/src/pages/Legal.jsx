import { Link } from "react-router-dom"
import Footer from "../components/Footer"
import Masthead from "../components/Masthead"
import { legal } from "../content"

export default function Legal({ kind }) {
  const page = legal[kind]
  return (
    <div className="home">
      <Masthead />
      <main className="wrap legal">
        <p className="file">Fine print</p>
        <h1>{page.title}</h1>
        <ol>
          {page.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
        <Link className="back" to="/">
          Back to the case file
        </Link>
      </main>
      <Footer />
    </div>
  )
}
