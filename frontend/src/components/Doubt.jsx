export default function Doubt({ lead, question, onClear, onKeep }) {
  return (
    <div className="doubt" role="alertdialog" aria-label="Mayor Lewis has a question">
      <p className="doubt-kicker">Mayor Lewis taps one of your ticks</p>
      {lead && <p className="doubt-lead">{lead}</p>}
      <p className="doubt-question">{question}</p>
      <div className="doubt-actions">
        <button type="button" className="solid" onClick={onClear}>
          Clear that tick
        </button>
        <button type="button" className="ghost" onClick={onKeep}>
          I stand by it
        </button>
      </div>
    </div>
  )
}
