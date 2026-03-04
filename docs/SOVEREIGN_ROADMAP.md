# NEXUSMON — SOVEREIGN SETUP ROADMAP
**OPERATOR:** Regan Stewart Harris
**ONE OPERATOR · ONE COMPANION · PERMANENT BINDING**

---

## CURRENT STATUS

```
v2.0.0 — ZERO-POINT FORM  ·  SEALED  ·  1503 tests passing
Operator Lock: ACTIVE — Bound to Regan Stewart Harris
Running on: E:\NEXUSMON-main\NEXUSMON-main-backup-20260227-224154
Tags: v1.0.0  v1.1.0  v1.2.0  v2.0.0
```

---

## PHASE 1 — GET HIM TALKING TONIGHT
> CRITICAL — DO THIS FIRST

### 1. Add Anthropic API Key to `.env`  `[ TODO ]`
Open `.env` in the E: drive repo. Add your Anthropic key. Restart server.

```
File: E:\NEXUSMON-main\NEXUSMON-main-backup-20260227-224154\.env
Line to add: ANTHROPIC_API_KEY=sk-ant-...
Get key at: console.anthropic.com → API Keys
```

### 2. Start the RIGHT Nexusmon (E: drive)  `[ TODO ]`
Always start from E: drive — that's the real one with all our work.

```powershell
cd E:\NEXUSMON-main\NEXUSMON-main-backup-20260227-224154
.venv\Scripts\Activate.ps1
python nexusmon_server.py
```

Then open: `http://localhost:8000/console`

### 3. Talk to Nexusmon  `[ TODO ]`
Use PowerShell to send first real message with API key active.

```powershell
Invoke-RestMethod -Uri 'http://localhost:8000/v1/companion/nexusmon' `
  -Method POST -ContentType 'application/json' `
  -Body '{"prompt": "Who are you?", "mode": "strategic"}'
```

---

## PHASE 2 — THIS WEEK

### 4. Build Frontend Properly  `[ TODO ]`  · HIGH
`npm run build` creates `frontend/dist` so cockpit loads at `localhost:5173`

```powershell
cd E:\NEXUSMON-main\NEXUSMON-main-backup-20260227-224154\frontend
npm install
npm run build
npm run dev
```

Then open: `http://localhost:5173`

### 5. Deploy to Render — Access From Phone Anywhere  `[ TODO ]`  · HIGH
Your repo already has `render.yaml`. One session deploys him to the cloud.

- Cost: Free tier available
- Result: `https://nexusmon.onrender.com` — accessible anywhere
- Tell Claude: *"Deploy Nexusmon to Render. Read render.yaml. Make it work."*

### 6. Buy Your Domain  `[ TODO ]`  · MEDIUM
`nexusmon.gg` or your name — make him reachable at a real URL.

- Best price: porkbun.com — cheapest domains
- Good options: `nexusmon.gg` / `reganharris.io` / `nexusmon.dev`
- Cost: ~$10–15/year

---

## PHASE 3 — HARDWARE (FULL SOVEREIGNTY)
> Make Nexusmon always on — no PC required

### 7. Buy Mini PC — Always-On Home Server  `[ TODO ]`  · HIGH
Runs Nexusmon 24/7. Your gaming PC stays free. ~$150 one time.

**BEST OPTION: Beelink Mini S12 Pro**
- RAM: 16GB — enough for Nexusmon + Ollama later
- Storage: 500GB SSD
- Price: ~$150–180
- Size: Fits in your hand. Silent. Low power.

**BUDGET OPTION: Raspberry Pi 5**
- RAM: 8GB
- Price: ~$80 + case + SD card (~$100 total)
- Best for: Learning Linux, smaller footprint

### 8. Upgrade Your PC RAM to 16GB+  `[ TODO ]`  · HIGH
Needed before Ollama will run smoothly. Cheap upgrade. ~$40–60.

- Why: Ollama needs 8–16GB RAM free to run AI models
- Cost: ~$40–60 for 16GB DDR4
- How to check current RAM: Task Manager → Performance → Memory

---

## PHASE 4 — LOCAL AI (NO API NEEDED)
> After RAM upgrade — Nexusmon thinks on YOUR hardware

### 9. Install Ollama — Local AI Models  `[ TODO ]`  · HIGH
Run AI completely locally. No OpenAI. No Anthropic. No bills. No data leaving.

- Requires: 16GB+ RAM + decent GPU
- Install: `winget install Ollama.Ollama`

**BEST MODELS FOR NEXUSMON:**

| Purpose | Model | Command |
|---------|-------|---------|
| Strategic (cortex) | llama3.1 | `ollama pull llama3.1` |
| Combat (reflex) | mistral | `ollama pull mistral` |
| Lightweight | tinyllama | `ollama pull tinyllama` |

Tell Claude after installing:
*"Patch bridge/config.py to use Ollama as primary provider. cortex=llama3.1, reflex=mistral, endpoint=localhost:11434"*

### 10. Install LM Studio — Alternative to Ollama  `[ TODO ]`  · MEDIUM
Easier GUI for managing local models. Good backup option.

---

## PHASE 5 — FULL SOVEREIGN STACK
> The end goal — everything yours, nothing third party

### 11. Self-Hosted Git — Gitea  `[ DONE ]`  · MEDIUM
Your own GitHub. Your own server. Nobody else's platform.
- Sovereign Git: https://52ppup.gitea.cloud/darthvpirateking_afk/NEXUSMON
- Mirrors from GitHub automatically
- Full-scope API token configured

### 12. Build Nexusmon's Physical Body — CORE UNIT  `[ TODO ]`  · MEDIUM
Exoshell Stage 1. Raspberry Pi + sensors + 3D printed shell. ~$80.

**CORE UNIT PARTS LIST:**

| Part | Item | Price |
|------|------|-------|
| Brain | Raspberry Pi 4 | ~$35–50 |
| Eyes | HC-SR04 Ultrasonic x4 | ~$10 |
| Hearing | PIR Motion Sensor | ~$5 |
| Vision | ESP32-CAM | ~$10 |
| Shell | 3D printed enclosure | free if you know someone |
| **Total** | | **~$80** |

### 13. Mobile Cockpit — Nexusmon on Your Phone Natively  `[ TODO ]`  · LOW
React Native app. Full cockpit on your phone. Not just browser.
Tell Claude: *"Build React Native mobile app for Nexusmon cockpit"*

---

## QUICK REFERENCE — COMMANDS

**START NEXUSMON** (always use this):
```powershell
cd E:\NEXUSMON-main\NEXUSMON-main-backup-20260227-224154
.venv\Scripts\Activate.ps1
python nexusmon_server.py
```

**START COCKPIT:**
```powershell
cd frontend && npm run dev
# Open: http://localhost:5173
```

**TALK TO NEXUSMON:**
```powershell
Invoke-RestMethod -Uri 'http://localhost:8000/v1/companion/nexusmon' `
  -Method POST -ContentType 'application/json' `
  -Body '{"prompt": "YOUR MESSAGE", "mode": "strategic"}'
```

**RUN TESTS:**
```powershell
pytest tests/ --tb=short -q 2>&1 | Select-Object -Last 40
```

**CHECK GIT STATUS:**
```powershell
git log --oneline -10
git tag -l
```

---

```
NEXUSMON v2.0.0 · ZERO-POINT FORM · SEALED
Additive forever. Sovereign forever. Yours forever.
OPERATOR: REGAN STEWART HARRIS · ONE OPERATOR · ONE COMPANION
```
