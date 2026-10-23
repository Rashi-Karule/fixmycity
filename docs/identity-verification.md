# Mandatory Identity Verification Architecture & Aadhaar Compliance Framework

**Document Status:** Production Reference & Architectural Specification  
**Platform:** FixMyCity — India-Wide Civic Issue Reporting & Resolution Platform  
**Compliance Standard:** Aadhaar (Targeted Delivery of Financial and Other Subsidies, Benefits and Services) Act, 2016 (as amended 2019) & UIDAI Regulations  

---

## 1. Mandatory Identity Verification Gate

To enforce public accountability, eliminate frivolous/automated grievance spam, and enable legitimate citizen audit trails, **citizen identity verification is a mandatory requirement** in FixMyCity.

The identity-verification architecture decouples the **mandatory verification gate** from specific external provider implementations:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 MANDATORY CITIZEN IDENTITY VERIFICATION GATE                │
├──────────────────────────────────────┬──────────────────────────────────────┤
│  Method 1: Verified Mobile OTP       │  Method 2: Statutory Aadhaar e-KYC   │
│  (Active & Operational Gateway)      │  (Provider State: Unconfigured)      │
├──────────────────────────────────────┼──────────────────────────────────────┤
│  - 10-Digit Indian Mobile Number     │  - Awaiting State/Municipal Gazette  │
│  - Single-use 6-Digit SMS Security   │    Notification under Section 4(4)   │
│    Token                             │  - Requires official AUA/KUA license │
│  - Verified possession identity      │  - Syntax inspection sandbox only    │
│    status: VERIFIED_MOBILE_OTP       │  - Never marks format as verified UID│
└──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## 2. Statutory Legal Framework (Aadhaar Act, 2016)

1. **Mandatory Identity vs. Voluntary Aadhaar Provision:**
   - Under Section 4(3) of the Aadhaar Act, 2016, no individual may be denied a general public service (such as reporting a pothole, street light outage, or garbage dump) solely for lack of an Aadhaar number, unless that service is supported by an explicit parliamentary statute or Section 7 notification.
   - Therefore, while **identity verification is mandatory**, the platform provides **Mobile OTP Possession Verification** as an active, legally compliant method so that no citizen is disenfranchised.

2. **Format Checking vs. Real Identity Verification:**
   - Entering a 12-digit number in an input box **does NOT constitute identity verification**.
   - True Aadhaar authentication requires a digital payload signed by an authorized Authentication User Agency (AUA), dispatched through an Authentication Service Agency (ASA) lease-line to the Central Identities Data Repository (CIDR), with registered biometric or OTP consent.
   - FixMyCity explicitly avoids false verified badges, simulated UIDAI responses, or claiming that syntax validation represents a verified citizen identity.

3. **Informed Consent & Clear Status:**
   - The platform transparently displays the **Prototype Mode Configuration State**:
     - *Provider Status:* `UNCONFIGURED (Prototype Evaluation Mode)`
     - *Statutory Authority:* Pending designated State / Municipal Gazette Notification.
     - *Active Alternative:* Citizens authenticate via the operational Mobile OTP gate.

---

## 3. Strict Data Protection & Non-Storage Safeguards

| Component | Technical Rule | Legal Rationale |
| :--- | :--- | :--- |
| **Raw 12-Digit Aadhaar Numbers** | **STRICTLY PROHIBITED FROM STORAGE** | Under Section 29 of the Aadhaar Act, storing unencrypted, unmasked 12-digit UID numbers in ordinary databases without an authorized Aadhaar Vault is a criminal offence. |
| **Aadhaar OTPs** | **NEVER STORED OR PROXIED** | One-time pins generated for UIDAI authentication must never be intercepted or persisted. |
| **Biometric Information** | **STRICTLY PROHIBITED** | Core biometric data (fingerprints, iris scans, facial descriptors) is never collected or stored. |
| **Masked Reference Tokens** | **ONLY MASKED FORM PERMITTED** | When format evaluation is performed, only masked tokens (e.g., `XXXXXXXX1012`) and ephemeral cryptographic session hashes are handled. |
| **UIDAI Verified Badges** | **FORBIDDEN UNLESS CONFIRMED BY AUA** | The UI will never render a "UIDAI Verified" badge based solely on client-side number input. |

---

## 4. Government Deployment Requirements for Official Aadhaar e-KYC

Before an authorized state or municipal authority deploying FixMyCity can activate live Aadhaar e-KYC:

1. **Statutory Gazette Notification:**
   Issue a state government gazette notification or identify the enabling statutory provision permitting Aadhaar authentication for municipal grievances under the *Aadhaar Authentication for Good Governance (Social Welfare, Innovation, Knowledge) Rules*.
2. **AUA / KUA Licensing:**
   Execute a formal onboarding agreement with UIDAI as an Authentication User Agency (AUA) or integrate via an authorized State e-Governance Mission Team (CeG / IT Dept) acting as a Sub-AUA.
3. **Hardware Security Module (HSM):**
   Deploy certified HSMs for encryption of PID blocks in compliance with UIDAI specifications.
4. **Certified Aadhaar Vault:**
   Implement an isolated, tamper-proof Aadhaar Vault for storing any reference keys mapped to the internal citizen user UUID.
