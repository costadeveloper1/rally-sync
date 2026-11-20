# Task Plan: Rally Sync Discord Activity

**Status:** COMPLETED ✅  
**Root:** `g:\Bruno\Programacao\Projetos\bot_discord\rally_sync`

---

## Decisions & Clarifications
- **Coordinator Auth:** Hybrid (Discord permission `Manage Messages` / Admin OR configured role e.g. `@Líder de Rally`).
- **March Durations:** Allow marches longer than the rally duration (e.g. 6 min march in 5 min rally); math handles relative launch offsets cleanly.
- **Storage:** In-memory on Node.js backend per `channelId` (fast, zero config, resets on channel clear).

---

## Tasks

- [x] **Task 1: Workspace Scaffolding & Dependencies**
  - Setup root `package.json` scripts, `server/` (Express + Socket.io + TypeScript) and `client/` (Vite + React + Tailwind + Discord SDK).
  - *Verified:* `npm install` succeeded cleanly with workspaces configured.

- [x] **Task 2: Backend Core & Discord Token Proxy**
  - Implemented Express server with `/api/token` OAuth exchange, `.env` loading, and static file serving for client build.
  - *Verified:* Express starts, `/api/health` and `/api/token` implemented with fallback for dev testing.

- [x] **Task 3: Realtime Room Engine & UTC Calculation**
  - Implemented in-memory room manager keyed by `channelId`, Socket.io handlers (`room:join`, `player:upsert`, `player:remove`, `rally:start`, `rally:reset`, `list:clear`), time sync ping-pong, and the exact UTC math.
  - *Verified:* Unit test in `rallyEngine.test.ts` verified exact scenario from functional spec (Bruno 40s, JR 36s, FN 31s).

- [x] **Task 4: Client Embedded App SDK & Auth Integration**
  - Setup `@discord/embedded-app-sdk` lifecycle in `client/src/discord.ts` (`ready`, `authorize`, `/api/token` exchange, `authenticate`), channel detection, coordinator permission check, and dev fallback mode.
  - *Verified:* Discord SDK integration and dev role switcher for dual-perspective browser testing.

- [x] **Task 5: Client Dashboard & Live Spectator View**
  - Built live UTC clock header (`client/src/components/Header.tsx`), countdown timer banner (`client/src/components/CountdownBanner.tsx`), sorted departure list (`client/src/components/PlayerList.tsx`), Web Audio API sound alerts (`client/src/audioAlert.ts`), and visual cues (yellow at -3s, green at 0s).
  - *Verified:* Audio alerts with synthesized frequencies and responsive countdown states.

- [x] **Task 6: Coordinator Control Panel & Time Parser**
  - Built coordinator-only interface (`client/src/components/CoordinatorPanel.tsx`): rally duration picker (5m/10m), prep window picker (10s/20s/1m), player/time input parser (handles `30`, `35s`, `01:15`, `6m30s`), and action buttons (Start, Reset, Clear).
  - *Verified:* Flexible time parser with instant preview, upsert without duplication.

- [x] **Task 7: Verification & Build Validation**
  - Built frontend and backend, executed unit tests and end-to-end multi-client Socket.io tests.
  - *Verified:* All 4 automated test suites passed; `npm run build` completed with exit code 0.
