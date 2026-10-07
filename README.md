<p align="center">
  <img src="docs/banner.svg" alt="The Grange Files — File CS5002-1" width="920" />
</p>

<p align="center">
  <a href="https://the-grange-files.vercel.app"><strong>Open the case</strong></a>
  &nbsp;·&nbsp;
  <a href="https://the-grange-files.vercel.app/practice">Show me how</a>
</p>

---

Mayor Lewis called a meeting. Someone sabotaged the Grange Display the night before the Fall Fair. You get a logic sheet, fourteen clues, and an Elder who sells advice by the minute. The badge at the end is a bottle cap.

This is a Puzzle Baron–style logic grid dressed as a Stardew Valley case file. Built by friends in Northeastern’s MSCS Align for **CS5002**. Not run, endorsed, or reviewed by the university. Pierre hung a sign saying “Detective approved” anyway.

<p align="center">
  <img src="docs/mark.svg" alt="" width="48" />
</p>

## How you play

Cross cells you know are wrong. Tick the one match in each row and column. The six squares on the sheet are the usual tangle:

```
              Suspects   Locations   Items
Alibis           ■           ■         ■
Items            ■           ■
Locations        ■
```

Solo works offline in the browser once the puzzle loads. Open a table if you want classmates on the same sheet — marks sync live, activity scrolls along the bottom, and quiet seats get a polite shove.

Phones get a focus mode: one square at a time, swipe between them, hold a cell to pencil a maybe.

Only use the clues. Outside Stardew lore will not help you. The shoes are not talking.

## Run it locally

Needs **Node 20+**. Two terminals.

```bash
# terminal 1
cd backend
cp .env.example .env   # or make one — see below
npm install
npm run dev
```

```bash
# terminal 2
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` to the backend on `3001`.

### Backend env

Put this in `backend/.env` (git-ignored — keep it that way):

```env
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
PUSHER_CLUSTER=us2
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

Without Pusher, solo play still works. Shared tables need it.

### Useful commands

| Where | Command | What |
| --- | --- | --- |
| `backend/` | `npm test` | Rooms, layout, solution |
| `frontend/` | `npm test` | Sheet click logic |
| `frontend/` | `npm run lint` | oxlint |
| `frontend/` | `npm run build` | Production bundle |

CI runs those on every PR. `main` will not merge red.

## What’s in the box

```
backend/     Express API, in-memory tables, Pusher auth
frontend/    Vite + React, solo case, tables, practice, mobile focus mode
docs/        Pictures for this readme, nothing fancy
```

Tables live in memory. Empty ones expire in fifteen minutes. A Render free-tier nap wipes them too — that is expected, not a mystery for the Elder.

## Hosting

Already wired for:

- **Frontend** → Vercel (`frontend/`, set `VITE_API_ORIGIN` to the API URL)
- **Backend** → Render (`backend/`, set Pusher + `TRUST_PROXY=1` + `CORS_ORIGIN` to the Vercel URL)

Deploy backend first, then frontend, then fix CORS to the real site origin.

## Credits & small print

Stardew Valley belongs to ConcernedApe. This is a class fan project, not a commercial thing, not affiliated with Chucklefish or anyone with a real legal department.

Built for classmates. If the evidence room is locked, start the backend and refresh.
