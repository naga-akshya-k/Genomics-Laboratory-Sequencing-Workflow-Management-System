/**
 * Genomics Laboratory Sequencing Workflow Management System
 * Live MongoDB Database Inspector for VS Code
 * 
 * Usage in VS Code Terminal:
 *   node view-db.js            -> Shows collection summary and writes database_live_view.json
 *   node view-db.js samples    -> Displays all documents in 'samples' collection
 *   node view-db.js requests   -> Displays all documents in 'requests' collection
 *   node view-db.js qc         -> Displays all documents in 'qcrecords' collection
 *   node view-db.js runs       -> Displays all documents in 'sequencingruns' collection
 *   node view-db.js analysis   -> Displays all documents in 'analysisresults' collection
 *   node view-db.js reports    -> Displays all documents in 'reports' collection
 *   node view-db.js users      -> Displays all documents in 'users' collection
 */

const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api/v1';

async function main() {
  const targetCollection = process.argv[2] ? process.argv[2].toLowerCase() : null;

  try {
    // 1. Authenticate as Admin to access all collections
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@genomicslab.org',
        password: 'Admin123!',
      }),
    });

    if (!loginRes.ok) {
      console.error(`\x1b[31m[Error] Could not authenticate with server on ${API_BASE}. Make sure 'npm run dev' is running.\x1b[0m`);
      process.exit(1);
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 2. Fetch all collections
    const endpoints = {
      users: `${API_BASE}/users`,
      requests: `${API_BASE}/requests`,
      samples: `${API_BASE}/samples`,
      qc: `${API_BASE}/qc`,
      sequencingRuns: `${API_BASE}/sequencing-runs`,
      analysis: `${API_BASE}/analysis`,
      reports: `${API_BASE}/reports`,
      notifications: `${API_BASE}/notifications`,
      auditLogs: `${API_BASE}/audit-logs`,
    };

    const results = {};
    for (const [key, url] of Object.entries(endpoints)) {
      const res = await fetch(url, { headers: authHeaders });
      if (res.ok) {
        const json = await res.json();
        results[key] = json.data || [];
      } else {
        results[key] = [];
      }
    }

    // 3. Save comprehensive JSON file for direct viewing in VS Code editor tab
    const exportFile = path.join(__dirname, 'database_live_view.json');
    const exportPayload = {
      _meta: {
        system: 'Genomics Laboratory Sequencing Workflow Management System',
        database: 'MongoDB (Mongoose ODM)',
        inspectedAt: new Date().toISOString(),
        totalCollections: Object.keys(results).length,
        totalDocuments: Object.values(results).reduce((acc, curr) => acc + curr.length, 0),
      },
      collections: {
        users: results.users,
        requests: results.requests,
        samples: results.samples,
        qcRecords: results.qc,
        sequencingRuns: results.sequencingRuns,
        analysisResults: results.analysis,
        reports: results.reports,
      },
    };

    fs.writeFileSync(exportFile, JSON.stringify(exportPayload, null, 2), 'utf8');

    // 4. If specific collection requested, print its documents
    if (targetCollection) {
      const matchKey = Object.keys(results).find(
        (k) => k.toLowerCase() === targetCollection || k.toLowerCase().startsWith(targetCollection)
      );

      if (matchKey) {
        console.log(`\n\x1b[36m========================================================================\x1b[0m`);
        console.log(`\x1b[32m 🧬 MONGODB COLLECTION: '${matchKey}' (${results[matchKey].length} documents)\x1b[0m`);
        console.log(`\x1b[36m========================================================================\x1b[0m\n`);
        console.log(JSON.stringify(results[matchKey], null, 2));
        console.log(`\n\x1b[33mTip: Full database has also been exported to 'database_live_view.json' for tab view in VS Code.\x1b[0m\n`);
        return;
      }
    }

    // 5. Default: Print summary table
    console.log(`\n\x1b[36m==================================================================================\x1b[0m`);
    console.log(`\x1b[1m\x1b[32m 🧬 GENOMICS LABORATORY WORKFLOW — MONGODB LIVE DATABASE INSPECTOR\x1b[0m`);
    console.log(`\x1b[36m==================================================================================\x1b[0m`);
    console.log(` Server Status     : \x1b[32mONLINE (http://localhost:5000)\x1b[0m`);
    console.log(` ODM Engine        : \x1b[33mMongoDB with Mongoose Schemas & ObjectId References\x1b[0m`);
    console.log(` Inspect Timestamp : ${new Date().toLocaleString()}`);
    console.log(`\x1b[36m----------------------------------------------------------------------------------\x1b[0m`);
    console.log(` \x1b[1mCOLLECTION NAME\x1b[0m          | \x1b[1mDOCUMENTS\x1b[0m | \x1b[1mPRIMARY IDENTIFIERS / EXAMPLES\x1b[0m`);
    console.log(`\x1b[36m----------------------------------------------------------------------------------\x1b[0m`);

    const printRow = (name, count, sampleId) => {
      const paddedName = name.padEnd(24, ' ');
      const paddedCount = String(count).padStart(9, ' ');
      console.log(` ${paddedName} | ${paddedCount} | ${sampleId}`);
    };

    const firstReq = results.requests[0]?.requestCode || 'None';
    const firstSample = results.samples[0]?.sampleCode || 'None';
    const firstQC = results.qc[0]?.sample?.sampleCode || results.qc[0]?._id || 'None';
    const firstRun = results.sequencingRuns[0]?.runCode || 'None';
    const firstAnalysis = results.analysis[0]?.pipeline || 'None';
    const firstReport = results.reports[0]?.reportCode || 'None';
    const firstUser = results.users[0]?.email || 'None';

    printRow('1. users', results.users.length, `Admin, Staff, Requesters (e.g. ${firstUser})`);
    printRow('2. requests', results.requests.length, `Requisition Codes (e.g. ${firstReq})`);
    printRow('3. samples', results.samples.length, `Specimen Barcodes (e.g. ${firstSample})`);
    printRow('4. qcrecords', results.qc.length, `Fluorometric metrics (e.g. for ${firstQC})`);
    printRow('5. sequencingruns', results.sequencingRuns.length, `Flowcell Run Codes (e.g. ${firstRun})`);
    printRow('6. analysisresults', results.analysis.length, `Pipelines (e.g. ${firstAnalysis})`);
    printRow('7. reports', results.reports.length, `ISO-15189 PDFs (e.g. ${firstReport})`);
    printRow('8. notifications', results.notifications.length, 'Automated in-app alert broadcasts');
    printRow('9. auditlogs', results.auditLogs.length, 'ISO-15189 & 21 CFR Part 11 chain-of-custody');

    console.log(`\x1b[36m----------------------------------------------------------------------------------\x1b[0m`);
    console.log(` \x1b[1mTOTAL LIVE RECORDS\x1b[0m       | \x1b[32m\x1b[1m${String(exportPayload._meta.totalDocuments).padStart(9, ' ')}\x1b[0m | \x1b[32mAll 9 collections persistent in MongoDB\x1b[0m`);
    console.log(`\x1b[36m==================================================================================\x1b[0m`);
    console.log(`\n\x1b[33m👉 HOW TO SHOW MA'AM IN VS CODE:\x1b[0m`);
    console.log(`  1. \x1b[1mIn VS Code File Explorer\x1b[0m: Click on \x1b[36mdatabase_live_view.json\x1b[0m to view the full database in a tab.`);
    console.log(`  2. \x1b[1mIn VS Code Terminal\x1b[0m: Type \x1b[32mnode view-db.js samples\x1b[0m or \x1b[32mnode view-db.js requests\x1b[0m to inspect single collections.\n`);

  } catch (err) {
    console.error('\x1b[31m[Error inspecting database]\x1b[0m', err.message);
  }
}

main();
