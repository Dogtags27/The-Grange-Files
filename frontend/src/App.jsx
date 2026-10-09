import { Analytics } from "@vercel/analytics/react"
import { useEffect } from "react"
import { matchPath, Route, Routes, useLocation } from "react-router-dom"
import { duckIntroBed, liftIntroBed } from "./introBed"
import { warmSfx } from "./sfx"
import BackendGate from "./components/BackendGate"
import Case from "./pages/Case"
import Home from "./pages/Home"
import Legal from "./pages/Legal"
import Practice from "./pages/Practice"
import TablePlay from "./pages/TablePlay"

const analyticsRoutes = ["/", "/practice", "/case/:code", "/case", "/credits", "/terms", "/privacy"]

function PageAnalytics() {
  const { pathname } = useLocation()
  const route = analyticsRoutes.find((pattern) => matchPath({ path: pattern, end: true }, pathname)) ?? pathname
  return <Analytics route={route} path={pathname} />
}

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
    <>
      <PageAnalytics />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/case/:code" element={<BackendGate><TablePlay /></BackendGate>} />
        <Route path="/case" element={<BackendGate><Case /></BackendGate>} />
        <Route path="/credits" element={<Legal kind="credits" />} />
        <Route path="/terms" element={<Legal kind="terms" />} />
        <Route path="/privacy" element={<Legal kind="privacy" />} />
      </Routes>
    </>
  )
}
