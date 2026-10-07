import { Route, Routes } from "react-router-dom"
import Case from "./pages/Case"
import Home from "./pages/Home"
import Legal from "./pages/Legal"
import Practice from "./pages/Practice"
import TablePlay from "./pages/TablePlay"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/practice" element={<Practice />} />
      <Route path="/case/:code" element={<TablePlay />} />
      <Route path="/case" element={<Case />} />
      <Route path="/terms" element={<Legal kind="terms" />} />
      <Route path="/privacy" element={<Legal kind="privacy" />} />
    </Routes>
  )
}
