export function buildBands(columns, rows) {
  const seen = new Set()
  return rows.map((row) => {
    const grids = []
    columns.forEach((col, colIndex) => {
      if (row.id === col.id) return
      const key = [row.id, col.id].sort().join("|")
      if (seen.has(key)) return
      seen.add(key)
      grids.push({
        id: `${row.id}__${col.id}`,
        colIndex,
        colName: col.name,
        colValues: col.values,
        rowValues: row.values,
      })
    })
    return {
      row: { id: row.id, name: row.name, values: row.values },
      grids,
    }
  })
}
