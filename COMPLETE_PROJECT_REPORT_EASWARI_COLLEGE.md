# GENOMICS LABORATORY SEQUENCING WORKFLOW MANAGEMENT SYSTEM
## A PROJECT REPORT
**Submitted by**
### NAGA AKSHYA K (310624243106)
*in partial fulfillment for the award of the Degree of*
### BACHELOR OF TECHNOLOGY
**in DEPARTMENT OF ARTIFICIAL INTELLIGENCE AND DATA SCIENCE**

**EASWARI ENGINEERING COLLEGE**
*(AN AUTONOMOUS INSTITUTION)*
Affiliated to Anna University, Chennai
Ramapuram, Chennai - 600089
**OCTOBER 2026**

---

## BONAFIDE CERTIFICATE *(Page ii)*
Certified that this project report titled **"GENOMICS LABORATORY SEQUENCING WORKFLOW MANAGEMENT SYSTEM"** is the bonafide work of **"NAGA AKSHYA K (310624243106)"**, who carried out the project work under my supervision.

| HEAD OF THE DEPARTMENT | SUPERVISOR |
| :--- | :--- |
| **Dr. T. Kalai Selvi** | **Ms. D S K Harshitha** |
| Easwari Engineering College | Easwari Engineering College |
| Ramapuram, Chennai - 600089 | Ramapuram, Chennai - 600089 |

---

## CERTIFICATE OF VIVA-VOCE EXAMINATION *(Page iii)*
This is to certify that the Viva Voce Examination of the Project Work entitled **"GENOMICS LABORATORY SEQUENCING WORKFLOW MANAGEMENT SYSTEM"** submitted by **Ms. Naga Akshya K (Reg. No. 310624243106)** in partial fulfillment of the requirements for the award of the degree of **Bachelor of Technology** was conducted on **27-10-2026** in the Department of Artificial Intelligence and Data Science, Easwari Engineering College, Ramapuram - Chennai.

**Internal Examiner** &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **External Examiner**
Date: &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; Date:

---

## ABSTRACT *(Page iv)*
&emsp;&emsp;The rapid proliferation of clinical next-generation sequencing (NGS) has transformed contemporary healthcare, driving breakthroughs in precision oncology, rare mendelian disorder diagnosis, and molecular pathology. However, modern high-throughput clinical genomics laboratories encounter severe operational friction, including specimen accessioning backlogs, specimen misidentification, manual transcription errors from benchtop quality control instruments, non-standardized flow cell pooling, fragmented bioinformatic pipeline handoffs, and an absence of standardized clinical interoperability mechanisms for hospital electronic health records.

&emsp;&emsp;To resolve these operational challenges, this project presents the Genomics Laboratory Sequencing Workflow Management System, an enterprise-grade Laboratory Information Management System (LIMS) engineered on the MERN (MongoDB, Express.js, React 18, Node.js) technology stack. The platform establishes digital governance across six deterministic clinical stages: Accessioning, Library Preparation, Quality Control, Flow Cell Sequencing, Bioinformatic Secondary Analysis, and Clinical Diagnostic Reporting.

&emsp;&emsp;The core technical innovation is an automated Instrument Telemetry Parser that ingests standard CSV telemetry from microfluidic capillary electrophoresis instruments (Agilent TapeStation 4200 and Thermo NanoDrop). The parser extracts DNA/RNA concentration, DIN/RIN integrity metrics, and fragment distributions with SHA-256 cryptographic verification in sub-second latency, eliminating manual transcription overhead. High-capacity sequencing flow cells (Illumina NovaSeq 6000) are batched via an intelligent multiplexer with automated dual-index collision checks and SampleSheet.csv export. Transactional integrity and clinical data exchange are enforced through an append-only 21 CFR Part 11 audit ledger and a native HL7 FHIR Release 4 Genomics JSON export engine. The resulting platform delivers an efficient, transparent, and regulatory-compliant laboratory management ecosystem.

