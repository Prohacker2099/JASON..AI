# Deploy JASON Backend to Railway (Free Tier)

## One-Time Setup (3 minutes)

### 1. Connect GitHub to Railway
- Go to [railway.app](https://railway.app) and sign up with GitHub.
- Click **“New Project” → Deploy from GitHub repo**.
- Select `Prohacker2099/JASON..AI`.

### 2. Configure the Service
- Railway will auto-detect Node.js.
- **Build Command**: `npm install && npx playwright install chromium`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`

### 3. Set Environment Variables
In the Railway service settings, add:
- `NODE_ENV` = `production`
- `PORT` = `10000`
- `ALLOWED_HOSTS` = `localhost,127.0.0.1,Prohacker2099.github.io`
- `WEB_ALLOWED_HOSTS` = `localhost,127.0.0.1,Prohacker2099.github.io`
- `DESKTOP_AGENT_TOKEN` = (generate a secret token)
- `DESKTOP_AGENT_URL` = `http://127.0.0.1:5137`

### 4. Deploy
- Click **“Deploy”**. Railway will build and deploy.
- Once deployed, Railway will give you a URL like `https://jason-backend.up.railway.app`.

### 5. Update UI (if needed)
If Railway gives you a different URL, update `BACKEND_URL` in `jason-real.html` and push.

## Verify

```bash
curl https://jason-backend.up.railway.app/api/health
```

Should return:
```json
{"ok":true,"timestamp":...}
```

## After Deploy

- Your UI at `https://Prohacker2099.github.io/JASON..AI` will now control the live Railway backend.
- All buttons will work: web sessions, trust gate, commerce scraping, etc.
- Desktop automation still requires running the local Python agent with the same `DESKTOP_AGENT_TOKEN`.

## Notes

- Railway free tier includes 500 hours/month.
- Auto-deploys on push to `main` if you enable it.
- Logs and metrics in the Railway dashboard.
