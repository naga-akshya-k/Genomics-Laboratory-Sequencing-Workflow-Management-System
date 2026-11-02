# 🧬 Frontend Client — Genomics Laboratory Workflow System

The frontend is a modern, responsive Single Page Application (SPA) built using **React 18**, **Vite**, **Tailwind CSS**, and **Lucide React**. It provides laboratory personnel, clinicians, and administrators with intuitive interfaces to manage the full next-generation sequencing (NGS) clinical lifecycle.

---

## 🛠️ Technology Stack

- **Framework:** React 18
- **Build Tool:** Vite 5
- **Routing:** React Router v6 (Nested routes, layout guards, and role-based protected routes)
- **Styling:** Tailwind CSS, PostCSS, Autoprefixer
- **State Management & Context:** React Context API (`AuthContext`, `ToastContext`)
- **Data Visualization:** Recharts (Turnaround time distribution, monthly study metrics, stage status pie charts)
- **HTTP Client:** Axios with custom interceptors for dual-channel authentication (Bearer JWT + HTTP-Only session cookies)
- **Icons:** Lucide React

---

## 📁 Architecture & Directory Structure

```
client/src/
├── api/                  # Modular Axios API wrappers (auth, requests, samples, qc, sequencing, reports, interop)
│   ├── client.js         # Base Axios instance with dynamic base URL & Bearer token interceptor
│   ├── authApi.js        # Authentication endpoints (login, register, me, logout)
│   ├── requestsApi.js    # Study requisition management
│   ├── samplesApi.js     # Specimen intake and barcode tracking
│   ├── qcApi.js          # Fluorometric & TapeStation QC telemetry
│   ├── sequencingApi.js  # Flow cell batching and run scheduling
│   ├── analysisApi.js    # Bioinformatics variant calling and VCF imports
│   ├── reportsApi.js     # PDF report generation, signing, and delivery
│   └── interopApi.js     # HL7 FHIR export & ISO-15189 audit trail
├── components/           # Reusable atomic UI components
│   ├── Button.jsx        # Styled variant buttons (primary, secondary, danger, outline)
│   ├── Card.jsx          # Dashboard and module containers
│   ├── DataTable.jsx     # Sortable, paginated data table component
│   ├── Input.jsx         # Form inputs with validation labels
│   ├── Layout.jsx        # Topbar + collapsible sidebar layout shell
│   ├── Modal.jsx         # Accessible modal dialogs
│   ├── ProtectedRoute.jsx# Role-Based Access Control route guard
│   ├── StageTimeline.jsx # Visual 6-stage clinical milestone tracker
│   ├── StatCard.jsx      # KPI statistics widget
│   └── StatusBadge.jsx   # Clinical status pills (Pass, Fail, In Progress, Approved)
├── context/              # Global React Context providers
│   ├── AuthContext.jsx   # User authentication state, login/logout actions, RBAC checks
│   └── ToastContext.jsx  # Non-blocking feedback toast notifications
├── pages/                # Page route views
│   ├── admin/            # User Management, ISO-15189 Audit Trail, Turnaround Time Analytics
│   ├── analysis/         # Bioinformatics pipeline results & VCF variant lists
│   ├── auth/             # Login and Registration interfaces (with 1-click demo fills)
│   ├── dashboard/        # Executive analytics dashboard & action queues
│   ├── qc/               # Specimen quality control intake & metric gating
│   ├── reports/          # Clinical diagnostic reports list, generator, & verified PDF viewer
│   ├── requests/         # Study requisitions submission and approval
│   └── samples/          # Specimen barcode registration and milestone tracker
├── App.jsx               # Application route definitions & route providers
└── main.jsx              # DOM entry point and React root mounting
```

---

## 🔒 Role-Based Access Control (RBAC) in UI

The client enforces role-based permissions at the routing level via `<ProtectedRoute>`:
- **Admin:** Access to Dashboard, Requisitions, Samples, QC, Sequencing, Analysis, Reports, User Management, Audit Logs, and Analytics.
- **Lab Staff:** Access to operational modules (Requisitions, Specimen Intake, QC Gating, Sequencing Scheduling, Analysis, and Report Delivery).
- **Requester (Investigator/Oncologist):** Confined to submitting requisitions, tracking assigned specimen milestone progress, and downloading delivered clinical PDF reports.

---

## ⚡ Development & Build Scripts

From the repository root or inside `client/`:
```bash
# Start local Vite development server (http://localhost:5173)
npm run dev

# Compile optimized production bundle to dist/
npm run build

# Preview production build locally
npm run preview
```
