import { useEffect } from "react"
import { Route, Routes, useLocation } from "react-router-dom"
import { duckIntroBed, liftIntroBed } from "./introBed"
import { warmSfx } from "./sfx"
import Case from "./pages/Case"
import Home from "./pages/Home"
import Legal from "./pages/Legal"
import Practice from "./pages/Practice"
import TablePlay from "./pages/TablePlay"

export default function App() {
  const { pathname } = useLocation()

  useEffect(() => {
    const solving = pathname === "/practice" || pathname === "/case" || pathname.startsWith("/case/")
    if (solving) {
      duckIntroBed()
      warmSfx()
    } else {
      liftIntroBed()
    }
  }, [pathname])

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/practice" element={<Practice />} />
      <Route path="/case/:code" element={<TablePlay />} />
      <Route path="/case" element={<Case />} />
      <Route path="/credits" element={<Legal kind="credits" />} />
      <Route path="/terms" element={<Legal kind="terms" />} />
      <Route path="/privacy" element={<Legal kind="privacy" />} />
    </Routes>
  )
}
