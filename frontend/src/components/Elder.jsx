import { fill, pickOne, plural } from "../api"
import { elder } from "../content"
import { useI18n } from "../i18n.jsx"
import Modal from "./Modal"

export function ElderConfirm({ onCancel, onConfirm }) {
  const { t } = useI18n()
  return (
    <Modal
      kicker={t("The town elder")}
      title={t(elder.confirmTitle)}
      onClose={onCancel}
      actions={
        <>
          <button type="button" className="ghost" onClick={onCancel}>
            {t("Keep thinking")}
          </button>
          <button type="button" className="solid" onClick={onConfirm} autoFocus>
            {t("Pay the time and ask")}
          </button>
        </>
      }
    >
      <p>{elder.confirmIntro}</p>
      <dl className="fees">
        {elder.fees.map(([label, cost]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{cost}</dd>
          </div>
        ))}
      </dl>
      <p className="modal-note">{elder.confirmNote}</p>
    </Modal>
  )
}

function summary(result) {
  const parts = []
  if (result.wrongTicks.length) parts.push(plural(result.wrongTicks.length, "wrong tick"))
  if (result.wrongCrosses.length) parts.push(plural(result.wrongCrosses.length, "wrong cross"))
  return parts.join(" and ")
}

export function ElderResult({ ui, onClose }) {
  if (ui.mode === "loading") {
    return (
      <Modal kicker="The town elder" title="The Elder is thinking">
        <p>He is looking at your sheet. This takes as long as it takes.</p>
      </Modal>
    )
  }

  if (ui.mode === "error") {
    return (
      <Modal
        kicker="The town elder"
        title="Nobody home"
        onClose={onClose}
        actions={
          <button type="button" className="solid" onClick={onClose} autoFocus>
            Close
          </button>
        }
      >
        <p>{elder.errorText}</p>
      </Modal>
    )
  }

  const { result, seed } = ui
  const fee = result.penalty > 0 ? `+${result.penalty} min added to your time.` : "No charge."

  if (result.kind === "cleanup") {
    return (
      <Modal
        kicker="The town elder"
        title="A little tidying"
        onClose={onClose}
        actions={
          <button type="button" className="solid" onClick={onClose} autoFocus>
            Back to the grid
          </button>
        }
      >
        <p>{fill(pickOne(elder.cleanLines, seed), { summary: summary(result) })}</p>
        <p className="modal-note">{elder.cleanAfter}</p>
        <p className="fee">{fee}</p>
      </Modal>
    )
  }

  if (result.kind === "step") {
    return (
      <Modal
        kicker={`Elder advice, move ${result.number} of ${result.total}`}
        title={result.title}
        onClose={onClose}
        actions={
          <button type="button" className="solid" onClick={onClose} autoFocus>
            Got it
          </button>
        }
      >
        <p className="elder-lead">{pickOne(elder.stepLeads, seed)}</p>
        <p>{result.text}</p>
        <p className="modal-note">The tick is placed for you and outlined on the grid.</p>
        <p className="fee">{fee}</p>
      </Modal>
    )
  }

  return (
    <Modal
      kicker="The town elder"
      title="Nothing left to say"
      onClose={onClose}
      actions={
        <button type="button" className="solid" onClick={onClose} autoFocus>
          Back to the grid
        </button>
      }
    >
      <p>{pickOne(elder.completeLines, seed)}</p>
      <p className="fee">{fee}</p>
    </Modal>
  )
}
