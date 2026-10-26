# Genomics Laboratory Sequencing Workflow Management System

A centralized, production-quality MERN stack web platform that tracks a clinical genomics laboratory's complete next-generation sequencing (NGS) lifecycle — from an investigator's initial requisition, through specimen intake, quality control (QC), sequencing flowcell runs, and bioinformatic variant calling, to a verified downloadable clinical PDF report.

---

## 🔬 Tech Stack

- **Frontend:** React 18, Vite, React Router v6, Tailwind CSS, Axios, Lucide React, Recharts
- **Backend:** Node.js, Express.js, JWT Authentication (httpOnly cookies), bcryptjs, Custom RBAC Middleware
- **Database:** MongoDB with Mongoose ODM (includes embedded MongoMemoryServer fallback for instant zero-config startup)
- **File Handling & PDF:** Multer (bioinformatics result uploads), PDFKit (server-side clinical genomics PDF report generator)
- **Tooling:** dotenv, express-validator, morgan, cors, cookie-parser, concurrently

---

## 👥 Demo User Logins (Role-Based Access Control)

The system comes pre-seeded with realistic clinical workflow data and multi-role demo accounts. Quick 1-click fill buttons are also available on the Login screen.

| Role | Name | Email | Password | Permissions |
|---|---|---|---|---|
| **Admin** | Dr. Eleanor Vance | `admin@genomicslab.org` | `Admin123!` | System director; full access to all modules, charts, reports, and User Management (create/edit/deactivate accounts). |
| **Lab Staff** | Sarah Lin, M.S. | `staff1@genomicslab.org` | `Staff123!` | Review requisitions, register specimens, log fluorometric QC, schedule sequencing runs, log variant analysis, compile and deliver reports. |
| **Lab Staff** | Marcus Brody | `staff2@genomicslab.org` | `Staff123!` | Operates sequencing instruments, records TapeStation / QC, performs GATK/Clair3 bioinformatics analysis. |
| **Requester** | Dr. Alexander Hayes | `requester1@genomicslab.org` | `Requester123!` | Researcher/Oncologist; submit requisitions, track specimen progress timelines, view and download delivered clinical PDF reports. |
| **Requester** | Dr. Priya Nair | `requester2@genomicslab.org` | `Requester123!` | Rare disease investigator; monitors trio WGS requisitions and downloads verified reports. |
| **Requester** | Dr. Carlos Mendez | `requester3@genomicslab.org` | `Requester123!` | Molecular pathologist; tracks FFPE and metagenomic liquid biopsy requisitions. |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **npm** v9+
- Optional: MongoDB running locally or on Atlas. *(Note: If MongoDB is not running locally, the server automatically starts an embedded in-memory MongoDB instance with zero manual setup required).*

### 2. Installation
From the root directory, install all dependencies across root, server, and client:
```bash
npm run install:all
```
*(Or install individually)*:
```bash
npm install
cd server && npm install
cd ../client && npm install
```