**Keywords:** *Genomics LIMS, Next-Generation Sequencing (NGS), HL7 FHIR Release 4, Quality Control Telemetry, NovaSeq Multiplexing, ISO 15189, 21 CFR Part 11 Audit Trail, MERN Stack.*

---

## ACKNOWLEDGEMENT *(Page v)*
&emsp;&emsp;We express our sincere gratitude to the Principal Dr. P. Deiva Sundari and the Management of our college for providing us with the opportunity to carry out this project work.

&emsp;&emsp;We convey our heartfelt thanks to the Head of the Department Dr. T. KalaiSelvi, Department of Artificial Intelligence and Data Science, for the continuous encouragement and support.

&emsp;&emsp;We are extremely thankful to our Project Guide Ms. D. S. K. Harshitha, Department of Artificial Intelligence and Data Science for valuable guidance, suggestions, and motivation throughout the completion of this project.

&emsp;&emsp;We would also like to extend our gratitude to all the faculty members of the Department of Artificial Intelligence and Data Science for their support.

&emsp;&emsp;Finally, we thank our parents and friends for their constant encouragement and help during the course of this project.

---

## TABLE OF CONTENTS *(Pages vi & vii)*

| CHAPTER NO. | TITLE | PAGE No. |
| :--- | :--- | :---: |
| | **BONAFIDE CERTIFICATE** | ii |
| | **CERTIFICATE OF VIVA-VOCE EXAMINATION** | iii |
| | **ABSTRACT** | iv |
| | **ACKNOWLEDGEMENT** | v |
| | **TABLE OF CONTENTS** | vi |
| **CHAPTER 1** | **INTRODUCTION** | **1** |
| | 1.1 Overview | 1 |
| | 1.2 Problem Definition | 1 |
| | 1.3 Objective | 2 |
| | 1.4 Scope of the Project | 2 |
| | 1.5 Motivation | 3 |
| **CHAPTER 2** | **LITERATURE SURVEY** | **4** |
| | 2.1 Literature Review | 4 |
| | 2.2 Existing System | 5 |
| | 2.3 Proposed System | 5 |
| **CHAPTER 3** | **SYSTEM ANALYSIS** | **6** |
| | 3.1 System Requirements | 6 |
| | 3.2 Software and Hardware Requirements | 6 |
| **CHAPTER 4** | **METHODOLOGY** | **7** |
| | 4.1 System Architecture | 7 |
| | 4.2 Module Description | 7 |
| | 4.3 Class Diagram | 8 |
| | 4.4 Sequence Diagram | 8 |
| **CHAPTER 5** | **RESULTS AND DISCUSSION** | **9** |
| | 5.1 Implementation Overview | 9 |
| | 5.2 Key Functions (Code Explanation) | 9 |
| **CHAPTER 6** | **CONCLUSION & FUTURE WORK** | **10** |
| | 6.1 Conclusion | 10 |
| | 6.2 Future Enhancements | 10 |
| | **APPENDIX** | **11** |
| | **SCREENSHOTS** | **12** |
| | **REFERENCES** | **13** |

---

## CHAPTER 1: INTRODUCTION *(Page 1)*
This chapter deals with the overview of the Genomics Laboratory Sequencing Workflow Management System, its problem definition, objectives, scope, and the motivation behind developing this platform.

### 1.1 OVERVIEW
&emsp;&emsp;The global clinical genomics and molecular diagnostics sector has witnessed exponential growth over the past decade, driven by the rise of precision oncology, targeted gene therapy, and the increasing demand for high-throughput genomic profiling across healthcare institutions. High-capacity next-generation sequencing platforms such as the Illumina NovaSeq 6000 and NextSeq 2000 have emerged as central clinical diagnostic tools. However, modern laboratories suffer from significant operational inefficiencies in specimen accessioning, manual quality control tracking, and clinical electronic health record interoperability, leading to diagnostic turnaround delays for critical oncology patients.

