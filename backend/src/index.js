import cors from "cors"
import express from "express"
import rateLimit from "express-rate-limit"
import helmet from "helmet"
import { pickDoubt } from "./doubt.js"
import { evaluateHint } from "./hints.js"
import { authorize, broadcast, channelFor } from "./live.js"
import { puzzle } from "./puzzle.js"
import {
  applyOp,
  broadcastBody,
  createRoom,
  joinRoom,
  leave,
  memberFor,
  peek,
  snapshot,
  sweep,
  touch,
} from "./rooms.js"
import { culpritDetails, culpritName, fullSolution, isCellKey, isSolved, suspectNames } from "./solution.js"

const app = express()
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1)
app.disable("x-powered-by")
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }))
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN ?? "http://localhost:5173,http://127.0.0.1:5173").split(","),
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "x-table-token"],
  }),
)
app.use(express.json({ limit: "20kb" }))
app.use(express.urlencoded({ extended: false, limit: "20kb" }))

const limit = (max) =>
  rateLimit({
    windowMs: 60_000,
    limit: max,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "slow" },
  })

const readLimit = limit(120)
const answerLimit = limit(30)
const hintLimit = limit(12)
const openLimit = limit(10)
const opLimit = limit(240)
const authLimit = limit(60)

function keysFrom(value) {
  if (!Array.isArray(value) || value.length > 200) return null
  return [...new Set(value.filter(isCellKey))]
}

function tokenOf(req) {
  const token = req.get("x-table-token")
  return typeof token === "string" ? token : ""
}

function publish(room) {
  if (room) broadcast(room.code, broadcastBody(room))
}

app.get("/api/health", (_req, res) => {
  res.set("Cache-Control", "no-store").json({ ok: true })
})

app.get("/api/puzzle", readLimit, (_req, res) => {
  res.json(puzzle)
})

app.post("/api/hint", hintLimit, (req, res) => {
  const ticks = keysFrom(req.body?.ticks)
  const crosses = keysFrom(req.body?.crosses)
  if (!ticks || !crosses) return res.status(400).json({ error: "bad marks" })
  return res.json(evaluateHint(ticks, crosses))
})

app.post("/api/accuse", answerLimit, (req, res) => {
  const suspect = req.body?.suspect
  const ticks = keysFrom(req.body?.ticks)
  if (!suspectNames.includes(suspect) || !ticks) return res.status(400).json({ error: "bad accusation" })
  if (suspect === culpritName && isSolved(ticks)) {
    return res.json({ correct: true, culprit: culpritDetails(), solution: fullSolution() })
  }
  return res.json({ correct: false, doubt: pickDoubt(ticks) })
})

app.post("/api/check", answerLimit, (req, res) => {
  const ticks = keysFrom(req.body?.ticks)
  if (!ticks) return res.status(400).json({ error: "bad marks" })
  if (isSolved(ticks)) return res.json({ ok: true })
  return res.json({ ok: false, doubt: pickDoubt(ticks) })
})

app.post("/api/rooms", openLimit, (req, res) => {
  const result = createRoom(req.body?.name)
  return res.status(result.status).json(result.view ? { token: result.token, ...result.view } : { error: result.error })
})

app.get("/api/rooms/:code", readLimit, (req, res) => {
  const preview = peek(req.params.code)
  if (!preview) return res.status(404).json({ error: "table" })
  const token = tokenOf(req)
  if (!token) return res.json({ preview: true, ...preview })
  const full = snapshot(token, req.params.code)
  if (!full) return res.status(401).json({ error: "seat" })
  return res.json(full)
})

app.post("/api/rooms/:code/join", openLimit, (req, res) => {
  const result = joinRoom(req.params.code, req.body?.name)
  if (result.room) publish(result.room)
  return res.status(result.status).json(result.view ? { token: result.token, ...result.view } : { error: result.error })
})

app.post("/api/rooms/:code/op", opLimit, (req, res) => {
  const result = applyOp(tokenOf(req), req.params.code, req.body)
  if (result.room) publish(result.room)
  if (!result.view) return res.status(result.status).json({ error: result.error })
  return res.json(result.view)
})

app.post("/api/rooms/:code/ping", limit(30), (req, res) => {
  if (!touch(tokenOf(req), req.params.code)) return res.status(401).json({ error: "seat" })
  return res.json({ ok: true })
})

app.post("/api/rooms/:code/leave", limit(30), (req, res) => {
  publish(leave(tokenOf(req), req.params.code))
  return res.json({ ok: true })
})

app.post("/api/pusher/auth", authLimit, (req, res) => {
  const socketId = req.body?.socket_id
  const channel = req.body?.channel_name
  const code = String(channel ?? "").slice("private-table-".length)
  if (!socketId || channel !== channelFor(code) || !memberFor(req.body?.token, code)) return res.status(403).end()
  const auth = authorize(socketId, channel)
  if (!auth) return res.status(503).end()
  return res.json(auth)
})

app.use((error, req, res, next) => {
  res.status(error.status === 413 ? 413 : 400).json({ error: "bad" })
})

setInterval(() => {
  const { expired, changed } = sweep()
  for (const code of expired) broadcast(code, { rev: 0, gone: true })
  for (const room of changed) publish(room)
}, 5000)

const port = Number(process.env.PORT) || 3001
app.listen(port, () => {
  console.log(`puzzle api on ${port}`)
})
