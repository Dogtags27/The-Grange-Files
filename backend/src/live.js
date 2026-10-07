import Pusher from "pusher"

let client = null

export function pusher() {
  if (!process.env.PUSHER_SECRET || !process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY) return null
  if (!client) {
    client = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER || "us2",
      useTLS: true,
    })
  }
  return client
}

export function channelFor(code) {
  return `private-table-${code}`
}

export function authorize(socketId, channel) {
  return pusher()?.authorizeChannel(socketId, channel) ?? null
}

export function broadcast(code, payload) {
  const live = pusher()
  if (!live) return
  const body = JSON.stringify(payload).length > 9000 ? { rev: payload.rev, refetch: true } : payload
  live.trigger(channelFor(code), "state", body).catch(() => {})
}