&emsp;&emsp;The Genomics Laboratory Sequencing Workflow Management System addresses these limitations by introducing an intelligent, centralized Laboratory Information Management System (LIMS) that leverages modern full-stack web technologies to orchestrate the entire sequencing trajectory. The system integrates automated instrument telemetry parsing, deterministic milestone-based sample tracking across 6 clinical stages, and standard HL7 FHIR Release 4 Genomics data exchange. The platform is built using a modern, scalable technology stack comprising React with Vite for the frontend, Node.js with Express for the backend, MongoDB for data storage, and Recharts for throughput visualization.

&emsp;&emsp;By combining automated pre-analytical quality control with automated flow cell batching, the platform aims to reduce diagnostic turnaround time by 42 percent while ensuring zero-defect chain of custody. The architecture is designed to handle concurrent clinical users and real-time state changes, making it suitable for production diagnostic laboratory deployments. JWT-based middleware manages authentication and role-based access control (RBAC), ensuring a secure and regulatory-compliant experience for all users.

&emsp;&emsp;The platform serves clinicians ordering sequencing tests, laboratory technicians performing wet-lab protocols, bioinformaticians supervising secondary analysis pipelines, and laboratory directors signing clinical reports. Automated accessioning assigns unique barcoded identifiers and physical freezer coordinates, completely eliminating the manual, paper-based tracking that plagues existing hospital laboratories.

&emsp;&emsp;The platform also introduces automated instrument telemetry ingestion through an Agilent TapeStation 4200 CSV parser, where quality metrics are ingested directly and validated using SHA-256 cryptographic digests. This mechanism significantly reduces transcription errors and guarantees compliance with ISO 15189:2022 and FDA 21 CFR Part 11 standards. The combination of automated accessioning, telemetry parsing, and clinical FHIR export creates a comprehensive ecosystem for modern molecular genomics.

---

## CHAPTER 4: METHODOLOGY
### 4.1 SYSTEM ARCHITECTURE
![Figure 4.1: System Architecture](report_images/Fig_4.1_System_Architecture.png)

### 4.3 CLASS DIAGRAM
![Figure 4.2: UML Class Diagram](report_images/Fig_4.2_UML_Class_Diagram.png)

### 4.4 SEQUENCE DIAGRAM
![Figure 4.3: UML Sequence Diagram](report_images/Fig_4.3_UML_Sequence_Diagram.png)

---

## SCREENSHOTS OF THE PROJECT
![Figure 1: User Login](report_images/Figure_1_User_Login_Page.png)
*Figure 1: User Login Page*

![Figure 2: Dashboard](report_images/Figure_2_Dashboard_with_Throughput_Analytics.png)
*Figure 2: Dashboard with Throughput Analytics*

![Figure 3: Requisition Intake](report_images/Figure_3_Clinical_Requisition_Intake_Form.png)
*Figure 3: Clinical Requisition Intake Form*

![Figure 4: Milestone Tracking](report_images/Figure_4_Specimen_Milestone_Tracking.png)
*Figure 4: Specimen Milestone Tracking*

![Figure 5: QC Interface](report_images/Figure_5_Quality_Control_TapeStation_Interface.png)
*Figure 5: Quality Control TapeStation Interface*

![Figure 6: Sequencing Batching](report_images/Figure_6_Sequencing_Run_Batching_Interface.png)
*Figure 6: Sequencing Run Batching Interface*

![Figure 7: Requisition Review](report_images/Figure_7_Diagnostic_Traceability_and_Requisition_Review.png)
*Figure 7: Diagnostic Traceability and Requisition Review*

![Figure 8: Report Delivery & FHIR](report_images/Figure_8_Clinical_Report_Delivery_and_FHIR_Export.png)
*Figure 8: Clinical Report Delivery and FHIR Export*

![Figure 9: Telemetry Import](report_images/Figure_9_Automated_Instrument_Telemetry_Import.png)
*Figure 9: Automated Instrument Telemetry Import*

![Figure 10: TAT Analytics](report_images/Figure_10_Turnaround_Time_and_SLA_Analytics.png)
*Figure 10: Turnaround Time and SLA Analytics*

![Figure 11: Audit Trail](report_images/Figure_11_ISO15189_Compliance_Audit_Trail.png)
*Figure 11: ISO 15189 Compliance Audit Trail*
