# Pune Civic Platform — Complete Production-Ready Civic Infrastructure

> **Independent Civic Issue Reporting, Redressal & Oversight Platform for Pune**  
> *Non-governmental civic technology initiative for citizen empowerment, transparency, and public accountability.*

---

## 🏛️ Project Overview

**Pune Civic Platform** is an independent, mobile-first civic technology system enabling residents of Pune to document, geo-tag, and track the resolution of public infrastructure hazards with transparent timeline audits.

### ⚠️ Statutory Non-Affiliation Notice
This platform is **NOT** operated by or affiliated with the Pune Municipal Corporation (PMC), Pimpri Chinchwad Municipal Corporation (PCMC), or the Government of Maharashtra. It operates strictly as an independent citizen oversight and civic catalog.

---

## 🛠️ Mandatory Stack & Architecture

- **Framework:** Next.js 16 (App Router) with Turbopack dev server
- **Language:** JavaScript & JSX strictly (`.js` and `.jsx` only; `.ts`/`.tsx` strictly prohibited)
- **UI & Styling:** React 19, Tailwind CSS v3, Lucide React Icons
- **Database & Modeling:** MongoDB Atlas & Mongoose ODM (with GeoJSON `2dsphere` spatial indexing)
- **Authentication:** Edge-compatible JWT Sessions (`jose` HS256) via HTTP-Only Secure Cookies, `bcryptjs` password hashing
- **Security:** Server-side role-based middleware authorization, rate limiting on sensitive endpoints, anti-enumeration tracking tokens, CSV formula injection protection, PII scrubbing
- **Localization:** Bilingual support for **English (EN)** and **Marathi (मराठी)** with a live language switcher
- **Hosting Target:** Vercel (Edge Middleware + Serverless Functions)

---

## 🌟 Complete Platform Capabilities (Phases 1 — 4)

### 1. AI-Assisted Complaint Intelligence (Advisory Layer)
- **Dual Inference Engine:** 
  - **Primary:** Google Gemini 1.5 Flash client (activated when `GEMINI_API_KEY` is present).
  - **High-Accuracy Local Fallback:** 100% offline-ready bilingual Pune civic NLP engine with Marathi/English taxonomy (handles terms like *खड्डा, कचरा, गटार, दिवाबत्ती*).
- **Core AI Features:**
  - Category and subcategory suggestion from title/description.
  - Urgency/priority assessment with rationale.
  - Jaccard token duplicate complaint detection within neighborhood radius.
  - Executive summarization for long grievance descriptions.
  - Marathi-English semantic extraction.
- **Strict Advisory Guarantees:** AI outputs are strictly advisory. Machine learning predictions **never** automatically reject or mutate complaints. Authorized human coordinators hold sole operational authority.
- **Privacy First (PII Scrubbing):** Prior to any external LLM inference, `scrubPii()` neutralizes email addresses, Indian mobile numbers (+91 / 6-9xxxxxxxx), and 12-digit identification sequences.

### 2. Advanced MongoDB Analytics & Reporting (`/api/reports/advanced`)
- **Real Aggregation Pipelines:** Never generates fake statistics. Powered by real MongoDB pipelines:
  - **Resolution Turnaround Distribution:** Quantified in 4 buckets (`<12h`, `12-24h`, `24-48h`, `>48h`).
  - **Department Workload Matrix:** Handled vs. resolved, compliant vs. breached SLA, and active backlog by department.
  - **Ward Recurring Hotspots:** Locality groupings identifying persistent infrastructure failure points.
  - **Citizen Feedback Sentiment:** 5-star ratings, speed & quality satisfaction index.
- **Exporting:** Sanitized CSV downloads immune to formula/DDE injection (`=`, `+`, `-`, `@`).

### 3. Public Trust, Moderation, & Citizen Support
- **Content Moderation Queue (`/api/moderation/report-abuse`):** Citizens can flag complaints for defamation, spam, inappropriate content, or privacy violations. Human coordinators review flags in the Admin Dashboard.
- **Community Support Intake (`/api/contact`):** Issues unique tracking tickets (`TKT-YYYY-XXXX`) for platform inquiries, ward coordinator volunteering, or bug reports.
- **Privacy-Safe City Map (`/api/map/complaints`):**
  - Fuzzes coordinates by ~100–150m for sensitive/residential complaints using deterministic pseudorandom offsets.
  - Completely strips citizen names, mobile numbers, and emails from public map payloads.

### 4. Admin Governance & System Configuration (`/api/admin/config`)
- **System Settings:** Control platform name, organization, support contacts, and default language.
- **Feature Flags:** 
  - Toggle AI Grievance Intelligence Advisory.
  - Toggle Strict SLA Escalation Rules.
  - Toggle Geographic Privacy Coordinate Fuzzing.
  - Toggle Public Map Search & Filters.
  - Toggle SMS / Email / WhatsApp notifications.
- **Retention & Data Policies:** Set file retention days and geo fuzzing radius.
- **Audit Trails:** All setting changes, assignments, status changes, and verifications are permanently recorded in `AuditLog` with IP addresses and user agents.

