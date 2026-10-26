const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Find local Chrome or Edge
const findBrowserPath = () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  if (fs.existsSync(chromePath)) return chromePath;
  if (fs.existsSync(edgePath)) return edgePath;
  throw new Error('Neither Chrome nor Edge executable found.');
};

async function capture() {
  const executablePath = findBrowserPath();
  console.log(`[Screenshot Tool] Using browser executable at: ${executablePath}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2, // High-resolution Retina quality for slides
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();

  try {
    // -------------------------------------------------------------
    // 1. SCREENSHOT 1: LOGIN PAGE (Slide 15 - Box 1)
    // -------------------------------------------------------------
    console.log('[1/9] Capturing Login Screen...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1000));
    const loginPath = path.join(SCREENSHOT_DIR, '01_login_screen.png');
    await page.screenshot({ path: loginPath });
    console.log(`Saved: ${loginPath}`);

    // -------------------------------------------------------------
    // 2. SCREENSHOT 2: ADMIN / ROLE-BASED DASHBOARD (Slide 15 - Box 2)
    // -------------------------------------------------------------
    console.log('[2/9] Logging in as Admin (Dr. Eleanor Vance)...');
    await page.evaluate(() => {
      // Find Admin demo fill button and click it
      const buttons = Array.from(document.querySelectorAll('button'));
      const adminBtn = buttons.find((b) => b.textContent.includes('Admin:') || b.textContent.includes('Eleanor'));
      if (adminBtn) adminBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));
    await page.click('button[type="submit"]');

    // Wait for redirect to /dashboard
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000)); // wait for Recharts animations to settle

    console.log('Capturing Role-based Dashboard...');
    const dashboardPath = path.join(SCREENSHOT_DIR, '02_role_based_dashboard.png');
    await page.screenshot({ path: dashboardPath });
    console.log(`Saved: ${dashboardPath}`);

    // -------------------------------------------------------------
    // 3. SCREENSHOT 3: REQUEST & STAGE TIMELINE (Slide 15 - Box 3)
    // -------------------------------------------------------------
    console.log('[3/9] Navigating to Requests...');
    await page.goto('http://localhost:5173/requests', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));

    // Click into first requisition
    await page.evaluate(() => {
      const row = document.querySelector('tbody tr');
      if (row) {
        const btn = row.querySelector('button');
        if (btn) btn.click();
        else row.click();
      }
    });
    await new Promise((r) => setTimeout(r, 1500));

    console.log('Capturing Request Detail & Stage Overview...');
    const requestDetailPath = path.join(SCREENSHOT_DIR, '03_request_detail.png');
    await page.screenshot({ path: requestDetailPath });
    console.log(`Saved: ${requestDetailPath}`);

    // Also navigate to sample detail to showcase the explicit StageTimeline
    console.log('[4/9] Navigating to Sample Detail with StageTimeline...');
    await page.goto('http://localhost:5173/samples', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));
    await page.evaluate(() => {
      const row = document.querySelector('tbody tr');
      if (row) {
        const btn = row.querySelector('button');
        if (btn) btn.click();
        else row.click();
      }
    });
    await new Promise((r) => setTimeout(r, 1500));

    const stageTimelinePath = path.join(SCREENSHOT_DIR, '04_request_and_stage_timeline.png');
    await page.screenshot({ path: stageTimelinePath });
    console.log(`Saved: ${stageTimelinePath}`);

    // -------------------------------------------------------------
    // 4. SCREENSHOT 4: REPORT DELIVERY (Slide 15 - Box 4)
    // -------------------------------------------------------------
    console.log('[5/9] Navigating to Reports List...');
    await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));

    const reportListPath = path.join(SCREENSHOT_DIR, '05_report_management.png');
    await page.screenshot({ path: reportListPath });
    console.log(`Saved: ${reportListPath}`);

    // Click into Report Detail preview
    console.log('[6/9] Capturing Report Detail preview with Delivery status...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('tbody tr button'));
      const viewBtn = buttons.find((b) => b.textContent.includes('View'));
      if (viewBtn) viewBtn.click();
      else {
        const firstRow = document.querySelector('tbody tr');
        if (firstRow) firstRow.click();
      }
    });
    await new Promise((r) => setTimeout(r, 1500));

    const reportDeliveryPath = path.join(SCREENSHOT_DIR, '06_report_delivery.png');
    await page.screenshot({ path: reportDeliveryPath });
    console.log(`Saved: ${reportDeliveryPath}`);

    // -------------------------------------------------------------
    // 5. ADDITIONAL MODULE SCREENSHOTS (For Reviewer & Slide 9 Wireframe/UI)
    // -------------------------------------------------------------
    console.log('[7/9] Capturing Quality Control Module...');
    await page.goto('http://localhost:5173/qc', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));
    const qcPath = path.join(SCREENSHOT_DIR, '07_quality_control.png');
    await page.screenshot({ path: qcPath });
    console.log(`Saved: ${qcPath}`);

    console.log('[8/9] Capturing Sequencing Runs Module...');
    await page.goto('http://localhost:5173/sequencing', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));
    const seqPath = path.join(SCREENSHOT_DIR, '08_sequencing_runs.png');
    await page.screenshot({ path: seqPath });
    console.log(`Saved: ${seqPath}`);

    console.log('[9/9] Capturing User Management (Admin RBAC)...');
    await page.goto('http://localhost:5173/admin/users', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));
    const usersPath = path.join(SCREENSHOT_DIR, '09_user_management_rbac.png');
    await page.screenshot({ path: usersPath });
    console.log(`Saved: ${usersPath}`);

    console.log('=============================================================');
    console.log('✅ ALL PRESENTATION SCREENSHOTS CAPTURED AT 2X HI-RES RETINA');
    console.log(`Folder: ${SCREENSHOT_DIR}`);
    console.log('=============================================================');
  } catch (err) {
    console.error('Error taking screenshots:', err);
  } finally {
    await browser.close();
  }
}

capture();
