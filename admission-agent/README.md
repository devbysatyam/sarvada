# Sarvada Modern Secondary School — Autonomous Admission Follow-up & CRM Agent

Welcome to the architectural design and blueprint for the **Sarvada Admission Autopilot & CRM Agent** (`admission-agent`).

This agent is designed to run independently of the main website (e.g., on a low-cost VPS, Docker container, or background server) and act as a dedicated **Admission Operations Copilot**. It bridges the gap between online inquiry generation and on-ground school enrollment.

---

## 📌 Executive Summary

```
                       ┌────────────────────────────────────────┐
                       │   Website Frontend & AI Chatbot       │
                       │   (sarvada.edu.in / Firebase Firestore)│
                       └───────────────────┬────────────────────┘
                                           │
                        New Inquiry Event  │ (Firestore onSnapshot / Webhook)
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    ADMISSION AUTOPILOT AGENT (VPS)                           │
│                                                                              │
│  ┌───────────────────────────┐         ┌──────────────────────────────────┐  │
│  │   Event Listener Engine   │         │   Scheduled Follow-Up Worker     │  │
│  │   (Real-time Lead Intake) │         │   (APScheduler / Cron Engine)    │  │
│  └─────────────┬─────────────┘         └────────────────┬─────────────────┘  │
│                │                                        │                    │
│                ▼                                        ▼                    │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                  Core Decision & State Orchestrator                    │  │
│  │  • Stage evaluation (New -> Visited -> Verified -> Enrolled -> Feedback)│  │
│  │  • Sibling deduplication & DND filter                                  │  │
│  │  • TRAI timing filter (Strict 9:00 AM – 7:00 PM IST)                   │  │
│  │  • Intelligent Counselor Assignment (Round-robin)                      │  │
│  └───────────────────────────────────┬────────────────────────────────────┘  │
│                                      │                                       │
│          ┌───────────────────────────┼───────────────────────────┐           │
│          ▼                           ▼                           ▼           │
│  ┌───────────────┐           ┌───────────────┐           ┌───────────────┐   │
│  │ Transactional │           │ Staff Alert   │           │ Feedback &    │   │
│  │ SMS Gateway   │           │ Bot (Telegram)│           │ Survey Engine │   │
│  │ (Fast2SMS/MSG)│           │ (Click-to-Call│           │ (SMS/Web Link)│   │
│  └───────────────┘           └───────────────┘           └───────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Documentation Index

The complete architecture is documented across 4 dedicated specifications in this folder:

1. **[`ARCHITECTURE.md`](./ARCHITECTURE.md)**
   * High-level architectural patterns (Event-driven + Scheduled).
   * Data pipelines connecting with the website's Firestore database (`admissions_leads`).
   * Component breakdown: Event Listener, Decision Engine, Staff Dispatcher, SMS Gateway.
   * Recommended tech stack: Python ADK / Node.js + Docker Compose.

2. **[`PLAYBOOKS.md`](./PLAYBOOKS.md)**
   * The 5 Core Automation Journeys:
     1. **Instant Lead Triaging & Welcome:** Immediate parent SMS + Staff dispatch.
     2. **Counselor Follow-up Cadence:** T+24h, T+72h, T+5 Days reminder loops.
     3. **Document Verification & Campus Visit:** Pre-visit checklist & directions.
     4. **Admission Done & Onboarding:** Welcome kit, uniform/books schedule.
     5. **Post-Admission Feedback Survey:** Quality scores & automated escalation to Principal.
   * Ready-to-use message templates (DLT-compliant SMS & Telegram staff cards).

3. **[`EDGE_CASES_AND_COMPLIANCE.md`](./EDGE_CASES_AND_COMPLIANCE.md)**
   * **Regulatory Compliance (India):** TRAI commercial calling windows, DLT template approval requirements.
   * **Race Conditions & Edge Cases:**
     * Offline counter fee deposits vs. pending automated SMS.
     * Sibling deduplication (avoiding double notifications for parents with 2 kids).
     * DND (Do Not Disturb) and opt-out handling.
     * Counselor sick-day / unassigned lead fallback.
     * Concurrency & idempotent processing (zero duplicate SMS on crash/restart).

4. **[`VPS_DEPLOYMENT.md`](./VPS_DEPLOYMENT.md)**
   * VPS Server requirements & recommended providers ($4 - $6/month).
   * Complete `docker-compose.yml` and environment variable configuration.
   * Systemd service setup, logging, and health monitoring.
   * Security, API key storage, and Firebase Service Account handling.

---

## 🚀 Key Advantages Over Website-Only Chatbot

| Feature | Website Chatbot Alone | With Dedicated Follow-Up Agent |
| :--- | :--- | :--- |
| **Active Duration** | Only while parent is browsing | Continuous 24/7 background worker |
| **Staff Engagement** | Staff must manually check `/admin/admissions` | Instant Telegram alert with 1-click `Click-to-Call` |
| **Lead Nudging** | 0 follow-up if parent leaves | Automated 24h & 72h SMS reminders |
| **Post-Admission** | Stops after registration form | Onboarding welcome + Day 7 feedback survey |
| **Counselor Accountability** | No reminders for missed calls | Alerts Principal if high-priority lead is untouched > 24h |
| **Hosting Cost** | Built into Vercel/Next.js | Runs on a $5/month VPS or existing server |
