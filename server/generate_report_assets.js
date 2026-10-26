const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');
const ASSETS_DIR = path.join(__dirname, '..', 'report_assets');

if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

const findBrowserPath = () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  if (fs.existsSync(chromePath)) return chromePath;
  if (fs.existsSync(edgePath)) return edgePath;
  throw new Error('Neither Chrome nor Edge executable found.');
};

async function generateAssets() {
  const executablePath = findBrowserPath();
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    // 1. Capture Requisition Intake Form (/requests/new)
    console.log('[1/4] Capturing Requisition Intake Form...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const reqBtn = buttons.find((b) => b.textContent.includes('Requester:') || b.textContent.includes('Priya') || b.textContent.includes('Alexander'));
      if (reqBtn) reqBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));

    await page.goto('http://localhost:5173/requests/new', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500));
    const formPath = path.join(SCREENSHOT_DIR, '03_requisition_form.png');
    await page.screenshot({ path: formPath });
    console.log(`Saved: ${formPath}`);

    // 2. Generate System Architecture Diagram
    console.log('[2/4] Generating System Architecture Diagram...');
    const archHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 30px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #ffffff; color: #1e293b; }
    .title { text-align: center; font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .subtitle { text-align: center; font-size: 13px; color: #64748b; margin-bottom: 24px; font-weight: 500; }
    .layer { border-radius: 10px; padding: 14px 18px; margin-bottom: 16px; border: 1.5px solid; position: relative; }
    .layer-header { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
    .grid { display: grid; gap: 12px; }
    .cols-3 { grid-template-columns: repeat(3, 1fr); }
    .cols-4 { grid-template-columns: repeat(4, 1fr); }
    .cols-2 { grid-template-columns: repeat(2, 1fr); }
    .card { background: #ffffff; border-radius: 8px; padding: 10px 12px; border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .card-title { font-size: 12px; font-weight: 700; margin-bottom: 4px; color: #0f172a; }
    .card-desc { font-size: 10.5px; color: #475569; line-height: 1.4; }
    .card-desc ul { margin: 4px 0 0 14px; padding: 0; }
    .card-desc li { margin-bottom: 2px; }

    /* Layer Colors */
    .layer-1 { background: #f0fdf4; border-color: #86efac; }
    .layer-1 .layer-header { color: #15803d; }
    .layer-2 { background: #eff6ff; border-color: #93c5fd; }
    .layer-2 .layer-header { color: #1d4ed8; }
    .layer-3 { background: #faf5ff; border-color: #d8b4fe; }
    .layer-3 .layer-header { color: #6b21a8; }
    .layer-4 { background: #fffbeb; border-color: #fde68a; }
    .layer-4 .layer-header { color: #b45309; }

    .connector { text-align: center; color: #94a3b8; font-size: 16px; font-weight: bold; margin: -10px 0 6px 0; }
  </style>
</head>
<body>
  <div class="title">Genomics Laboratory Sequencing Workflow System — Architecture</div>
  <div class="subtitle">Complete 4-Tier Full-Stack MERN Architecture with Custom RBAC and ISO-15189 Clinical Compliance</div>

  <!-- LAYER 1: CLIENT PRESENTATION LAYER -->
  <div class="layer layer-1">
    <div class="layer-header">
      <span>1. Client Presentation Layer (React 18 Single Page Application)</span>
      <span>Vite Build &bull; Tailwind CSS &bull; React Router 6</span>
    </div>
    <div class="grid cols-3">
      <div class="card">
        <div class="card-title">Clinician Portal (Requester)</div>
        <div class="card-desc">
          <ul>
            <li>Clinical Requisition Submission</li>
            <li>Specimen Milestone Timeline</li>
            <li>Direct PDF Report Download</li>
          </ul>
        </div>
      </div>
      <div class="card">
        <div class="card-title">Laboratory Workstation (Staff)</div>
        <div class="card-desc">
          <ul>
            <li>Request Review & Specimen Intake</li>
            <li>Fluorometric TapeStation QC Entry</li>
            <li>NovaSeq Batch Flowcell Manager</li>
            <li>Bioinformatics Analysis Upload</li>
          </ul>
        </div>
      </div>
      <div class="card">
        <div class="card-title">Administrative Dashboard (Admin)</div>
        <div class="card-desc">
          <ul>
            <li>Recharts Workflow Analytics</li>
            <li>Role-Based Personnel Management</li>
            <li>Throughput & Bottleneck Monitoring</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <div class="connector">&darr; Secure HTTP / JSON API &bull; JWT Authentication (httpOnly Cookies & Bearer Tokens) &darr;</div>

  <!-- LAYER 2: BACKEND API & MIDDLEWARE -->
  <div class="layer layer-2">
    <div class="layer-header">
      <span>2. Backend API &amp; Security Pipeline (Node.js &amp; Express 4)</span>
      <span>RESTful Architecture &bull; Custom Middlewares</span>
    </div>
    <div class="grid cols-4">
      <div class="card">
        <div class="card-title">JWT Auth Middleware</div>
        <div class="card-desc">Validates token signature, restores session from cookies/Bearer header.</div>
      </div>
      <div class="card">
        <div class="card-title">RBAC Authorization</div>
        <div class="card-desc">Strict role guards enforcing Admin vs Staff vs Requester data isolation.</div>
      </div>
      <div class="card">
        <div class="card-title">Input Sanitization</div>
        <div class="card-desc">Express-validator checking required fields, enums, numbers, and MongoIds.</div>
      </div>
      <div class="card">
        <div class="card-title">Multer Storage Engine</div>
        <div class="card-desc">Handles secure multipart uploads for BAM/VCF bioinformatics artifacts.</div>
      </div>
    </div>
  </div>

  <div class="connector">&darr; Modular Controller Invocations &bull; Automated Lifecycle State Machine &darr;</div>

  <!-- LAYER 3: BUSINESS LOGIC & CORE SERVICES -->
  <div class="layer layer-3">
    <div class="layer-header">
      <span>3. Business Logic &amp; Clinical Workflow Controllers</span>
      <span>6-Stage Lifecycle State Machine &bull; ISO-15189 Standards</span>
    </div>
    <div class="grid cols-3">
      <div class="card">
        <div class="card-title">Intake &amp; Accessioning Engine</div>
        <div class="card-desc">Auto-generates sequential codes (REQ-2026-XXXX, SMP-2026-XXXX) with collision lock.</div>
      </div>
      <div class="card">
        <div class="card-title">Quality Control &amp; Batching</div>
        <div class="card-desc">Validates A260/280, A260/230, and DIN/RIN. Multi-specimen array multiplexing for Illumina flowcells.</div>
      </div>
      <div class="card">
        <div class="card-title">PDFKit Clinical Compiler</div>
        <div class="card-desc">Programmatically renders ISO-15189 PDF reports with QC metrics, flowcell runs, and signature seals.</div>
      </div>
    </div>
  </div>

  <div class="connector">&darr; Mongoose ODM Schemas &bull; Normalized ObjectId Relational References &bull; Aggregations &darr;</div>

  <!-- LAYER 4: DATABASE & STORAGE -->
  <div class="layer layer-4">
    <div class="layer-header">
      <span>4. Database &amp; Persistent Storage Layer (MongoDB &amp; Server File System)</span>
      <span>Mongoose ODM &bull; 7 Core Collections</span>
    </div>
    <div class="grid cols-4">
      <div class="card">
        <div class="card-title">Users &amp; Requisitions</div>
        <div class="card-desc"><code>User</code> (roles, bcrypt)<br><code>Request</code> (priorities, clinical notes)</div>
      </div>
      <div class="card">
        <div class="card-title">Specimens &amp; QC</div>
        <div class="card-desc"><code>Sample</code> (6-stage milestone enum)<br><code>QCRecord</code> (fluorometric metrics)</div>
      </div>
      <div class="card">
        <div class="card-title">Sequencing &amp; Analysis</div>
        <div class="card-desc"><code>SequencingRun</code> (flowcell batches)<br><code>AnalysisResult</code> (BWA, GATK)</div>
      </div>
      <div class="card">
        <div class="card-title">Reports &amp; Disk Storage</div>
        <div class="card-desc"><code>Report</code> (delivered status)<br><code>/uploads/reports/</code> (compiled PDFs)</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    await page.setContent(archHtml, { waitUntil: 'load' });
    const archPath = path.join(ASSETS_DIR, '01_system_architecture.png');
    await page.screenshot({ path: archPath, fullPage: true });
    console.log(`Saved: ${archPath}`);

    // 3. Generate UML Class Diagram
    console.log('[3/4] Generating UML Class Diagram...');
    const classHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 25px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #ffffff; color: #0f172a; }
    .title { text-align: center; font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { text-align: center; font-size: 13px; color: #64748b; margin-bottom: 24px; font-weight: 500; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
    .class-box { border: 1.5px solid #334155; border-radius: 6px; background: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; }
    .class-name { background: #1e293b; color: #ffffff; font-weight: 700; text-align: center; padding: 7px; font-size: 13px; letter-spacing: 0.5px; }
    .class-section { padding: 8px 10px; font-size: 11px; line-height: 1.4; border-bottom: 1px solid #cbd5e1; font-family: "Courier New", monospace; }
    .class-section:last-child { border-bottom: none; background: #f8fafc; font-family: -apple-system, sans-serif; }
    .field-name { color: #0f172a; font-weight: 600; }
    .field-type { color: #0284c7; }
    .method-name { color: #15803d; font-weight: 600; }

    /* Custom Header Accents */
    .c-user .class-name { background: #2563eb; }
    .c-req .class-name { background: #0891b2; }
    .c-smp .class-name { background: #059669; }
    .c-qc .class-name { background: #d97706; }
    .c-seq .class-name { background: #7c3aed; }
    .c-ana .class-name { background: #db2777; }
    .c-rep .class-name { background: #dc2626; }
  </style>
</head>
<body>
  <div class="title">Genomics Laboratory Sequencing Workflow — UML Class Diagram</div>
  <div class="subtitle">Structural Data Model &amp; Domain Entities with Attributes, Relational References, and Methods</div>

  <div class="grid">
    <!-- User -->
    <div class="class-box c-user">
      <div class="class-name">User</div>
      <div class="class-section">
        + <span class="field-name">_id</span>: <span class="field-type">ObjectId</span><br>
        + <span class="field-name">name</span>: <span class="field-type">String</span><br>
        + <span class="field-name">email</span>: <span class="field-type">String [unique]</span><br>
        + <span class="field-name">passwordHash</span>: <span class="field-type">String</span><br>
        + <span class="field-name">role</span>: <span class="field-type">RoleEnum</span><br>
        + <span class="field-name">organization</span>: <span class="field-type">String</span><br>
        + <span class="field-name">isActive</span>: <span class="field-type">Boolean</span>
      </div>
      <div class="class-section">
        + <span class="method-name">comparePassword()</span><br>
        + <span class="method-name">generateJWT()</span><br>
        + <span class="method-name">deactivateAccount()</span>
      </div>
    </div>

    <!-- Request -->
    <div class="class-box c-req">
      <div class="class-name">Request</div>
      <div class="class-section">
        + <span class="field-name">_id</span>: <span class="field-type">ObjectId</span><br>
        + <span class="field-name">requestCode</span>: <span class="field-type">String [unique]</span><br>
        + <span class="field-name">requester</span>: <span class="field-type">ObjectId &rarr; User</span><br>
        + <span class="field-name">title</span>: <span class="field-type">String</span><br>
        + <span class="field-name">sampleType</span>: <span class="field-type">TypeEnum</span><br>
        + <span class="field-name">priority</span>: <span class="field-type">PriorityEnum</span><br>
        + <span class="field-name">status</span>: <span class="field-type">StatusEnum</span><br>
        + <span class="field-name">reviewedBy</span>: <span class="field-type">ObjectId &rarr; User</span>
      </div>
      <div class="class-section">
        + <span class="method-name">createRequest()</span><br>
        + <span class="method-name">updateReviewStatus()</span><br>
        + <span class="method-name">generateRequestCode()</span>
      </div>
    </div>

    <!-- Sample -->
    <div class="class-box c-smp">
      <div class="class-name">Sample</div>
      <div class="class-section">
        + <span class="field-name">_id</span>: <span class="field-type">ObjectId</span><br>
        + <span class="field-name">sampleCode</span>: <span class="field-type">String [unique]</span><br>
        + <span class="field-name">request</span>: <span class="field-type">ObjectId &rarr; Request</span><br>
        + <span class="field-name">sampleType</span>: <span class="field-type">String</span><br>
        + <span class="field-name">collectionDate</span>: <span class="field-type">Date</span><br>
        + <span class="field-name">receivedDate</span>: <span class="field-type">Date</span><br>
        + <span class="field-name">currentStage</span>: <span class="field-type">StageEnum</span><br>
        + <span class="field-name">registeredBy</span>: <span class="field-type">ObjectId &rarr; User</span>
      </div>
      <div class="class-section">
        + <span class="method-name">registerSample()</span><br>
        + <span class="method-name">advanceStage()</span><br>
        + <span class="method-name">getMilestoneProgress()</span>
      </div>
    </div>

    <!-- QCRecord -->
    <div class="class-box c-qc">
      <div class="class-name">QCRecord</div>
      <div class="class-section">
        + <span class="field-name">_id</span>: <span class="field-type">ObjectId</span><br>
        + <span class="field-name">sample</span>: <span class="field-type">ObjectId &rarr; Sample</span><br>
        + <span class="field-name">concentrationNgUl</span>: <span class="field-type">Number</span><br>
        + <span class="field-name">purity260_280</span>: <span class="field-type">Number</span><br>
        + <span class="field-name">purity260_230</span>: <span class="field-type">Number</span><br>
        + <span class="field-name">volumeUl</span>: <span class="field-type">Number</span><br>
        + <span class="field-name">integrityNumber</span>: <span class="field-type">Number</span><br>
        + <span class="field-name">result</span>: <span class="field-type">QCEnum</span>
      </div>
      <div class="class-section">
        + <span class="method-name">recordMetrics()</span><br>
        + <span class="method-name">evaluatePassThreshold()</span><br>
        + <span class="method-name">triggerStageAdvance()</span>
      </div>
    </div>

    <!-- SequencingRun -->
    <div class="class-box c-seq">
      <div class="class-name">SequencingRun</div>
      <div class="class-section">
        + <span class="field-name">_id</span>: <span class="field-type">ObjectId</span><br>
        + <span class="field-name">runCode</span>: <span class="field-type">String [unique]</span><br>
        + <span class="field-name">samples</span>: <span class="field-type">[ObjectId &rarr; Sample]</span><br>
        + <span class="field-name">platform</span>: <span class="field-type">PlatformEnum</span><br>
        + <span class="field-name">runType</span>: <span class="field-type">RunTypeEnum</span><br>
        + <span class="field-name">readLength</span>: <span class="field-type">String</span><br>
        + <span class="field-name">targetCoverage</span>: <span class="field-type">Number</span><br>
        + <span class="field-name">status</span>: <span class="field-type">RunStatusEnum</span>
      </div>
      <div class="class-section">
        + <span class="method-name">scheduleFlowcellRun()</span><br>
        + <span class="method-name">batchSamples()</span><br>
        + <span class="method-name">updateRunStatus()</span>
      </div>
    </div>

    <!-- AnalysisResult -->
    <div class="class-box c-ana">
      <div class="class-name">AnalysisResult</div>
      <div class="class-section">
        + <span class="field-name">_id</span>: <span class="field-type">ObjectId</span><br>
        + <span class="field-name">sample</span>: <span class="field-type">ObjectId &rarr; Sample</span><br>
        + <span class="field-name">sequencingRun</span>: <span class="field-type">ObjectId &rarr; Run</span><br>
        + <span class="field-name">pipeline</span>: <span class="field-type">String</span><br>
        + <span class="field-name">referenceGenome</span>: <span class="field-type">String</span><br>
        + <span class="field-name">status</span>: <span class="field-type">AnalysisStatusEnum</span><br>
        + <span class="field-name">resultSummary</span>: <span class="field-type">String</span><br>
        + <span class="field-name">resultFilePath</span>: <span class="field-type">String</span>
      </div>
      <div class="class-section">
        + <span class="method-name">executeVariantCalling()</span><br>
        + <span class="method-name">uploadResultBAM()</span><br>
        + <span class="method-name">summarizeFindings()</span>
      </div>
    </div>

    <!-- Report -->
    <div class="class-box c-rep">
      <div class="class-name">Report</div>
      <div class="class-section">
        + <span class="field-name">_id</span>: <span class="field-type">ObjectId</span><br>
        + <span class="field-name">reportCode</span>: <span class="field-type">String [unique]</span><br>
        + <span class="field-name">request</span>: <span class="field-type">ObjectId &rarr; Request</span><br>
        + <span class="field-name">sample</span>: <span class="field-type">ObjectId &rarr; Sample</span><br>
        + <span class="field-name">summary</span>: <span class="field-type">String</span><br>
        + <span class="field-name">pdfPath</span>: <span class="field-type">String</span><br>
        + <span class="field-name">status</span>: <span class="field-type">ReportStatusEnum</span><br>
        + <span class="field-name">deliveredAt</span>: <span class="field-type">Date</span>
      </div>
      <div class="class-section">
        + <span class="method-name">compileISO15189PDF()</span><br>
        + <span class="method-name">deliverToRequester()</span><br>
        + <span class="method-name">streamSecureDownload()</span>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    await page.setContent(classHtml, { waitUntil: 'load' });
    const classPath = path.join(ASSETS_DIR, '02_uml_class_diagram.png');
    await page.screenshot({ path: classPath, fullPage: true });
    console.log(`Saved: ${classPath}`);

    // 4. Generate UML Sequence Diagram
    console.log('[4/4] Generating UML Sequence Diagram...');
    const seqHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 25px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #ffffff; color: #0f172a; }
    .title { text-align: center; font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { text-align: center; font-size: 13px; color: #64748b; margin-bottom: 24px; font-weight: 500; }
    .actors { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 15px; }
    .actor { text-align: center; font-size: 12px; font-weight: 700; padding: 8px 6px; border-radius: 6px; color: #ffffff; }
    .a-req { background: #2563eb; }
    .a-ui { background: #0284c7; }
    .a-api { background: #7c3aed; }
    .a-staff { background: #059669; }
    .a-db { background: #d97706; }
    .a-engine { background: #dc2626; }

    .seq-table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
    .seq-table th { background: #f1f5f9; padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1; font-size: 12px; }
    .seq-table td { padding: 9px 8px; border-bottom: 1px solid #e2e8f0; }
    .seq-num { font-weight: 700; color: #64748b; width: 40px; text-align: center; }
    .step-desc { font-weight: 600; color: #0f172a; }
    .step-code { font-family: "Courier New", monospace; color: #4338ca; font-size: 11px; }
    .badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .b-req { background: #dbeafe; color: #1e40af; }
    .b-staff { background: #d1fae5; color: #065f46; }
    .b-sys { background: #fef3c7; color: #92400e; }
  </style>
</head>
<body>
  <div class="title">Genomics Laboratory Sequencing Workflow — UML Sequence Diagram</div>
  <div class="subtitle">End-to-End Execution Flow: Requisition &rarr; Sample QC &rarr; NovaSeq Run &rarr; Pipeline &rarr; ISO-15189 Report Delivery</div>

  <div class="actors">
    <div class="actor a-req">Clinician (Requester)</div>
    <div class="actor a-ui">React 18 SPA (Vite)</div>
    <div class="actor a-api">Express.js API Gateway</div>
    <div class="actor a-staff">Lab Technologist (Staff)</div>
    <div class="actor a-engine">PDFKit / Instrument Engine</div>
    <div class="actor a-db">MongoDB Database</div>
  </div>

  <table class="seq-table">
    <thead>
      <tr>
        <th class="seq-num">#</th>
        <th>Source &rarr; Target</th>
        <th>Clinical & Technical Workflow Event</th>
        <th>HTTP Endpoint / Protocol Payload</th>
        <th>Stage State</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="seq-num">1</td>
        <td>Clinician &rarr; React UI</td>
        <td class="step-desc">Submits targeted oncology study requisition with clinical metadata</td>
        <td class="step-code">POST /api/v1/requests (JWT httpOnly Cookie)</td>
        <td><span class="badge b-req">submitted</span></td>
      </tr>
      <tr>
        <td class="seq-num">2</td>
        <td>Express API &rarr; MongoDB</td>
        <td class="step-desc">Auto-generates sequential ID REQ-2026-XXXX and persists requisition record</td>
        <td class="step-code">Request.create({ requestCode, requester: req.user._id })</td>
        <td><span class="badge b-sys">persisted</span></td>
      </tr>
      <tr>
        <td class="seq-num">3</td>
        <td>Lab Staff &rarr; Express API</td>
        <td class="step-desc">Reviews clinical protocol and approves requisition for wet-lab intake</td>
        <td class="step-code">PATCH /api/v1/requests/:id/status { status: 'approved' }</td>
        <td><span class="badge b-staff">approved</span></td>
      </tr>
      <tr>
        <td class="seq-num">4</td>
        <td>Lab Staff &rarr; Express API</td>
        <td class="step-desc">Accessions physical blood/tissue specimen tube with barcode SMP-2026-XXXX</td>
        <td class="step-code">POST /api/v1/samples { requestId, sampleType: 'Blood' }</td>
        <td><span class="badge b-staff">registered</span></td>
      </tr>
      <tr>
        <td class="seq-num">5</td>
        <td>Lab Staff &rarr; Express API</td>
        <td class="step-desc">Records TapeStation/NanoDrop fluorometric metrics (A260/280, DIN/RIN)</td>
        <td class="step-code">POST /api/v1/qc { concentrationNgUl: 48.7, result: 'pass' }</td>
        <td><span class="badge b-staff">qc</span></td>
      </tr>
      <tr>
        <td class="seq-num">6</td>
        <td>Lab Staff &rarr; Instrument</td>
        <td class="step-desc">Batches specimen onto Illumina NovaSeq 6000 flowcell and initiates run</td>
        <td class="step-code">POST /api/v1/sequencing-runs { platform: 'Illumina NovaSeq' }</td>
        <td><span class="badge b-staff">sequencing</span></td>
      </tr>
      <tr>
        <td class="seq-num">7</td>
        <td>Bioinformatician &rarr; API</td>
        <td class="step-desc">Uploads BWA-MEM alignment &amp; GATK Mutect2 variant calling summary</td>
        <td class="step-code">POST /api/v1/analysis (Multer multipart/form-data)</td>
        <td><span class="badge b-staff">analysis</span></td>
      </tr>
      <tr>
        <td class="seq-num">8</td>
        <td>Express API &rarr; PDFKit</td>
        <td class="step-desc">Compiles ISO-15189 diagnostic PDF report on disk with digital laboratory seal</td>
        <td class="step-code">POST /api/v1/reports/generate &rarr; /uploads/reports/REP-XXXX.pdf</td>
        <td><span class="badge b-sys">report_ready</span></td>
      </tr>
      <tr>
        <td class="seq-num">9</td>
        <td>Lab Staff &rarr; Express API</td>
        <td class="step-desc">Authorizes certified clinical report and marks as delivered</td>
        <td class="step-code">PATCH /api/v1/reports/:id/deliver { status: 'delivered' }</td>
        <td><span class="badge b-staff">delivered</span></td>
      </tr>
      <tr>
        <td class="seq-num">10</td>
        <td>Clinician &rarr; Express API</td>
        <td class="step-desc">Clinician downloads certified ISO-15189 diagnostic PDF report via secure stream</td>
        <td class="step-code">GET /api/v1/reports/:id/download (application/pdf)</td>
        <td><span class="badge b-req">verified</span></td>
      </tr>
    </tbody>
  </table>
</body>
</html>
    `;

    await page.setContent(seqHtml, { waitUntil: 'load' });
    const seqPath = path.join(ASSETS_DIR, '03_uml_sequence_diagram.png');
    await page.screenshot({ path: seqPath, fullPage: true });
    console.log(`Saved: ${seqPath}`);

    console.log('=============================================================');
    console.log('✅ ALL REPORT ASSETS AND DIAGRAMS GENERATED SUCCESSFULLY');
    console.log(`Assets Directory: ${ASSETS_DIR}`);
    console.log('=============================================================');
  } catch (err) {
    console.error('Error generating assets:', err);
  } finally {
    await browser.close();
  }
}

generateAssets();