### 5. Field Operations & Anti-Self-Approval Verification
- **Field Employee Workspace (`/employee/dashboard`):** Mobile-first interface for technicians to accept assignments, record before/after photographic proof, and mark work complete.
- **Supervisor Verification Desk (`/supervisor/dashboard`):** Independent review desk to verify photographic evidence or send work back for rework.
- **Anti-Self-Approval Security:** Server enforces that employees cannot verify or approve their own submitted work proofs.

### 6. Operational Health Check & Monitoring (`/api/health`)
- Returns real-time database ping latency, memory utilization (RSS/heap), system uptime, and provider status.

---

## 🔒 Security Audit & Hardening Summary

| Threat Surface | Defense Implemented |
| :--- | :--- |
| **Authentication Bypass** | Signed HS256 JWTs with 7-day expiration stored in HTTP-Only, SameSite=Lax cookies. |
| **Broken Role Permissions** | Strict server-side verification using `hasRole()` across 6 roles: `CITIZEN`, `FIELD_EMPLOYEE`, `SUPERVISOR`, `DEPARTMENT_COORDINATOR`, `OPERATIONS_ADMIN`, `SUPER_ADMIN`. |
| **Insecure Direct Object References (IDOR)** | Non-sequential, cryptographically unguessable tokens (`trk_...`) prevent complaint enumeration attacks. |
| **NoSQL Injection** | Mongoose schema type-casting and parameterized queries avoid raw string injections. |
| **Data Leakage (PII)** | Public endpoints (`/api/map/complaints`, `/api/statistics`) scrub all phone numbers, email addresses, and residential coordinates. |
| **CSV Formula Injection** | CSV exports prepend single quotes (`'`) to any cell beginning with `=`, `+`, `-`, or `@`. |
| **Rate Limiting** | Sliding window in-memory rate limiter on login, contact, AI analysis, and abuse reporting endpoints. |
| **Stack Trace Exposure** | Production error boundaries and API routes never output raw exception stacks to clients. |

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local` for local execution:

```bash
cp .env.example .env.local
```

Key environment configurations:
- `MONGODB_URI`: MongoDB connection string.
- `JWT_SECRET`: Minimum 32-character secret for signing session cookies.
- `CRON_SECRET`: Secret token securing scheduled escalation tasks (`/api/cron/escalate`).
- `GEMINI_API_KEY`: *(Optional)* Google Gemini 1.5 Flash API key. Omit to run on local bilingual NLP engine.
- `CLOUDINARY_CLOUD_NAME`: *(Optional)* Cloudinary object storage credentials. Defaults to local filesystem.
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`: *(Optional)* Production email credentials. Defaults to logged audit stubs.

---

## 🚀 Setup & Execution

### 1. Installation
```bash
npm install
```

### 2. Database Seeding & Admin Bootstrap
```bash
# Seed initial categories, wards, departments, and demo complaints
npm run seed

# Bootstrap the Super Administrator account
npm run bootstrap:admin
```

### 3. Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000` (or `http://localhost:3001` if port 3000 is occupied).

### 4. Running the Complete Automated Test Suite
```bash
npm test
```
Executes all 120 automated test assertions across Phase 2, Phase 3, and Phase 4:
- Phase 2: Lifecycle state machine, unguessable tokens, CSV formula escaping (38 tests).
- Phase 3: SLA calculations, business hours, on-hold pauses, anti-self-approval, geo-fuzzing (29 tests).
- Phase 4: AI triage, PII scrubbing, advanced MongoDB analytics, moderation, contact tickets, health check, end-to-end flows (53 tests).

### 5. Production Compilation
```bash
npm run build
```

---

## 📦 Production Deployment Guide (Vercel & MongoDB Atlas)

### 1. MongoDB Atlas Setup
1. Create a MongoDB Atlas cluster (M0 free tier or M10+ dedicated).
2. Create a database user with read/write permissions to `pune_civic`.
3. In Network Access, allow IP `0.0.0.0/0` (standard for Vercel serverless function IPs).
4. Copy the connection string to `MONGODB_URI`.

### 2. Vercel Deployment
1. Connect the GitHub repository to Vercel.
2. In Project Settings $\rightarrow$ Environment Variables, populate all variables from `.env.example`.
3. Set the Framework Preset to **Next.js**.
4. Deploy the main branch.

### 3. Scheduled Cron Jobs
Add `vercel.json` to trigger scheduled SLA escalation checks every hour:
```json
{
  "crons": [
    {
      "path": "/api/cron/escalate",
      "schedule": "0 * * * *"
    }
  ]
}
```

### 4. Database Backups & Recovery
- **Atlas Continuous Backups:** Enable Point-in-Time Recovery (PITR) in MongoDB Atlas Cloud Backup.
- **Manual Snapshot:**
  ```bash
  mongodump --uri="<MONGODB_URI>" --out=./backups/$(date +%F)
  ```
- **Recovery:**
  ```bash
  mongorestore --uri="<MONGODB_URI>" ./backups/<date_folder>
  ```
