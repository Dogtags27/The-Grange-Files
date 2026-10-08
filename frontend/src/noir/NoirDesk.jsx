import { Component, lazy, Suspense } from "react"
import { canUse3d } from "./support"

const DeskStage = lazy(() => import("./DeskStage"))

class Guard extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export default function NoirDesk({ className = "", label, fallback = null, children, ...stage }) {
  if (!canUse3d()) return fallback
  return (
    <Guard fallback={fallback}>
      <div className={`desk-stage ${className}`}>
        <div
          className="desk-art"
          role={children ? undefined : "img"}
          aria-label={children ? undefined : label}
          aria-hidden={children ? true : undefined}
        >
          <Suspense fallback={<p className="desk-wait">Switching the lamp on...</p>}>
            <DeskStage {...stage} />
          </Suspense>
        </div>
        {children}
      </div>
    </Guard>
  )
}
