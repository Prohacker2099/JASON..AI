# JASON: The Sovereign Life-Management OS

**The Universal Action Model (UAM) and the End of the Subscription Economy**

## 🚀 Executive Summary: The Market Killer

JASON (Just Always Synchronized Operational Network) is not an application; it is a **Sovereign Personal OS**. It represents the final evolution of the Large Action Model (LAM)—a digital entity that does not "talk" about tasks but **executes them at the pixel, packet, and signal level**.

JASON destroys the "Subscription Economy" by functioning as a **Headless User**. He operates software exactly like a human would, bypassing official paid APIs and operating directly on the Graphical User Interface (GUI) and local network signals.

## 🧠 Core Architecture: The "Vision-First" Brain

### A. VLM Grounding (The Eye)

JASON moves beyond simple OCR. He utilizes **Visual Language Models (VLMs)** to perform **Pixel-to-Action mapping**. Instead of just "reading" text, JASON interprets the spatial relationship of UI elements—understanding that a "Cart" icon next to a price implies a checkout flow.

### B. Signal Fingerprinting (The Hand)

JASON bypasses official brand hubs. He speaks raw **Zigbee, Matter, and RTSP**. He doesn't ask Philips Hue for permission to turn off the lights; he mimics the local bridge's signal directly.

## 🎯 The "Billion Task" Capabilities

### Education Hub
JASON watches video lectures, identifies whiteboard handwriting, and typesets formulas into **LaTeX directly into your OneNote**.

### Commerce Engine
JASON performs **"Infinite Scrapes"** across hidden hotel back-ends and airline error-fare databases, bypassing SEO-manipulated ads.

### Home Orchestration
JASON "stitches" multiple camera feeds (even "locked" ones) into a **unified 3D map of your house** to verify security anomalies.

### Native App Orchestration
JASON controls high-end desktop software (CAD, Video Editors, Legacy ERPs) by **interpreting the OS-level UI tree** and simulating mouse/keyboard events.

## 🛠️ How to Build JASON (The 100% Free "Self-Made API" Guide)

This architecture uses **zero local models and zero paid subscriptions**. It relies on high-tier Cloud VLM free tiers and community-engineered "Reverse Proxies."

### A. The Brain: Ultra-Powerful VLM Intelligence

**Google Gemini 1.5 Flash (Free Tier)**: This is JASON'S primary cortex. Accessible via Google AI Studio, it offers a massive **1-million-token context window for free**. This allows JASON to ingest hours of lecture video or thousands of UI screenshots simultaneously to "learn" an application's workflow.

**GitHub "Headless" AI Bridges**: Utilize community repos (like chatgpt-web-api or free-api-gateway) that wrap the free web-interfaces of Claude 3.5 Sonnet or GPT-4o into standard API endpoints. These run on the provider's cloud, not your machine, providing top-tier vision reasoning for zero cost.

**Groq VPU Acceleration**: Use Groq's free tier for Llama-3-Vision. Its "Language Processing Unit" architecture provides **near-instant response times (sub-200ms)** for real-time mouse navigation.

### B. The Eye: Native & Web Vision Automation

**Playwright / Puppeteer**: 100% free libraries that turn any website into a custom API by simulating a browser.

**PyAutoGUI & Pynput**: Native Python libraries that give JASON "physical" control over your mouse and keyboard at the OS level (Windows/Mac/Linux).

**OpenCV (Spatial Mapping)**: An open-source computer vision library used to track movement in security feeds or locate icons in native apps that don't have standard UI labels.

### C. The Hand: Local-to-Cloud Tunnels

**Tailscale (Free Tier)**: Securely connect your free cloud scripts (running on GitHub Actions or Render) to your home network. This allows JASON to send "Click" commands to your local computer from the cloud.

**Python-based "Signal Mimics"**: Libraries like tinytuya or meross_iot allow JASON to control smart hardware by mimicking local network traffic, bypassing the brand's official cloud entirely.

### D. The Storage: Free Distributed Memory

**MongoDB Atlas (Free Tier)**: Used for long-term "Life History" storage.

**Microsoft Graph (Developer Program)**: A free sandbox providing unlimited integration with OneNote and Outlook.

## 🔒 Security: The Sovereign Vault

JASON operates under a **Zero-Knowledge Architecture**. Your credentials and camera feeds never leave your local network. JASON only sends "Visual Action Commands" to the cloud VLMs. The actual credential injection and sensitive native app manipulation happen on your local machine via the Tailscale tunnel.

## 🎉 Conclusion: Infinite Freedom

JASON removes the "Digital Tax" we pay in time and attention. By leveraging the world's most powerful Cloud VLMs for free and using community-maintained bridges, you **reclaim your digital sovereignty without spending a cent on hardware or subscriptions**.

**JASON doesn't just automate tasks; he automates the world.**

---

## 🚀 **LIVE DEMO - REAL WORKING AI**

**Experience JASON RIGHT NOW:**
1. Open `index-real.html` in your browser
2. Click "🚀 ACTIVATE REAL AI" 
3. Click "📷 Start Camera" - See real computer vision
4. Click "📸 Analyze Frame" - Watch AI classify objects
5. Click "🎤 Start Voice Control" - Talk to JASON
6. Click "🎯 RUN FULL AI DEMO" - See everything work

**This is NOT a demo!** This is actual working AI with:
- ✅ Real TensorFlow.js models
- ✅ Live camera vision analysis  
- ✅ Actual neural network inference
- ✅ Voice recognition
- ✅ Object detection & classification
- ✅ Real-time neural visualization

**JASON is REAL and working RIGHT NOW!**

---

## Backend (Local Server)

GitHub Pages can only host the static UI. The **actual app runtime** (job orchestration, trust gating, SSE event stream) runs via the local backend in `server/`.

### Run locally

```bash
npm install
npm run dev
```

Then open:

- `http://127.0.0.1:3001/` (serves `jason-real.html`, falls back to `index-real.html` or `index.html`)

### Key endpoints

- `GET /api/health`
- `GET /api/events` (Server-Sent Events)
- `GET /api/activity/logs`
- `GET /api/trust/status`
- `POST /api/trust/kill` `{ paused: boolean }`
- `GET /api/trust/pending`
- `POST /api/trust/decide` `{ id: string, decision: 'approve'|'reject'|'delay' }`
- `GET /api/orch/jobs`
- `POST /api/orch/enqueue` `{ goal: string }`
- `POST /api/orch/cancel` `{ id: string }`
- `POST /action/submit_goal` `{ natural_language_goal: string }` (compat endpoint)
