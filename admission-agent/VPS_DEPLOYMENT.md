# VPS Deployment & Hosting Guide

This guide details how to deploy the **Sarvada Admission Autopilot Agent** on an independent Virtual Private Server (VPS) for 24/7 continuous operation.

---

## 1. Server Hardware & Cost Breakdown

Because the agent is lightweight (event listener + scheduler + outbound API calls), it requires minimal computing resources:

| Specification | Minimum Required | Recommended |
| :--- | :--- | :--- |
| **CPU** | 1 vCPU | 1 or 2 vCPU |
| **RAM** | 512 MB | 1 GB or 2 GB |
| **Storage** | 10 GB SSD | 20 GB SSD |
| **OS** | Ubuntu 22.04 LTS / 24.04 LTS | Ubuntu 24.04 LTS |
| **Estimated Cost** | **$3.50 – $5.00 / month** | **$4.00 – $6.00 / month** |

### Recommended VPS Providers:
* **Hetzner Cloud (CX22):** ~€3.80 / month (Outstanding reliability & European/Singapore locations).
* **DigitalOcean (Basic Droplet):** $4 – $6 / month.
* **AWS Lightsail:** $3.50 / month (1 GB RAM, 1 vCPU, 2 TB transfer).
* **Hostinger KVM 1:** ~$5.00 / month (Includes India / Mumbai datacenter location).

### Operational Cost Comparison:
* **VPS Server:** ~$5.00 / month.
* **Telegram Staff Bot:** **$0.00** (Free official Telegram Bot API, unlimited alerts).
* **Transactional SMS (Fast2SMS / MSG91):** ~₹0.15 to ₹0.20 per SMS (~₹150 for 1,000 inquiries).
* **Total Monthly Budget:** **Under ₹500 - ₹600 / month**.

---

## 2. Directory Structure of the Agent

```
admission-agent/
├── docker-compose.yml           # Multi-container orchestration & auto-restart
├── Dockerfile                   # Python 3.11 slim image
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment configuration template
├── service-account.json         # Firebase Admin SDK Credentials (secured)
└── src/
    ├── main.py                  # Daemon entrypoint & FastAPI health endpoint
    ├── config.py                # Pydantic environment validation
    ├── firebase_client.py       # Firestore onSnapshot listener & update hooks
    ├── state_machine.py         # Lead stage transitions & eligibility rules
    ├── scheduler.py             # APScheduler cron jobs (T+24h, T+72h, Day 7)
    ├── channels/
    │   ├── sms.py               # DLT SMS API adapter (Fast2SMS / MSG91)
    │   ├── telegram.py          # Interactive Staff Bot & Action Callbacks
    │   └── feedback.py          # Post-admission survey & escalation logic
    └── utils/
        ├── trai_guard.py        # 9:00 AM – 7:00 PM IST time gatekeeper
        └── deduplicator.py      # Sibling & rapid-submission aggregator
```

---

## 3. Configuration & Environment Variables (`.env`)

Create a `.env` file on the VPS:

```env
# ── AGENT ENVIRONMENT ──────────────────────────
APP_ENV=production
LOG_LEVEL=INFO
TIMEZONE=Asia/Kolkata

# ── FIREBASE CREDENTIALS ───────────────────────
# Downloaded from Firebase Console -> Project Settings -> Service Accounts
FIREBASE_CREDENTIALS_PATH=/app/service-account.json
FIRESTORE_LEADS_COLLECTION=admissions_leads

# ── TELEGRAM STAFF NOTIFICATION BOT ───────────
# Created via @BotFather on Telegram
TELEGRAM_BOT_TOKEN=7482910482:AAHxxxxxxxxxxxxxxxxxxxx
# Group ID for Admission Desk (negative number for supergroups)
TELEGRAM_STAFF_CHAT_ID=-1002345678901
# Principal / Management Chat ID (for service escalations)
TELEGRAM_PRINCIPAL_CHAT_ID=-1009876543210

# ── TRANSACTIONAL SMS GATEWAY (INDIA DLT) ──────
SMS_GATEWAY_PROVIDER=FAST2SMS  # or MSG91
SMS_API_KEY=your_fast2sms_api_key_here
SMS_SENDER_ID=SRVADA           # 6-character registered DLT header
DLT_TE_NEW_LEAD_ID=1707xxxxxxxxxxxxxx
DLT_TE_NUDGE_VISIT_ID=1707xxxxxxxxxxxxxx
DLT_TE_ENROLL_CONFIRM_ID=1707xxxxxxxxxxxxxx
DLT_TE_FEEDBACK_SURVEY_ID=1707xxxxxxxxxxxxxx

# ── SCHOOL METADATA ────────────────────────────
SCHOOL_NAME="Sarvada Modern Secondary School"
SCHOOL_PHONE="+919999439422"
SCHOOL_ADDRESS="Sadatpur, Karawal Nagar, Delhi — 110094"
OFFICE_HOURS="Mon–Sat, 8:00 AM – 2:30 PM"
```

---

## 4. Docker & Containerization Setup

### `Dockerfile`
```dockerfile
FROM python:3.11-slim

# Set timezone and disable buffering
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    TZ=Asia/Kolkata

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

# Install python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose healthcheck port
EXPOSE 8080

CMD ["python", "src/main.py"]
```

### `docker-compose.yml`
```yaml
version: '3.8'

services:
  admission-agent:
    build: .
    container_name: sarvada-admission-agent
    restart: always
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs
      - ./service-account.json:/app/service-account.json:ro
    ports:
      - "8080:8080"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

### `requirements.txt`
```text
fastapi==0.115.0
uvicorn==0.32.0
firebase-admin==6.6.0
apscheduler==3.11.0
httpx==0.27.2
python-telegram-bot==21.6
pydantic==2.9.2
python-dotenv==1.0.1
pytz==2024.2
```

---

## 5. Deployment Commands on VPS (Ubuntu)

Run these commands in your SSH terminal on the VPS:

```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install Docker and Docker Compose
sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker

# 3. Create project directory
sudo mkdir -p /opt/sarvada-admission-agent
cd /opt/sarvada-admission-agent

# 4. Upload / copy the admission-agent files here:
# (Dockerfile, docker-compose.yml, requirements.txt, .env, service-account.json, src/)

# 5. Build and run in background
docker-compose up -d --build

# 6. Check live logs to verify connection
docker-compose logs -f
```

### Expected Startup Log:
```text
[INFO] Sarvada Admission Agent v1.0.0 initializing...
[INFO] Timezone set to Asia/Kolkata (Current: 2026-10-21 13:30:00 IST)
[INFO] Connected to Firebase Firestore [Collection: admissions_leads]
[INFO] Telegram Bot initialized: @SarvadaAdmissionsBot (Desk: -1002345678901)
[INFO] SMS Adapter ready: Provider FAST2SMS [Sender: SRVADA]
[INFO] Realtime Firestore onSnapshot listener ACTIVE.
[INFO] APScheduler initialized (15-min cadence scan active).
[INFO] HTTP Health Server running on http://0.0.0.0:8080/health
```

---

## 6. Monitoring & Maintenance

* **Healthcheck Ping:** `http://<your-vps-ip>:8080/health` returns `{"status": "healthy", "leads_monitored": 48}`.
* **Auto-Recovery:** If the server is restarted or the process crashes, `restart: always` in Docker automatically resumes the daemon within 5 seconds.
* **Zero Double-Processing:** The built-in Firestore idempotency lock ensures no parent receives duplicate notifications even after a container crash or redeployment.
