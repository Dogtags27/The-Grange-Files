const KEY = "cs5002-grange-save-v1"

export function loadSave() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY))
    if (!data || typeof data.cells !== "object" || typeof data.elapsedMs !== "number") return null
    return data
  } catch {
    return null
  }
}

export function writeSave(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    return
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    return
  }
}
