export function LedgerSkeleton() {
  return (
    <div className="skel-ledger" aria-hidden="true">
      {[0, 1, 2, 3].map((row) => (
        <div key={row}>
          <span className="skel line short" />
          <span className="skel line" />
        </div>
      ))}
    </div>
  )
}

export function CaseSkeleton() {
  return (
    <div className="workspace" aria-busy="true" aria-label="Loading the case">
      <div className="sheet-scroll">
        <div className="skel-sheet">
          {[0, 1, 2, 3, 4, 5].map((block) => (
            <span key={block} className="skel block-skel" />
          ))}
        </div>
      </div>
      <aside className="clues">
        <div className="clues-head">
          <span className="skel line short" />
        </div>
        <div className="clue-scroll">
          {[0, 1, 2, 3, 4, 5, 6].map((row) => (
            <span key={row} className="skel line tall" />
          ))}
        </div>
      </aside>
    </div>
  )
}
