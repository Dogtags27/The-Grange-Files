const origin = (import.meta.env.VITE_API_ORIGIN ?? "").replace(/\/$/, "")

export const apiUrl = (path) => `${origin}${path}`

export async function postJson(path, body) {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`request failed: ${res.status}`)
  return res.json()
}

export const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`

export const fill = (text, values) =>
  Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, value), text)

export const pickOne = (list, seed = Math.random()) => list[Math.floor(seed * list.length) % list.length]
