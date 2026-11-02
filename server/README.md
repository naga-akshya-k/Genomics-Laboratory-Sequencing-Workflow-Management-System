# ⚙️ Backend API Server — Genomics Laboratory Workflow System

The backend is an enterprise-grade RESTful API built on **Node.js**, **Express.js**, and **MongoDB** using **Mongoose ODM**. It manages the end-to-end data lifecycle for clinical genomics, ensuring strict regulatory adherence to ISO 15189:2022 and 21 CFR Part 11 audit guidelines.

---

## 🛠️ Technology Stack

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js 4.19
- **Database & ODM:** MongoDB with Mongoose ODM (supports MongoDB Atlas and local instances)
- **Authentication:** JWT (JSON Web Tokens) with dual HTTP-Only cookies and Authorization Bearer header support
- **Password Security:** `bcryptjs` salted hashing
- **Input Validation:** `express-validator` request sanitization
- **File Handling:** `multer` (variant call files and attachments)
- **PDF Generation:** `pdfkit` (server-side clinical diagnostic genomics PDF compilation with digital signature hashes)
- **Interoperability:** HL7 FHIR-compliant JSON export for electronic health records (EHR) integration

---

## 📁 Directory Structure

```
server/
├── config/               # Database connection handlers (MongoDB Atlas + persistent local daemon)
│   └── db.js
├── controllers/          # Business logic and request handlers
│   ├── authController.js           # Login, registration, token issuance, session verification
│   ├── userController.js           # User management (CRUD, account activation/deactivation)
│   ├── requestController.js        # Clinical study requisition workflow & approval
│   ├── sampleController.js         # Specimen registration, barcode assignment, stage transitions
│   ├── qcController.js             # Fluorometric & TapeStation QC telemetry logging and gating
│   ├── sequencingController.js     # Flow cell batching, instrument selection, run execution
│   ├── analysisController.js       # Bioinformatic pipeline variant calling and metrics
│   ├── reportController.js         # Diagnostic PDF compilation, signing, and delivery
│   ├── dashboardController.js      # Executive KPIs, SLA turnaround times, stage counts
│   ├── notificationController.js   # Real-time event notifications for clinicians
│   ├── auditController.js          # ISO-15189 immutable audit log tracking
│   └── interoperabilityController.js # HL7 FHIR Genomics bundle exporter
├── middleware/           # Express middleware pipeline
│   ├── auth.js           # JWT verification (cookie + bearer token)
│   ├── rbac.js           # Role-Based Access Control gatekeeper
│   ├── validator.js      # Input validation & schema enforcement
│   ├── upload.js         # Multer multipart/form-data handler
│   └── errorHandler.js   # Centralized error handler with standardized JSON responses
├── models/               # Mongoose schemas & data validation
│   ├── User.js           # User account entity with bcrypt pre-save hooks
│   ├── Request.js        # Clinical study requisition document
│   ├── Sample.js         # Laboratory specimen milestone tracking entity
│   ├── QCRecord.js       # Nucleic acid quality metrics and threshold gating
│   ├── SequencingRun.js  # NextSeq / NovaSeq / PacBio flow cell batch
│   ├── AnalysisResult.js # Bioinformatics pipeline metrics & somatic variant records
│   ├── Report.js         # Clinical diagnostic report metadata & signed PDF link
│   ├── Notification.js   # Clinical alert records
│   └── AuditLog.js       # Immutable, cryptographically hashed compliance audit trail
├── routes/               # API route definitions mapped to /api/v1/*
├── seed/                 # Database seeder with realistic clinical genomics demo data
│   └── seed.js
├── uploads/              # Storage directory for compiled clinical PDF reports
│   └── reports/
├── utils/                # Utilities (PDF generator, ID generators, event logger)
│   ├── generatePdf.js    # PDFKit clinical genomics report compiler
│   ├── idGenerator.js    # Standardized barcode generators (SMP-*, REQ-*, RUN-*, REP-*)
│   └── eventLogger.js    # Automatic ISO-15189 audit trail logger
├── .env.example          # Environment variables template
└── server.js             # Express application entry point & production static server
```

---

## 🌐 API Route Specification

All endpoints are versioned under `/api/v1/`:

| Endpoint Prefix | Description | Access Level |
|---|---|---|
| `/api/v1/auth` | User login, registration, current profile (`/me`), logout | Public / Authenticated |
| `/api/v1/users` | Account management, role assignment, status toggling | Admin |
| `/api/v1/requests` | Requisition intake, priority flagging, review status | Requester / Staff / Admin |
| `/api/v1/samples` | Barcode assignment, specimen stage progression | Staff / Admin |
| `/api/v1/qc` | Metric recording (Concentration, A260/280, RIN), gating | Staff / Admin |
| `/api/v1/sequencing-runs` | Flowcell scheduling, lane batching, run telemetry | Staff / Admin |
| `/api/v1/analysis` | Variant analysis, GATK/Clair3 metrics, VCF ingestion | Staff / Admin |
| `/api/v1/reports` | PDF compilation, electronic signature, requester delivery | Authenticated |
| `/api/v1/dashboard` | Aggregated executive KPIs, study turnaround distribution | Authenticated |
| `/api/v1/notifications`| Clinical alerts and event polling | Authenticated |
| `/api/v1/audit-logs` | Cryptographic audit trail of all laboratory actions | Admin |
| `/api/v1/interop` | HL7 FHIR Genomics export, instrument CSV ingestion | Authenticated |
| `/api/v1/health` | System health check and database connectivity status | Public |

---

## 🚀 Running the Server

```bash
# Start server with nodemon auto-reload
npm run dev

# Start server in production mode
npm start

# Seed database with realistic clinical demo data
npm run seed
```
