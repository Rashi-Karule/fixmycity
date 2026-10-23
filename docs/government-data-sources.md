# Government Data Source Register (Provenance & Verification Registry)

**Document Status:** Production Reference  
**Last Audited:** October 2026  
**Platform:** FixMyCity — India-Wide Civic Issue Reporting & Resolution Platform  
**Operational Classification:** Civic Technology Prototype with Verifiable Provenance  

---

## 1. Governance & Data Integrity Overview

FixMyCity is architected to transition from a collegiate civic prototype into an authorized, government-ready public grievance platform across Indian States, Union Territories (UTs), Urban Local Bodies (ULBs), and Rural Panchayati Raj Institutions (PRIs).

To uphold **data integrity, public trust, and legal compliance**, the platform enforces the following architectural principles:
1. **Zero Fabrication:** No government official names, Indian Administrative Service (IAS) appointments, departmental phone numbers, municipal seals, or clearance badges are invented.
2. **Clear Provenance:** Every department office, boundary, and contact number rendered in production must specify its authoritative source URL, verification status, and retrieval timestamp.
3. **External Link Neutrality:** Links to external official government portals (CPGRAMS, UMANG, India.gov.in) are presented with clear external resource disclaimers; FixMyCity does not claim unauthorized internal system integrations.
4. **Sample Data Identification:** In development and demonstration modes, synthetic records are conspicuously labeled: `"Sample Data — Not an Official Government Record"`.

---

## 2. Authoritative Government Data Source Registry

| Source Identifier | Publishing Authority | Official URL | Purpose & Fields Used | Availability & Integration Mode | Update Frequency | Usage & Licensing Restrictions | Known Coverage Gaps | Integration Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GIGW 3.0** *(Source A)* | Ministry of Electronics and Information Technology (MeitY) & NIC | [https://guidelines.india.gov.in/](https://guidelines.india.gov.in/) | Accessibility compliance (WCAG 2.1 AA), bilingual information architecture, cybersecurity baseline, mobile responsiveness. | Guidelines & Design Reference. No runtime API. | Periodic revisions (Version 3.0, 2023). | Public Government Standards. Site must not claim formal certification without official STQC audit. | N/A (Standard guideline). | **Configured** (Architecture follows GIGW guidelines; no false certification claimed). |
| **Local Government Directory (LGD)** *(Source B)* | Ministry of Panchayati Raj, Government of India | [https://lgdirectory.gov.in/](https://lgdirectory.gov.in/) & [https://data.gov.in/catalog/local-government-directory-lgd](https://data.gov.in/catalog/local-government-directory-lgd) | Official LGD codes, State/UT hierarchies, District lists, Urban Local Bodies (Municipal Corporations, Municipalities, Nagar Panchayats), Rural Panchayats (Gram, Block, Zilla), Ward numbers. | Bulk CSV / OGD datasets via data.gov.in; Web Directory. REST API requires institutional NIC credentials. | Monthly catalog updates. | Government Open Data License - India (GODL-India). Attribution required. | Does not contain live office phone numbers, individual duty officer rosters, or real-time jurisdictional dispatch boundaries. | **Configured & Verified** (LGD codes & administrative hierarchy integrated into jurisdiction schema). |
| **Open Government Data (OGD) Platform India** *(Source C)* | National Informatics Centre (NIC) / MeitY | [https://data.gov.in/](https://data.gov.in/) | Municipal administrative boundary lists, civic amenity classifications, verified dataset catalog numbers. | RESTful APIs (requires API Key) and public downloadable catalogs (CSV/JSON). | Varies by publishing department. | National Data Sharing and Accessibility Policy (NDSAP) / GODL-India. | Dataset freshness depends on publishing municipal bodies; state-level variations in format. | **Configured** (Source registered; CSV import parser configured with validation). |
| **National Portal of India** *(Source D)* | National Informatics Centre (NIC), Ministry of Electronics & IT | [https://www.india.gov.in/](https://www.india.gov.in/) | Authoritative directory of Central Ministries, State Government secretariats, and primary citizen service links. | Web Directory & Reference Service. | Continuous updates by NIC. | Public domain government information. | High-level directory; does not provide ward-level municipal dispute escalation APIs. | **Configured** (Linked as external reference resource in citizen portal). |
| **CPGRAMS** *(Source E)* | Department of Administrative Reforms & Public Grievances (DARPG) | [https://pgportal.gov.in/](https://pgportal.gov.in/) | Centralised Public Grievance Redress and Monitoring System for Central/State Government ministries. | Web Portal & Institutional API (restricted to authorized departments). | Live governmental system. | Official Government of India Grievance Portal. Unauthorized API replication is prohibited. | FixMyCity tracking IDs are distinct internal reference tokens and MUST NOT be represented as CPGRAMS registration numbers. | **External Resource Only** (FixMyCity is NOT integrated with CPGRAMS; explicit external link provided). |
| **UMANG** *(Source F)* | National e-Governance Division (NeGD), MeitY | [https://www.umang.gov.in/landing/](https://www.umang.gov.in/landing/) | Unified Mobile Application for New-age Governance citizen services reference. | Mobile Application & Web Platform; partner onboarding required for service provider integration. | Continuous platform updates. | Proprietary Government of India application platform. Integration requires formal MoU with NeGD. | No public unauthenticated submission API. | **External Resource Only** (Direct links provided for relevant statutory citizen services). |
| **UIDAI Legal & Tech Regulations** *(Source G)* | Unique Identification Authority of India (UIDAI) | [https://www.uidai.gov.in/en/about-uidai/legal-framework/regulations.html](https://www.uidai.gov.in/en/about-uidai/legal-framework/regulations.html) | Aadhaar Act 2016 (amended 2019), Aadhaar (Authentication) Regulations, e-KYC guidelines, voluntary consent mandates. | AUA/KUA secure hardware & leased-line network integration. | Statutory amendments published via official gazette. | Severe penalties under Aadhaar Act for unauthorized storage of raw 12-digit UID numbers, biometrics, or unconsented authentication. | Not legally permitted for mandatory use in general civic complaint logging without explicit statutory notification under Section 7 or Section 4(4)(b)(ii). | **Safeguarded** (Raw storage prohibited; pluggable adapter interface with Mobile OTP fallback). |

---

## 3. Data Ingestion & Administrative Maintenance Protocol

1. **Office Directory Verification:**
   - When an administrator imports or edits an office via `/admin/departments`, the record requires:
     - `source_url` (e.g., official municipal portal or LGD entry)
     - `verification_status` (`VERIFIED`, `NOT_YET_VERIFIED`, or `SAMPLE_DATA`)
     - `verified_at` (ISO timestamp)
   - If an official phone number cannot be independently verified from an `.in` / `.gov.in` domain or gazette notification, the field must remain empty or marked `"Not yet verified"`.
2. **Automated Routing Behavior:**
   - The routing service (`src/features/routing/router.ts`) prioritizes verified offices within the jurisdiction.
   - If no verified office exists within the maximum radius, the complaint is routed with status `UNDER_ADMIN_REVIEW` rather than randomly assigned to an unverified contact.
3. **Administrative CSV Import Validation:**
   - Duplicate detection on office code and LGD identifier.
   - Coordinate bounding checks within Indian geographic boundaries (Latitude: 6.0° to 37.6° N, Longitude: 68.7° to 97.4° E).
   - Valid phone and email formatting, rejecting generic placeholder values unless explicitly flagged as sample data.
