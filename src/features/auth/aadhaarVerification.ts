/**
 * Aadhaar Identity Verification Adapter & Privacy Safeguards
 *
 * Implements architectural safeguards in compliance with Section 4(3) of the
 * Aadhaar (Targeted Delivery of Financial and Other Subsidies, Benefits and Services) Act, 2016
 * and UIDAI Regulations:
 * 1. Mandatory Identity Verification Gate: Citizens must verify identity before accessing public redressal.
 * 2. Mobile OTP maintained as the primary, active, non-discriminatory identity verification method.
 * 3. Strict prohibition of storing raw 12-digit UID numbers, biometrics, or plain OTPs.
 * 4. Transparent status: Does not forge "UIDAI Verified" badges or simulate live government APIs.
 * 5. Plug-and-play adapter interface ready for authorized AUA/KUA production integration.
 */

export interface ProviderConfigurationStatus {
  isConfigured: boolean;
  providerName: string;
  deploymentMode: 'PROTOTYPE_UNCONFIGURED' | 'PRODUCTION_ACTIVE';
  statutoryBasis: string;
  statusLabel: string;
  activeMethod: 'MOBILE_OTP';
  pendingMethod: 'AADHAAR_EKYC_AUA';
  legalNotice: string;
}

export interface AadhaarInitiateResult {
  success: boolean;
  maskedAadhaar?: string;
  verificationToken?: string;
  verificationStatus: 'PENDING_AUTHORIZED_SERVICE' | 'REJECTED';
  legalDisclaimer: string;
  isOfficiallyVerified: boolean; // Explicit: formatting check is NOT official verification
  message: string;
  error?: string;
}

export interface SanitizedIdentityPayload {
  identity_verification_method: 'MOBILE_OTP' | 'VOLUNTARY_AADHAAR_TOKEN';
  aadhaar_masked?: string;
  aadhaar_ref_token?: string;
  is_officially_verified: boolean;
}

export class AadhaarVerificationAdapter {
  private static readonly LEGAL_NOTICE =
    'Mandatory Citizen Identity Verification Notice: FixMyCity requires verified citizen identity to prevent spam and ensure administrative accountability. In accordance with Section 4(3) of the Aadhaar Act, 2016, mobile OTP possession verification is fully authorized and operational. Live UIDAI Aadhaar e-KYC requires authorized AUA credentials which remain unconfigured in this prototype. Raw 12-digit Aadhaar numbers and biometric information are strictly prohibited from storage.';

  /**
   * Returns authoritative configuration state of the identity verification provider
   */
  public static getProviderConfigurationStatus(): ProviderConfigurationStatus {
    return {
      isConfigured: false,
      providerName: 'UIDAI Authentication User Agency (AUA) / KYC User Agency (KUA)',
      deploymentMode: 'PROTOTYPE_UNCONFIGURED',
      statutoryBasis: 'Pending designated State / Municipal Gazette Notification under Aadhaar Good Governance Rules',
      statusLabel: 'Prototype Mode — UIDAI Gateway Unconfigured',
      activeMethod: 'MOBILE_OTP',
      pendingMethod: 'AADHAAR_EKYC_AUA',
      legalNotice: this.LEGAL_NOTICE,
    };
  }

  /**
   * Validate 12-digit format and generate privacy-compliant token.
   * NOTE: Validating format syntax does NOT constitute official UIDAI identity verification.
   */
  public static initiateVerification(aadhaarInput: string): AadhaarInitiateResult {
    const cleanNumber = (aadhaarInput || '').replace(/[\s-]/g, '');

    // Format validation: Must be exactly 12 numeric digits
    if (!/^\d{12}$/.test(cleanNumber)) {
      return {
        success: false,
        verificationStatus: 'REJECTED',
        isOfficiallyVerified: false,
        legalDisclaimer: this.LEGAL_NOTICE,
        message: 'Invalid input. Aadhaar must consist of exactly 12 numeric digits.',
        error: 'Please enter a valid 12-digit Aadhaar number.',
      };
    }

    // Mask all but last 4 digits
    const maskedAadhaar = `XXXXXXXX${cleanNumber.slice(8, 12)}`;

    // Generate non-reversible session token for downstream authorized AUA/KUA flow
    const verificationToken = `AUA-TOKEN-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;

    return {
      success: true,
      maskedAadhaar,
      verificationToken,
      // Honest status: Civic prototype has not connected a licensed AUA/KUA backend
      verificationStatus: 'PENDING_AUTHORIZED_SERVICE',
      isOfficiallyVerified: false, // Entering a 12-digit number is NOT identity verification!
      legalDisclaimer: this.LEGAL_NOTICE,
      message:
        '12-digit structure is valid. However, live UIDAI verification requires a licensed AUA gateway. Please complete mandatory verification via Mobile OTP to access the portal.',
    };
  }

  /**
   * Sanitizes payloads to guarantee plain 12-digit numbers are NEVER persisted to database, logs, or storage
   */
  public static sanitizeIdentityPayload(input: {
    aadhaarNumber?: string;
    verificationToken?: string;
  }): SanitizedIdentityPayload {
    if (!input.aadhaarNumber) {
      return {
        identity_verification_method: 'MOBILE_OTP',
        is_officially_verified: false,
      };
    }

    const cleanNumber = input.aadhaarNumber.replace(/[\s-]/g, '');
    const maskedAadhaar = cleanNumber.length === 12 ? `XXXXXXXX${cleanNumber.slice(8, 12)}` : undefined;

    return {
      identity_verification_method: 'VOLUNTARY_AADHAAR_TOKEN',
      aadhaar_masked: maskedAadhaar,
      aadhaar_ref_token: input.verificationToken || undefined,
      is_officially_verified: false, // Remains false until live AUA confirms
    };
  }

  /**
   * Returns current statutory disclaimer
   */
  public static getLegalDisclaimer(): string {
    return this.LEGAL_NOTICE;
  }
}
