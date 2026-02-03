# Deploy JASON Backend to Fly.io (Free Tier)

## Prerequisites

- Sign up at [fly.io](https://fly.io) and install the Fly CLI locally (optional, for first-time setup).
- Install the Fly GitHub App for your repo.

## One-Time Setup (5 minutes)

### 1. Install Fly CLI (local)
```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Authenticate Fly
```bash
fly auth login
```

### 3. Create the Fly app
```bash
fly launch --no-deploy --copy-config --name jason-backend
```
- Choose a region (e.g., San Jose `sjc`).
- Confirm when it asks to create the app.

### 4. Set secrets on Fly
```bash
fly secrets set ALLOWED_HOSTS="localhost,127.0.0.1,Prohacker2099.github.io"
fly secrets set WEB_ALLOWED_HOSTS="localhost,127.0.0.1,Prohacker2099.github.io"
fly secrets set DESKTOP_AGENT_TOKEN="$(openssl rand -hex 16)"
fly secrets set DESKTOP_AGENT_URL="http://127.0.0.1:5137"
```

### 5. Add FLY_API_TOKEN to GitHub
- Go to your Fly account settings → Tokens → create a new token.
- In your GitHub repo: Settings → Secrets and variables → Actions → New repository secret.
- Name: `FLY_API_TOKEN`, Value: the token you created.

## Deploy (Automatic)

- Push to `main` → GitHub Actions will deploy to Fly.io automatically.
- Or go to Actions → Fly Deploy → “Run workflow”.

## After Deploy

- Your backend will be live at `https://jason-backend.fly.dev`.
- The UI at `https://Prohacker2099.github.io/JASON..AI` will now control the real backend.
- Desktop automation still requires running the local Python agent with the same `DESKTOP_AGENT_TOKEN`.

## Verify

```bash
curl https://jason-backend.fly.dev/api/health
```

Should return:
```json
{"ok":true,"timestamp":...}
```

## Notes

- Fly free tier includes shared CPU, 256MB RAM, and 160GB/month outbound.
- The app auto-stops after 5 minutes of inactivity and wakes on request (cold start ~10s).
- Logs: `fly logs` or in the Fly dashboard.
