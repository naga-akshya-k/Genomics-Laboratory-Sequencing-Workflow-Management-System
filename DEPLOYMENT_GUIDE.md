# 🚀 Complete Deployment Guide: Genomics Laboratory Sequencing Workflow Management System

This guide provides step-by-step instructions to deploy this full-stack MERN application to the cloud with **MongoDB Atlas**.

---

## 📋 Table of Contents
1. [Step 1: Set Up MongoDB Atlas (Free Cloud Database)](#step-1-set-up-mongodb-atlas)
2. [Deployment Option A: Unified Full-Stack on Render (Recommended - Easiest & Free)](#deployment-option-a-unified-full-stack-on-render-recommended)
3. [Deployment Option B: Split Deployment (Backend on Render + Frontend on Vercel)](#deployment-option-b-split-deployment-backend-on-render--frontend-on-vercel)
4. [Deployment Option C: Railway](#deployment-option-c-railway)
5. [Pre-Seeded Demo Accounts & Verification](#pre-seeded-demo-accounts--verification)

---

## Step 1: Set Up MongoDB Atlas

1. **Sign up or Log in:**
   Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and log in.

2. **Create a Free Cluster:**
   - Click **Create Deployment** -> Select **M0 Free Tier**.
   - Choose your preferred cloud provider (AWS/Google Cloud) and region closest to you.
   - Click **Create**.

3. **Configure Database Access (User Credentials):**
   - In the left sidebar, navigate to **Security** -> **Database Access**.
   - Click **Add New Database User**.
   - Authentication Method: **Password**.
   - Set a Username (e.g. `genomics_admin`) and a secure Password (e.g. `GenomicsPass2026!`).
   - Database User Privileges: Select **Read and write to any database** (`Built-in Role`).
   - Click **Add User**.
   *(Note down your username and password)*.

4. **Configure Network Access (Firewall):**
   - In the left sidebar, navigate to **Security** -> **Network Access**.
   - Click **Add IP Address**.
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`).
   - Click **Confirm**. *(This is required so cloud hosting platforms like Render or Vercel can reach your database)*.

5. **Get Your Connection String:**
   - In the left sidebar, click **Database** -> **Clusters**.
   - Click **Connect** on your cluster.
   - Select **Drivers** (Node.js).
   - Copy the SRV connection string:
     ```
     mongodb+srv://genomics_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
     ```
   - Replace `<password>` with your actual password and specify the database name `genomics_workflow` before the `?`:
     ```
     mongodb+srv://genomics_admin:GenomicsPass2026!@cluster0.xxxxx.mongodb.net/genomics_workflow?retryWrites=true&w=majority
     ```

---

## Deployment Option A: Unified Full-Stack on Render (Recommended)

This option hosts both the React frontend and Express backend on a single free Render Web Service. It eliminates all cross-origin (CORS) and third-party cookie restrictions.

1. **Sign in to Render:**
   Go to [render.com](https://render.com) and sign in with your GitHub account.

2. **Create a New Web Service:**
   - Click **New +** -> **Web Service**.
   - Select **Build and deploy from a Git repository**.
   - Connect your GitHub repository:
     `https://github.com/naga-akshya-k/Genomics-Laboratory-Sequencing-Workflow-Management-System`

3. **Configure Service Settings:**
   - **Name:** `genomics-laboratory-system` (or your chosen name)
   - **Region:** Any (e.g., Oregon, Frankfurt, Singapore)
   - **Branch:** `main`
   - **Root Directory:** *(leave blank)*
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm run install:all && npm run build
     ```
   - **Start Command:**
     ```bash
     npm start
     ```
   - **Instance Type:** `Free`

4. **Add Environment Variables:**
   Under the **Environment Variables** section, add:
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` *(Render sets this automatically, but you can specify 10000)* |
   | `MONGODB_URI` | `mongodb+srv://genomics_admin:<password>@cluster0.xxxxx.mongodb.net/genomics_workflow?retryWrites=true&w=majority` |
   | `JWT_SECRET` | `genomics_super_secret_jwt_key_2026_workflow_mgmt_prod` |

5. **Deploy:**
   - Click **Create Web Service**.
   - Render will clone the repo, install dependencies across server and client, compile the React build into `client/dist`, connect to MongoDB Atlas, and run automatic database seeding.
   - When the logs show `Genomics Lab Server running on port ...`, your full app is live at `https://genomics-laboratory-system.onrender.com`!

---

## Deployment Option B: Split Deployment (Backend on Render + Frontend on Vercel)

If you prefer deploying the frontend and backend on separate specialized platforms:

### 1. Deploy Backend on Render:
1. In Render, click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure:
   - **Name:** `genomics-lab-backend`
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<Your MongoDB Atlas connection string>`
   - `JWT_SECRET`: `<Your JWT secret>`
   - `CLIENT_ORIGIN`: `https://your-frontend.vercel.app` *(update once Vercel is deployed)*
5. Click **Create Web Service**. Copy the backend URL (e.g. `https://genomics-lab-backend.onrender.com`).

---

### 2. Deploy Frontend on Vercel:
1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. Configure Project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and select `client`.
5. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://genomics-lab-backend.onrender.com` *(your backend URL)*
6. Click **Deploy**.
   - Vercel will build and deploy the React frontend.
   - Routing is automatically handled by `client/vercel.json` (no 404s on page refresh).

---

## Deployment Option C: Railway

1. Go to [railway.app](https://railway.app) and log in.
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select your repository.
4. Under **Variables**, add:
   - `MONGODB_URI`: `<Your MongoDB Atlas Connection String>`
   - `JWT_SECRET`: `<Your JWT secret>`
   - `NODE_ENV`: `production`
5. Railway will automatically detect `package.json`, run `npm run build`, and execute `npm start`.
6. Under **Settings** -> **Networking**, click **Generate Domain** to get your public live URL.

---

## 🧬 Pre-Seeded Demo Accounts & Verification

Upon first startup with MongoDB Atlas, the system detects an empty database and automatically runs the clinical workflow seeder:

### Verification Health Check:
Open in browser or curl:
`https://<your-app-domain>/api/v1/health`
Expected response:
```json
{
  "status": "online",
  "service": "Genomics Laboratory Workflow System API",
  "database": "connected",
  "environment": "production"
}
```

### Pre-Seeded Login Credentials:
| Role | Email | Password | Permissions |
|---|---|---|---|
| **System Admin** | `admin@genomicslab.org` | `Admin123!` | Executive dashboard, real-time analytics, user management |
| **Lab Staff** | `staff1@genomicslab.org` | `Staff123!` | Specimen intake, TapeStation QC, flowcell scheduling, report issuance |
| **Lab Staff** | `staff2@genomicslab.org` | `Staff123!` | Instrument telemetry, variant calling, bioinformatics |
| **Requester / Oncologist** | `requester1@genomicslab.org` | `Requester123!` | Submitting study requisitions, live stage tracking, PDF download |
| **Requester / Rare Disease** | `requester2@genomicslab.org` | `Requester123!` | Trio WGS tracking and clinical report access |

*(Quick 1-Click login buttons are also available on the Login screen).*
