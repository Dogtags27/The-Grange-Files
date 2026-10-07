import { useEffect, useRef } from "react"

const DRAG_CLOSE = 90

export default function Sheet({ title, onClose, tall, children }) {
  const panel = useRef(null)
  const drag = useRef(null)

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose()
    }
    const before = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    panel.current?.focus()
    return () => {
      document.body.style.overflow = before
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  function down(event) {
    drag.current = event.touches[0].clientY
  }

  function move(event) {
    if (drag.current === null || !panel.current) return
    const dy = Math.max(0, event.touches[0].clientY - drag.current)
    panel.current.style.transform = `translateY(${dy}px)`
    panel.current.style.transition = "none"
  }

  function up(event) {
    if (drag.current === null || !panel.current) return
    const dy = event.changedTouches[0].clientY - drag.current
    drag.current = null
    panel.current.style.transition = ""
    panel.current.style.transform = ""
    if (dy > DRAG_CLOSE) onClose()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        ref={panel}
        className={tall ? "drawer tall" : "drawer"}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="drawer-grip" onTouchStart={down} onTouchMove={move} onTouchEnd={up} onTouchCancel={up}>
          <i aria-hidden="true" />
          <div className="drawer-head">
            <h2>{title}</h2>
            <button type="button" className="ghost small" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </div>
  )
}
