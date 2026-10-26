require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('../config/db');

const User = require('../models/User');
const Request = require('../models/Request');
const Sample = require('../models/Sample');
const QCRecord = require('../models/QCRecord');
const SequencingRun = require('../models/SequencingRun');
const AnalysisResult = require('../models/AnalysisResult');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { generateReportPdf } = require('../utils/generatePdf');

const seedData = async (isStandalone = true) => {
  try {
    if (isStandalone) {
      console.log('[Seed] Connecting to database...');
      await connectDB();
    }

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Request.deleteMany({}),
      Sample.deleteMany({}),
      QCRecord.deleteMany({}),
      SequencingRun.deleteMany({}),
      AnalysisResult.deleteMany({}),
      Report.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('[Seed] Creating demo users...');
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('Admin123!', salt);
    const staffPassword = await bcrypt.hash('Staff123!', salt);
    const requesterPassword = await bcrypt.hash('Requester123!', salt);

    const users = await User.create([
      {
        name: 'Dr. Eleanor Vance',
        email: 'admin@genomicslab.org',
        passwordHash: adminPassword,
        role: 'admin',
        organization: 'Core Genomics Directorate',
        phone: '+1-555-0100',
        isActive: true,
      },
      {
        name: 'Sarah Lin, M.S.',
        email: 'staff1@genomicslab.org',
        passwordHash: staffPassword,
        role: 'lab_staff',
        organization: 'High-Throughput Sequencing Lab',
        phone: '+1-555-0101',
        isActive: true,
      },
      {
        name: 'Marcus Brody',
        email: 'staff2@genomicslab.org',
        passwordHash: staffPassword,
        role: 'lab_staff',
        organization: 'Bioinformatics & QC Core',
        phone: '+1-555-0102',
        isActive: true,
      },
      {
        name: 'Dr. Alexander Hayes',
        email: 'requester1@genomicslab.org',
        passwordHash: requesterPassword,
        role: 'requester',
        organization: 'Dept. of Oncology Research',
        phone: '+1-555-0201',
        isActive: true,
      },
      {
        name: 'Dr. Priya Nair',
        email: 'requester2@genomicslab.org',
        passwordHash: requesterPassword,
        role: 'requester',
        organization: 'Institute of Rare Genetic Diseases',
        phone: '+1-555-0202',
        isActive: true,
      },
      {
        name: 'Dr. Carlos Mendez',
        email: 'requester3@genomicslab.org',
        passwordHash: requesterPassword,
        role: 'requester',
        organization: 'Translational Molecular Pathology',
        phone: '+1-555-0203',
        isActive: true,
      },
    ]);

    const [admin, staff1, staff2, req1, req2, req3] = users;

    console.log('[Seed] Creating requests across all statuses...');
    const requests = await Request.create([
      {
        requestCode: 'REQ-2026-0001',
        requester: req1._id,
        title: 'Glioblastoma Multiforme Somatic Exome Profiling',
        purpose: 'Identify driver somatic mutations and copy-number alterations in recurrent glioblastoma specimens.',
        sampleType: 'Tissue',
        priority: 'urgent',
        status: 'completed',
        reviewedBy: staff1._id,
        reviewNotes: 'Protocol approved under clinical trial IRB-2026-902.',
      },
      {
        requestCode: 'REQ-2026-0002',
        requester: req1._id,
        title: 'Circulating Tumor DNA (ctDNA) Liquid Biopsy Monitoring',
        purpose: 'Non-invasive tracking of EGFR T790M resistance alleles in NSCLC patient plasma.',
        sampleType: 'Blood',
        priority: 'urgent',
        status: 'in_progress',
        reviewedBy: staff1._id,
        reviewNotes: 'High sensitivity deep panel requested; prioritized for NovaSeq run.',
      },
      {
        requestCode: 'REQ-2026-0003',
        requester: req2._id,
        title: 'Trio Whole Genome Sequencing for Undiagnosed Neuropathy',
        purpose: 'Detect de novo structural and single nucleotide variants in pediatric proband with parental trio.',
        sampleType: 'DNA',
        priority: 'routine',
        status: 'in_progress',
        reviewedBy: staff2._id,
        reviewNotes: 'Trio blood extraction confirmed. High depth 30x WGS assigned.',
      },
      {
        requestCode: 'REQ-2026-0004',
        requester: req2._id,
        title: 'Single-Cell Transcriptomics of Rare Cardiomyopathy',
        purpose: 'RNA-seq differential expression profiling in human cardiac biopsy tissue.',
        sampleType: 'RNA',
        priority: 'routine',
        status: 'approved',
        reviewedBy: staff1._id,
        reviewNotes: 'RNA integrity requirements communicated. Awaiting sample drop-off.',
      },
      {
        requestCode: 'REQ-2026-0005',
        requester: req3._id,
        title: 'Long-Read Sequencing for HLA Typing & Structural Polymorphisms',
        purpose: 'Resolve complex tandem duplications and repetitive immune receptor loci.',
        sampleType: 'DNA',
        priority: 'routine',
        status: 'under_review',
        reviewedBy: null,
        reviewNotes: '',
      },
      {
        requestCode: 'REQ-2026-0006',
        requester: req3._id,
        title: 'Metagenomic Shotgun Profiling of Sepsis Cohort',
        purpose: 'Pathogen detection in clinical cell-free biological fluid.',
        sampleType: 'Other',
        priority: 'urgent',
        status: 'submitted',
        reviewedBy: null,
        reviewNotes: '',
      },
      {
        requestCode: 'REQ-2026-0007',
        requester: req1._id,
        title: 'Formalin-Fixed (FFPE) Colorectal Carcinoma Panel',
        purpose: 'Retrospective screening of KRAS and BRAF codons from 10-year archive.',
        sampleType: 'Tissue',
        priority: 'routine',
        status: 'rejected',
        reviewedBy: staff2._id,
        reviewNotes: 'FFPE blocks excessively degraded; DIN < 2.0. Unusable for library prep.',
      },
      {
        requestCode: 'REQ-2026-0008',
        requester: req2._id,
        title: 'Population Cohort Targeted Cancer Predisposition Panel',
        purpose: 'BRCA1/2, Lynch Syndrome, and TP53 germline screening for familial registry.',
        sampleType: 'DNA',
        priority: 'routine',
        status: 'completed',
        reviewedBy: staff1._id,
        reviewNotes: 'Batch approved. Quality control and reports finalized.',
      },
    ]);

    console.log('[Seed] Creating samples across all lifecycle stages...');
    const samples = await Sample.create([
      // REQ-0001 (Completed)
      {
        sampleCode: 'SMP-2026-0001',
        request: requests[0]._id,
        sampleType: 'Tissue',
        collectionDate: new Date('2026-08-10'),
        receivedDate: new Date('2026-08-12'),
        currentStage: 'delivered',
        registeredBy: staff1._id,
      },
      {
        sampleCode: 'SMP-2026-0002',
        request: requests[0]._id,
        sampleType: 'DNA',
        collectionDate: new Date('2026-08-10'),
        receivedDate: new Date('2026-08-12'),
        currentStage: 'delivered',
        registeredBy: staff1._id,
      },

      // REQ-0002 (In Progress - ctDNA)
      {
        sampleCode: 'SMP-2026-0003',
        request: requests[1]._id,
        sampleType: 'Blood',
        collectionDate: new Date('2026-09-01'),
        receivedDate: new Date('2026-09-02'),
        currentStage: 'analysis',
        registeredBy: staff2._id,
      },
      {
        sampleCode: 'SMP-2026-0004',
        request: requests[1]._id,
        sampleType: 'Blood',
        collectionDate: new Date('2026-09-01'),
        receivedDate: new Date('2026-09-02'),
        currentStage: 'sequencing',
        registeredBy: staff2._id,
      },

      // REQ-0003 (In Progress - Trio WGS)
      {
        sampleCode: 'SMP-2026-0005',
        request: requests[2]._id,
        sampleType: 'DNA',
        collectionDate: new Date('2026-09-10'),
        receivedDate: new Date('2026-09-11'),
        currentStage: 'sequencing',
        registeredBy: staff1._id,
      },
      {
        sampleCode: 'SMP-2026-0006',
        request: requests[2]._id,
        sampleType: 'DNA',
        collectionDate: new Date('2026-09-10'),
        receivedDate: new Date('2026-09-11'),
        currentStage: 'qc',
        registeredBy: staff1._id,
      },
      {
        sampleCode: 'SMP-2026-0007',
        request: requests[2]._id,
        sampleType: 'DNA',
        collectionDate: new Date('2026-09-10'),
        receivedDate: new Date('2026-09-11'),
        currentStage: 'qc',
        registeredBy: staff1._id,
      },

      // REQ-0004 (Approved - Sample Registered)
      {
        sampleCode: 'SMP-2026-0008',
        request: requests[3]._id,
        sampleType: 'RNA',
        collectionDate: new Date('2026-09-20'),
        receivedDate: new Date('2026-09-22'),
        currentStage: 'registered',
        registeredBy: staff1._id,
      },

      // REQ-0005 (Under review)
      {
        sampleCode: 'SMP-2026-0009',
        request: requests[4]._id,
        sampleType: 'DNA',
        collectionDate: new Date('2026-09-24'),
        receivedDate: new Date('2026-09-25'),
        currentStage: 'registered',
        registeredBy: staff2._id,
      },

      // REQ-0007 (Rejected Sample - Failed QC)
      {
        sampleCode: 'SMP-2026-0010',
        request: requests[6]._id,
        sampleType: 'Tissue',
        collectionDate: new Date('2026-08-15'),
        receivedDate: new Date('2026-08-16'),
        currentStage: 'qc',
        registeredBy: staff2._id,
      },

      // REQ-0008 (Completed)
      {
        sampleCode: 'SMP-2026-0011',
        request: requests[7]._id,
        sampleType: 'DNA',
        collectionDate: new Date('2026-08-01'),
        receivedDate: new Date('2026-08-03'),
        currentStage: 'delivered',
        registeredBy: staff1._id,
      },
      {
        sampleCode: 'SMP-2026-0012',
        request: requests[7]._id,
        sampleType: 'DNA',
        collectionDate: new Date('2026-08-01'),
        receivedDate: new Date('2026-08-03'),
        currentStage: 'report_ready',
        registeredBy: staff1._id,
      },
    ]);

    console.log('[Seed] Creating QC records (pass, fail, repeat)...');
    const qcRecords = await QCRecord.create([
      {
        sample: samples[0]._id, // SMP-0001
        concentrationNgUl: 62.4,
        purity260_280: 1.84,
        purity260_230: 2.12,
        volumeUl: 45,
        integrityNumber: 8.9,
        result: 'pass',
        performedBy: staff2._id,
        notes: 'High molecular weight DNA confirmed by TapeStation.',
      },
      {
        sample: samples[1]._id, // SMP-0002
        concentrationNgUl: 55.1,
        purity260_280: 1.87,
        purity260_230: 2.08,
        volumeUl: 50,
        integrityNumber: 9.1,
        result: 'pass',
        performedBy: staff2._id,
        notes: 'Optimal concentration and yield.',
      },
      {
        sample: samples[2]._id, // SMP-0003
        concentrationNgUl: 14.8,
        purity260_280: 1.82,
        purity260_230: 1.95,
        volumeUl: 35,
        integrityNumber: 7.8,
        result: 'pass',
        performedBy: staff1._id,
        notes: 'Circulating cfDNA yields nominal for deep target capture.',
      },
      {
        sample: samples[3]._id, // SMP-0004
        concentrationNgUl: 12.3,
        purity260_280: 1.79,
        purity260_230: 1.90,
        volumeUl: 30,
        integrityNumber: 7.5,
        result: 'pass',
        performedBy: staff1._id,
        notes: 'Plasma cfDNA passed Qubit fluorometer inspection.',
      },
      {
        sample: samples[4]._id, // SMP-0005
        concentrationNgUl: 78.5,
        purity260_280: 1.89,
        purity260_230: 2.20,
        volumeUl: 60,
        integrityNumber: 9.4,
        result: 'pass',
        performedBy: staff2._id,
        notes: 'Outstanding DNA purity and high DIN metric.',
      },
      {
        sample: samples[5]._id, // SMP-0006
        concentrationNgUl: 24.1,
        purity260_280: 1.62,
        purity260_230: 1.45,
        volumeUl: 25,
        integrityNumber: 6.2,
        result: 'repeat',
        performedBy: staff2._id,
        notes: 'Borderline ethanol carryover; recommended speedvac purification wash.',
      },
      {
        sample: samples[9]._id, // SMP-0010 (Failed sample)
        concentrationNgUl: 3.2,
        purity260_280: 1.35,
        purity260_230: 0.85,
        volumeUl: 15,
        integrityNumber: 1.8,
        result: 'fail',
        performedBy: staff2._id,
        notes: 'Severe formalin fixation artifacts, extensive DNA shearing below 100bp.',
      },
      {
        sample: samples[10]._id, // SMP-0011
        concentrationNgUl: 88.0,
        purity260_280: 1.88,
        purity260_230: 2.15,
        volumeUl: 60,
        integrityNumber: 9.2,
        result: 'pass',
        performedBy: staff1._id,
        notes: 'Germline blood extraction passed all thresholds.',
      },
      {
        sample: samples[11]._id, // SMP-0012
        concentrationNgUl: 72.3,
        purity260_280: 1.85,
        purity260_230: 2.10,
        volumeUl: 55,
        integrityNumber: 8.8,
        result: 'pass',
        performedBy: staff1._id,
        notes: 'Passed fluorometric quantification.',
      },
    ]);

    console.log('[Seed] Creating sequencing runs across platforms and statuses...');
    const sequencingRuns = await SequencingRun.create([
      {
        runCode: 'RUN-2026-0001',
        samples: [samples[0]._id, samples[1]._id],
        platform: 'Illumina NovaSeq',
        runType: 'WES',
        readLength: '2x150bp',
        targetCoverage: 100,
        status: 'completed',
        performedBy: staff1._id,
      },
      {
        runCode: 'RUN-2026-0002',
        samples: [samples[2]._id, samples[3]._id],
        platform: 'Illumina MiSeq',
        runType: 'Targeted Panel',
        readLength: '2x150bp',
        targetCoverage: 500,
        status: 'in_progress',
        performedBy: staff1._id,
      },
      {
        runCode: 'RUN-2026-0003',
        samples: [samples[4]._id],
        platform: 'Illumina NovaSeq',
        runType: 'WGS',
        readLength: '2x150bp',
        targetCoverage: 30,
        status: 'scheduled',
        performedBy: staff2._id,
      },
      {
        runCode: 'RUN-2026-0004',
        samples: [samples[10]._id, samples[11]._id],
        platform: 'PacBio',
        runType: 'WGS',
        readLength: 'HiFi 15-20kb',
        targetCoverage: 20,
        status: 'completed',
        performedBy: staff2._id,
      },
    ]);

    console.log('[Seed] Creating analysis results...');
    const analysisResults = await AnalysisResult.create([
      {
        sample: samples[0]._id,
        sequencingRun: sequencingRuns[0]._id,
        pipeline: 'BWA-MEM + GATK HaplotypeCaller + Mutect2',
        referenceGenome: 'GRCh38',
        status: 'completed',
        resultSummary:
          'Identified pathogenic somatic variant in TP53 c.818G>A (p.Arg273His) at 42.1% VAF. High microsatellite stability (MSS).',
        resultFilePath: '',
        performedBy: staff2._id,
      },
      {
        sample: samples[1]._id,
        sequencingRun: sequencingRuns[0]._id,
        pipeline: 'BWA-MEM + GATK HaplotypeCaller',
        referenceGenome: 'GRCh38',
        status: 'completed',
        resultSummary:
          'Matched germline control verified somatic origin of TP53 mutation. No pathogenic germline alleles identified in ACMG 59 panel.',
        resultFilePath: '',
        performedBy: staff2._id,
      },
      {
        sample: samples[2]._id,
        sequencingRun: sequencingRuns[1]._id,
        pipeline: 'UMI-tools + VarDict ctDNA caller',
        referenceGenome: 'GRCh38',
        status: 'in_progress',
        resultSummary:
          'FastQC and UMI deduplication completed. Alignments mapped with 99.8% precision. Variant calling underway.',
        resultFilePath: '',
        performedBy: staff2._id,
      },
      {
        sample: samples[10]._id,
        sequencingRun: sequencingRuns[3]._id,
        pipeline: 'DeepVariant v1.6 + Clair3',
        referenceGenome: 'GRCh38',
        status: 'completed',
        resultSummary:
          'Heterozygous pathogenic frameshift variant in BRCA2 c.5946delT (p.Ser1982ArgfsTer22) confirmed with 32x high-fidelity read support.',
        resultFilePath: '',
        performedBy: staff2._id,
      },
      {
        sample: samples[11]._id,
        sequencingRun: sequencingRuns[3]._id,
        pipeline: 'DeepVariant v1.6 + Clair3',
        referenceGenome: 'GRCh38',
        status: 'completed',
        resultSummary:
          'Benign polymorphic variants in TP53 and MLH1. No actionable pathogenic variants detected.',
        resultFilePath: '',
        performedBy: staff2._id,
      },
    ]);

    console.log('[Seed] Generating PDF reports on disk...');
    // Generate Report 1 (Delivered for REQ-0001, SMP-0001)
    const rep1PdfData = {
      reportCode: 'REP-2026-0001',
      status: 'delivered',
      requesterName: req1.name,
      organization: req1.organization,
      requestCode: requests[0].requestCode,
      requestTitle: requests[0].title,
      sampleType: samples[0].sampleType,
      priority: requests[0].priority,
      sampleCode: samples[0].sampleCode,
      collectionDate: samples[0].collectionDate,
      receivedDate: samples[0].receivedDate,
      concentrationNgUl: qcRecords[0].concentrationNgUl,
      purity260_280: qcRecords[0].purity260_280,
      purity260_230: qcRecords[0].purity260_230,
      integrityNumber: qcRecords[0].integrityNumber,
      qcResult: qcRecords[0].result,
      runCode: sequencingRuns[0].runCode,
      platform: sequencingRuns[0].platform,
      runType: sequencingRuns[0].runType,
      readLength: sequencingRuns[0].readLength,
      targetCoverage: sequencingRuns[0].targetCoverage,
      runStatus: sequencingRuns[0].status,
      pipeline: analysisResults[0].pipeline,
      referenceGenome: analysisResults[0].referenceGenome,
      summary: analysisResults[0].resultSummary,
      generatedByName: staff1.name,
    };
    const rep1Path = await generateReportPdf(rep1PdfData);

    // Generate Report 2 (Delivered for REQ-0001, SMP-0002)
    const rep2PdfData = {
      ...rep1PdfData,
      reportCode: 'REP-2026-0002',
      sampleCode: samples[1].sampleCode,
      summary: analysisResults[1].resultSummary,
    };
    const rep2Path = await generateReportPdf(rep2PdfData);

    // Generate Report 3 (Delivered for REQ-0008, SMP-0011)
    const rep3PdfData = {
      reportCode: 'REP-2026-0003',
      status: 'delivered',
      requesterName: req2.name,
      organization: req2.organization,
      requestCode: requests[7].requestCode,
      requestTitle: requests[7].title,
      sampleType: samples[10].sampleType,
      priority: requests[7].priority,
      sampleCode: samples[10].sampleCode,
      collectionDate: samples[10].collectionDate,
      receivedDate: samples[10].receivedDate,
      concentrationNgUl: qcRecords[7].concentrationNgUl,
      purity260_280: qcRecords[7].purity260_280,
      purity260_230: qcRecords[7].purity260_230,
      integrityNumber: qcRecords[7].integrityNumber,
      qcResult: qcRecords[7].result,
      runCode: sequencingRuns[3].runCode,
      platform: sequencingRuns[3].platform,
      runType: sequencingRuns[3].runType,
      readLength: sequencingRuns[3].readLength,
      targetCoverage: sequencingRuns[3].targetCoverage,
      runStatus: sequencingRuns[3].status,
      pipeline: analysisResults[3].pipeline,
      referenceGenome: analysisResults[3].referenceGenome,
      summary: analysisResults[3].resultSummary,
      generatedByName: staff2.name,
    };
    const rep3Path = await generateReportPdf(rep3PdfData);

    // Generate Report 4 (Final draft for REQ-0008, SMP-0012)
    const rep4PdfData = {
      ...rep3PdfData,
      reportCode: 'REP-2026-0004',
      status: 'final',
      sampleCode: samples[11].sampleCode,
      summary: analysisResults[4].resultSummary,
    };
    const rep4Path = await generateReportPdf(rep4PdfData);

    console.log('[Seed] Saving reports in MongoDB...');
    const createdReports = await Report.create([
      {
        reportCode: 'REP-2026-0001',
        request: requests[0]._id,
        sample: samples[0]._id,
        summary: analysisResults[0].resultSummary,
        pdfPath: rep1Path,
        status: 'delivered',
        generatedBy: staff1._id,
        deliveredAt: new Date('2026-08-25'),
      },
      {
        reportCode: 'REP-2026-0002',
        request: requests[0]._id,
        sample: samples[1]._id,
        summary: analysisResults[1].resultSummary,
        pdfPath: rep2Path,
        status: 'delivered',
        generatedBy: staff1._id,
        deliveredAt: new Date('2026-08-25'),
      },
      {
        reportCode: 'REP-2026-0003',
        request: requests[7]._id,
        sample: samples[10]._id,
        summary: analysisResults[3].resultSummary,
        pdfPath: rep3Path,
        status: 'delivered',
        generatedBy: staff2._id,
        deliveredAt: new Date('2026-08-20'),
      },
      {
        reportCode: 'REP-2026-0004',
        request: requests[7]._id,
        sample: samples[11]._id,
        summary: analysisResults[4].resultSummary,
        pdfPath: rep4Path,
        status: 'final',
        generatedBy: staff2._id,
        deliveredAt: null,
      },
    ]);

    console.log('[Seed] Creating demo notifications and ISO-15189 audit logs...');
    await Notification.create([
      {
        recipient: req1._id,
        title: 'Diagnostic Report Delivered',
        message: 'Clinical Report REP-2026-0001 for Glioblastoma Somatic Exome has been certified and is ready for download.',
        type: 'report',
        link: '/reports',
        isRead: false,
      },
      {
        recipient: req1._id,
        title: 'Sample Advanced to Bioinformatics',
        message: 'Specimen SMP-2026-0003 has passed flowcell sequencing and is currently undergoing GATK variant calling.',
        type: 'sample',
        link: '/samples',
        isRead: false,
      },
      {
        recipient: req2._id,
        title: 'Requisition Approved',
        message: 'Requisition REQ-2026-0004 (Single-Cell Transcriptomics) has been approved by laboratory staff.',
        type: 'request',
        link: '/requests',
        isRead: true,
      },
      {
        recipient: staff1._id,
        title: 'QC Verification Required',
        message: 'Specimen SMP-2026-0006 is accessioned and ready for TapeStation RIN assessment.',
        type: 'qc',
        link: '/qc',
        isRead: false,
      },
      {
        recipient: admin._id,
        title: 'High-Throughput Flowcell Run Completed',
        message: 'Illumina NovaSeq run RUN-2026-0001 (100x WGS) has completed successfully with 98.4% Q30 score.',
        type: 'sequencing',
        link: '/sequencing',
        isRead: false,
      },
    ]);

    await AuditLog.create([
      {
        user: admin._id,
        action: 'SYSTEM_INITIALIZED',
        entityType: 'System',
        entityId: 'SYS-INIT',
        details: 'Laboratory Core Database initialized with CAP/CLIA validation protocols.',
        ipAddress: '127.0.0.1',
      },
      {
        user: req1._id,
        action: 'REQUEST_SUBMITTED',
        entityType: 'Request',
        entityId: requests[0].requestCode,
        details: 'Requisition submitted for Glioblastoma Somatic Exome Profiling.',
        ipAddress: '192.168.1.101',
      },
      {
        user: staff1._id,
        action: 'REQUEST_APPROVED',
        entityType: 'Request',
        entityId: requests[0].requestCode,
        details: 'Clinical protocol approved for specimen accessioning.',
        ipAddress: '192.168.1.50',
      },
      {
        user: staff1._id,
        action: 'SAMPLE_REGISTERED',
        entityType: 'Sample',
        entityId: samples[0].sampleCode,
        details: 'Physical tissue biopsy specimen accessioned with primary tube barcode.',
        ipAddress: '192.168.1.50',
      },
      {
        user: staff1._id,
        action: 'QC_METRICS_RECORDED',
        entityType: 'QCRecord',
        entityId: samples[0].sampleCode,
        details: 'TapeStation 4200 analysis: Concentration 54.2 ng/uL, DIN 8.9 (PASS).',
        ipAddress: '192.168.1.50',
      },
      {
        user: staff1._id,
        action: 'SEQUENCING_RUN_COMPLETED',
        entityType: 'SequencingRun',
        entityId: sequencingRuns[0].runCode,
        details: 'Illumina NovaSeq flowcell run completed with 30x target coverage.',
        ipAddress: '192.168.1.50',
      },
      {
        user: staff2._id,
        action: 'REPORT_DELIVERED',
        entityType: 'Report',
        entityId: createdReports[0].reportCode,
        details: 'ISO-15189 diagnostic PDF report delivered with digital signature.',
        ipAddress: '192.168.1.55',
      },
    ]);
    console.log('✅ DATABASE SEEDING COMPLETE WITH RICH DEMO CLINICAL WORKFLOW DATA');
    console.log('================================================================');
    console.log('Demo Accounts:');
    console.log('  1. ADMIN:      admin@genomicslab.org      / Admin123!');
    console.log('  2. LAB STAFF:  staff1@genomicslab.org     / Staff123!');
    console.log('  3. LAB STAFF:  staff2@genomicslab.org     / Staff123!');
    console.log('  4. REQUESTER:  requester1@genomicslab.org / Requester123!');
    console.log('  5. REQUESTER:  requester2@genomicslab.org / Requester123!');
    console.log('  6. REQUESTER:  requester3@genomicslab.org / Requester123!');
    console.log('================================================================');

    if (isStandalone) {
      await disconnectDB();
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    if (isStandalone) {
      process.exit(1);
    } else {
      throw err;
    }
  }
};

if (require.main === module) {
  seedData(true);
}

module.exports = { seedData };
