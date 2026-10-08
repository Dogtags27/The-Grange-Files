import "@fontsource-variable/fraunces/opsz.css"
import "@fontsource/atkinson-hyperlegible/400.css"
import "@fontsource/atkinson-hyperlegible/700.css"
import "@fontsource/noto-sans/cyrillic-400.css"
import "@fontsource/noto-sans/cyrillic-700.css"
import "@fontsource/noto-serif/cyrillic-400.css"
import "@fontsource/noto-serif/cyrillic-700.css"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App.jsx"
import { LocaleProvider } from "./i18n.jsx"
import "./index.css"
import "./mobile.css"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <LocaleProvider>
        <App />
      </LocaleProvider>
    </BrowserRouter>
  </StrictMode>,
)
