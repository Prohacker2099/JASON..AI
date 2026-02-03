# JASON – REAL Sovereign AI OS: Setup & Security

## Overview

JASON is a **local-first, trust-gated automation platform** that can:
- Automate web browsers via Playwright (sessions, navigate, click, type, screenshots)
- Automate Windows desktop via a local Python agent (mouse, keyboard, screenshots)
- Enforce multi-level trust gating with user approval prompts
- Persist cookies and handle consent dialogs (no CAPTCHA bypass)

> **Important**: GitHub Pages only serves the static HTML UI. To run the full app, run the backend locally or deploy it to a host (Render/Fly/Railway/VPS).

---

## Quick Start (Local)

### 1. Install Node.js dependencies

```bash
npm install
```

### 2. (Optional) Install Playwright browsers

```bash
npx playwright install chromium
```

### 3. Run the backend

```bash
npm run dev
```

The backend starts on `http://localhost:3001` by default.

### 4. Run the desktop agent (optional, for Windows automation)

```bash
cd agent
pip install -r requirements.txt
DESKTOP_AGENT_TOKEN=your-secret-token python desktop_agent.py
```

### 5. Open the UI

Visit `http://localhost:3001` in your browser.

---

## Security Model

### Host Allowlists

Two environment variables control which hosts are allowed:

- `ALLOWED_HOSTS` (comma-separated): Used by general fetch/commerce endpoints. Default: `localhost,127.0.0.1`.
- `WEB_ALLOWED_HOSTS` (comma-separated): Used by Playwright web automation. Default: `localhost,127.0.0.1`.

Example:
```bash
export ALLOWED_HOSTS="localhost,127.0.0.1,example.com"
export WEB_ALLOWED_HOSTS="localhost,127.0.0.1,example.com"
```

### Trust Gating (Levels 1–3)

- **Level 1**: Low-risk actions (e.g., navigate to allowlisted hosts)
- **Level 2**: Medium-risk actions (e.g., click, type, screenshot)
- **Level 3**: High-risk actions (e.g., desktop actions, web navigation to non-allowlisted hosts, typing passwords)

High-risk actions require explicit user approval via the UI Trust Gate or API.

### Desktop Agent Authentication

The desktop agent requires a shared secret token:

- Set `DESKTOP_AGENT_TOKEN` on the backend (environment variable or `.env`).
- Set the same `DESKTOP_AGENT_TOKEN` when starting the Python agent.
- The backend only forwards desktop commands to `http://127.0.0.1:5137` (configurable via `DESKTOP_AGENT_URL`).

### No CAPTCHA Bypass

- If a consent/cookie dialog is detected, JASON can **accept/reject/dismiss** it.
- If a CAPTCHA is detected, JASON **pauses and prompts the user** to solve it manually.
- No automated CAPTCHA solving is performed.

---

## API Endpoints

### Core

- `GET /api/health` – Backend health
- `GET /api/events` – SSE event stream (live logs)
- `GET /api/activity/logs` – Recent activity

### Trust Gate

- `GET /api/trust/status` – Paused/active
- `POST /api/trust/kill` – Pause/unpause high-risk actions
- `GET /api/trust/pending` – List pending L3 prompts
- `POST /api/trust/decide` – Approve/reject/delay a prompt

### Orchestrator (Jobs)

- `POST /api/orch/enqueue` – Enqueue a goal (e.g., `web:navigate sessionId https://example.com`)
- `GET /api/orch/jobs` – List jobs
- `GET /api/orchestrator/jobs/:id` – Job details
- `POST /api/orch/cancel` – Cancel a job

### Web Automation (Playwright)

- `POST /api/web/session/create` – Create a browser session
- `GET /api/web/sessions` – List sessions
- `POST /api/web/session/close` – Close a session
- `GET /api/web/session/:id/cookies` – List cookies for a session
- `POST /api/web/session/:id/cookies` – Set cookies for a session
- `GET /api/web/session/:id/consent` – List consent prompts
- `POST /api/web/session/:id/consent/detect` – Detect consent dialogs
- `POST /api/web/session/:id/consent/:promptId/handle` – Accept/reject/dismiss a consent dialog

#### Job Goals (Web)

- `web:navigate <sessionId> <url>` – Navigate to a URL
- `web:click <sessionId> <cssSelector>` – Click an element
- `web:type <sessionId> <cssSelector> | <text>` – Type text
- `web:press <sessionId> <key>` – Press a key
- `web:screenshot <sessionId>` – Take a screenshot
- `web:cookies:list <sessionId>` – List cookies
- `web:cookies:set <sessionId> <jsonCookiesArray>` – Set cookies
- `web:consent:detect <sessionId>` – Detect consent dialogs
- `web:consent:handle <sessionId> <promptId> <method>` – Handle consent (accept/reject/dismiss)

### Desktop Automation (Local Agent)

- `GET /api/desktop/status` – Agent configuration status
- `GET /api/desktop/health` – Ping the agent
- `POST /api/desktop/execute` – Execute a desktop action (requires L3 approval)

#### Desktop Actions

- `click` – Click at coordinates (x, y, button?, clicks?)
- `move` – Move mouse to coordinates
- `type` – Type text (interval optional)
- `press` – Press a key (presses optional)
- `hotkey` – Hotkey combination (keys array)
- `screenshot` – Desktop screenshot (format?, quality?, region?)

### Commerce (Safe Fetch)

- `POST /api/commerce/scrape` – Fetch and parse a URL (host-allowlisted)

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend port |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Host allowlist for general fetch |
| `WEB_ALLOWED_HOSTS` | `localhost,127.0.0.1` | Host allowlist for Playwright web automation |
| `DESKTOP_AGENT_URL` | `http://127.0.0.1:5137` | Desktop agent base URL |
| `DESKTOP_AGENT_TOKEN` | (required) | Shared secret for desktop agent |

---

## Deployment Notes

### Static UI (GitHub Pages)

- The UI (`jason-real.html`) is served by GitHub Pages at `https://Prohacker2099.github.io/JASON..AI`.
- This only shows the UI; backend/agent are not active.

### Backend Hosting

To run the backend online, deploy to any Node.js host (Render, Fly, Railway, VPS):
- Set environment variables (especially `DESKTOP_AGENT_TOKEN` if you use desktop automation).
- Install Playwright browsers on the host (`npx playwright install chromium`).

### Desktop Agent

- The agent is designed to run **locally** on your Windows machine.
- It binds to `127.0.0.1:5137` by default and requires the same `DESKTOP_AGENT_TOKEN` as the backend.
- Do not expose the agent port publicly.

---

## Troubleshooting

- **Playwright not found**: Run `npx playwright install chromium`.
- **Desktop agent unauthorized**: Ensure `DESKTOP_AGENT_TOKEN` matches on backend and agent.
- **Host not allowed**: Add the domain to `ALLOWED_HOSTS` or `WEB_ALLOWED_HOSTS`.
- **Trust prompts not appearing**: Ensure SSE is connected; check `/api/events`.

---

## Privacy & Data

- All automation runs locally unless you deploy the backend.
- No data is sent to external services except the websites you explicitly navigate to.
- Cookies and screenshots are stored in memory only while the session is active.

---

## Contributing

- Keep security first: never bypass trust gating or host allowlists.
- Add tests for new automation primitives.
- Document new endpoints and job goals.

---
