import { apiUrl } from "./api"

const keyFor = (code) => `grange-seat:${code}`

export function loadSeat(code) {
  try {
    const data = JSON.parse(sessionStorage.getItem(keyFor(code)) ?? "null")
    if (!data?.token) return null
    return data
  } catch {
    return null
  }
}

export function saveSeat(code, data) {
  sessionStorage.setItem(keyFor(code), JSON.stringify({ token: data.token, id: data.me }))
}

export function clearSeat(code) {
  sessionStorage.removeItem(keyFor(code))
}

export function unpackCells(packed) {
  const cells = {}
  for (const [key, value] of Object.entries(packed ?? {})) cells[key] = { mark: value ? "yes" : "no" }
  return cells
}

export function noteInk(notes, members) {
  const colors = Object.fromEntries((members ?? []).map((member) => [member.id, member.color]))
  const ink = {}
  for (const [key, id] of Object.entries(notes ?? {})) ink[key] = colors[id] ?? "#6b5d4e"
  return ink
}

async function call(path, { method = "GET", token, body } = {}) {
  const res = await fetch(apiUrl(path), {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { "x-table-token": token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const error = new Error(data.error || "request")
    error.status = res.status
    throw error
  }
  return data
}

export const previewTable = (code) => call(`/api/rooms/${encodeURIComponent(code)}`)
export const createTable = (name) => call("/api/rooms", { method: "POST", body: { name } })
export const joinTable = (code, name) => call(`/api/rooms/${encodeURIComponent(code)}/join`, { method: "POST", body: { name } })
export const loadTable = (code, token) => call(`/api/rooms/${encodeURIComponent(code)}`, { token })
export const act = (code, token, body) => call(`/api/rooms/${encodeURIComponent(code)}/op`, { method: "POST", token, body })
export const pingTable = (code, token) => call(`/api/rooms/${encodeURIComponent(code)}/ping`, { method: "POST", token, body: {} })
export const leaveTable = (code, token) => call(`/api/rooms/${encodeURIComponent(code)}/leave`, { method: "POST", token, body: {} })
