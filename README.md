# 🧬 Genomics Laboratory Sequencing Workflow Management System

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live_App-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://genomics-laboratory-sequencing-workflow.onrender.com)
[![Database](https://img.shields.io/badge/Database-MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Frontend](https://img.shields.io/badge/Frontend-React_18_%26_Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Node.js_%26_Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Styling](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](./LICENSE)

**A centralized, production-grade MERN stack clinical platform that tracks the complete next-generation sequencing (NGS) lifecycle — from an investigator's initial requisition, through specimen intake, quality control (QC), sequencing flowcell batching, and bioinformatic variant calling, to a verified downloadable clinical PDF report.**

[🌐 Explore the Live Application](https://genomics-laboratory-sequencing-workflow.onrender.com) • [📖 Deployment Guide](./DEPLOYMENT_GUIDE.md) • [💻 Client Docs](./client/README.md) • [⚙️ Server Docs](./server/README.md)

</div>

---

## 🌟 Key System Capabilities

- **Complete 6-Stage NGS Lifecycle Tracking:** Real-time progression across:
  `[1. Registered] ➔ [2. Quality Control] ➔ [3. Sequencing] ➔ [4. Bioinformatics Analysis] ➔ [5. Report Ready] ➔ [6. Delivered]`
- **Fluorometric & Microfluidic Quality Control:** Records concentration ($ng/\mu L$), $A_{260}/A_{280}$ and $A_{260}/A_{230}$ ratios, and Agilent TapeStation RNA/DNA Integrity Numbers (RIN/DIN) with automated pass/fail gating.
- **Instrument Flowcell Scheduling & Lane Batching:** Coordinates Illumina NovaSeq 6000, NextSeq 2000, and PacBio Sequel IIe sequencing runs with automated barcode indexing and target coverage telemetry.
- **Automated Clinical PDF Report Generator:** Server-side PDF generation using PDFKit featuring institution headers, sample metrics, somatic/germline variant tables, and cryptographic electronic signatures (ISO-15189 compliance).
- **HL7 FHIR Interoperability:** Generates standardized HL7 FHIR Genomics JSON bundles for Electronic Health Record (EHR) integration.
- **Role-Based Access Control (RBAC):** Three discrete clinical roles (Administrator, Lab Staff, Clinician/Requester) with granular permission guards.
- **21 CFR Part 11 & ISO 15189:2022 Cryptographic Audit Trail:** Immutable event logger tracking every record modification, timestamp, user ID, and IP address.

---

## 🔬 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, React Router v6, Tailwind CSS, Recharts, Lucide React, Axios |
| **Backend** | Node.js, Express.js 4.19, JWT Authentication, bcryptjs, Express-Validator, Morgan |
| **Database** | MongoDB with Mongoose ODM (Cloud MongoDB Atlas + local daemon) |
| **Document Engine** | PDFKit (server-side clinical report compilation with digital signature hashes) |
| **Interoperability**| HL7 FHIR Genomics JSON Schema specification |
| **DevOps & Cloud** | Render Web Services, GitHub Actions CI, Vercel SPA routing |

---

## 👥 Demo User Logins (Role-Based Access Control)

The system comes pre-seeded with realistic clinical workflow data and multi-role demo accounts. Quick **1-Click Fill** buttons are also available directly on the login screen.

| Role | Name | Email | Password | Permissions & Clinical Scope |
|---|---|---|---|---|
| **System Admin** | Dr. Eleanor Vance | `admin@genomicslab.org` | `Admin123!` | System director; full administrative access, user management, executive analytics, and audit trail. |
| **Lab Staff** | Sarah Lin, M.S. | `staff1@genomicslab.org` | `Staff123!` | Review requisitions, register specimens, log QC telemetry, schedule sequencing runs, compile diagnostic reports. |
| **Lab Staff (Bioinfo)** | Marcus Brody | `staff2@genomicslab.org` | `Staff123!` | Instrument telemetry ingestion, somatic variant analysis, and bioinformatic QC. |
| **Requester (Oncology)** | Dr. Alexander Hayes | `requester1@genomicslab.org` | `Requester123!` | Submit requisitions, monitor specimen milestones, and download verified clinical PDF reports. |
| **Requester (Genetics)** | Dr. Priya Nair | `requester2@genomicslab.org` | `Requester123!` | Rare disease investigator; monitors trio WGS requisitions and downloads verified reports. |
| **Requester (Pathology)**| Dr. Carlos Mendez | `requester3@genomicslab.org` | `Requester123!` | Molecular pathologist; tracks FFPE and metagenomic liquid biopsy requisitions. |

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v20 and v24)
- **npm** v9+

### 2. Installation
Clone the repository and install all dependencies across root, server, and client:
```bash
git clone https://github.com/naga-akshya-k/Genomics-Laboratory-Sequencing-Workflow-Management-System.git
cd Genomics-Laboratory-Sequencing-Workflow-Management-System
npm run install:all
```

### 3. Environment Setup
Copy the example environment template in `server/`:
```bash
cp server/.env.example server/.env
```
*(The server defaults to port `5000` and automatically connects to MongoDB Atlas or local persistent storage).*

### 4. Database Seeding (Optional)
Populate realistic clinical demo data (specimens across all 6 stages, QC metrics, flowcell runs, analysis results, and PDF reports):
```bash
npm run seed
```
*(Note: The server also auto-seeds automatically on first boot if the database is empty).*

### 5. Run the Application
Start both the backend API server and frontend client concurrently:
```bash
npm run dev
```

- **Client Application:** `http://localhost:5173`
- **Backend API Server:** `http://localhost:5000/api/v1`
- **Health Check Endpoint:** `http://localhost:5000/api/v1/health`

---

## 🌐 Production Cloud Deployment (MongoDB Atlas & Render)

For full step-by-step instructions on deploying the frontend and backend with MongoDB Atlas, refer to:
👉 **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**

---

## 🏛️ System Architecture

```
                               ┌───────────────────────────┐
                               │   React 18 Single-Page    │
                               │     Application (UI)      │
                               │  Vite + Tailwind + Charts │
                               └─────────────┬─────────────┘
                                             │  HTTP/JSON (Axios)
                                             │  Dual-Auth (Bearer + Cookies)
                                             ▼
                               ┌───────────────────────────┐
                               │   Node.js / Express API   │
                               │  Role-Based Access (RBAC) │
                               └──────┬─────────────┬──────┘
                                      │             │
                Mongoose ODM          │             │  PDFKit Generator
                Persistent Connection │             │  Digital Signatures
                                      ▼             ▼
                        ┌──────────────────┐   ┌──────────────────┐
                        │  MongoDB Atlas   │   │  Clinical PDFs   │
                        │  Cloud Database  │   │  & FHIR Bundles  │
                        └──────────────────┘   └──────────────────┘
```

---

## 📜 License

This project is licensed under the [MIT License](./LICENSE) — free to use, study, and modify.