### 3. Environment Configuration
Verify or create `server/.env` (a ready-to-use template is in `server/.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/genomics_workflow
JWT_SECRET=genomics_super_secret_jwt_key_2026_workflow_mgmt
CLIENT_ORIGIN=http://localhost:5173
```

### 4. Database Seeding (Demo Data)
Populate realistic demo records (users, requests, specimens across all 6 stages, QC metrics, flowcell runs, analysis records, and pre-compiled PDF files on disk):
```bash
npm run seed
```
*(Alternatively: `cd server && npm run seed`)*

> **Note:** The server also features auto-seeding on startup if it detects an empty database.

### 5. Running the Application
To run both backend API server and frontend client concurrently:
```bash
npm run dev
```

- **Client:** `http://localhost:5173`
- **API Server:** `http://localhost:5000/api/v1`
- **Health Check:** `http://localhost:5000/api/v1/health`

---

## 🧬 End-to-End Workflow Demonstration

To test the complete clinical sequencing lifecycle without touching the database:

1. **Log in as Requester (`requester1@genomicslab.org`)**:
   - Go to **New Requisition** (`/requests/new`).
   - Submit a study (e.g., *"Targeted cfDNA Deep Panel"*, Sample Type: *Blood*, Priority: *Urgent*).
   - View your requisition in **My Requests** with status pill `Submitted`.

2. **Log in as Lab Staff (`staff1@genomicslab.org`)**:
   - Open **Dashboard** — see the new requisition appearing in the **Requisitions to Review** actionable queue.
   - Click the requisition and click **Update Review Status** -> change to `Approved`.
   - Click **Register Specimen** to assign barcode (e.g., `SMP-2026-0013`).
   - Navigate to **Quality Control** (`/qc`) and click **Log Quality Control**:
     - Select the specimen.
     - Enter Concentration (e.g. `45.2 ng/µL`), Purity A260/280 (`1.85`), A260/230 (`2.10`), Volume (`30 µL`), Integrity RIN (`8.9`), and Outcome `Pass`.
     - Specimen stage advances to `QC`.
   - Navigate to **Sequencing Runs** (`/sequencing`) and click **Schedule Sequencing Run**:
     - Platform: `Illumina NovaSeq`, Application: `WES`, Coverage: `100x`.
     - Check the checkbox for the specimen to batch it into the run.
     - Once scheduled, mark status `Completed`. Specimen stage advances to `Analysis`.
   - Navigate to **Bioinformatics** (`/analysis`) and click **Record Analysis**:
     - Pipeline: `BWA-MEM + GATK Mutect2`, Reference: `GRCh38`.
     - Enter clinical findings and attach a file (optional).
     - Specimen stage advances to `Report Ready`.
   - Navigate to **Reports** (`/reports`) and click **Generate Clinical Report**:
     - Select the requisition and specimen, enter molecular summary, and click **Compile & Save Report PDF**.
     - PDFKit automatically creates the official PDF document on the server.
     - Click **Deliver to Requester**. Specimen advances to `Delivered`.

3. **Log back in as Requester (`requester1@genomicslab.org`)**:
   - Open **Delivered Reports** (`/reports`).
   - Click **PDF** or **Download Official PDF** on the report card.
   - The verified clinical genomics PDF report will immediately download to your browser!

4. **Log in as Admin (`admin@genomicslab.org`)**:
   - View executive dashboard charts (Requisitions over 6 months with Recharts, specimen stage breakdown).
   - Open **User Management** (`/admin/users`) to provision staff, reassign roles, or deactivate/activate accounts.

---

## 🗄️ System Architecture & Data Models

```
┌─────────────────────────────────────────────────────────────┐
│                       React 18 + Vite                       │
│  (Tailwind CSS, Lucide Icons, Recharts, Context Auth & Toast)│
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / withCredentials: true
┌──────────────────────────────▼──────────────────────────────┐
│                  Express.js REST API (/api/v1)              │
│       ├── JWT Auth Middleware (httpOnly Cookies)            │
│       ├── Custom RBAC Middleware (admin, staff, requester)  │
│       ├── Multer File Uploads (/uploads/analysis)           │
│       └── PDFKit Clinical Report Generator                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Mongoose ODM
┌──────────────────────────────▼──────────────────────────────┐
│                          MongoDB                            │
│  ├── Users           ├── QCRecords      ├── Reports         │
│  ├── Requests        ├── SequencingRuns                     │
│  └── Samples         ├── AnalysisResults                    │
└─────────────────────────────────────────────────────────────┘
```

### Specimen Stage Pipeline
```
[1. Registered] ──► [2. QC] ──► [3. Sequencing] ──► [4. Analysis] ──► [5. Report Ready] ──► [6. Delivered]
```

---

## 🛡️ Security Features
- **Passwords:** Hashed with `bcryptjs` (salt rounds ≥ 10). `passwordHash` is excluded from all API responses and transforms.
- **Tokens:** Signed with JWT (7-day duration), delivered in `httpOnly`, `sameSite: 'lax'` cookies.
- **RBAC:** Enforced route-by-route at the controller/middleware level (`requireRole(['admin', 'lab_staff'])`).
- **Data Scoping:** Requesters are strictly confined to their own requisitions, samples, and delivered reports.
- **Validation:** Input payload validation using `express-validator` with structured 400 responses.
