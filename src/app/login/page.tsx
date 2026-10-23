'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PublicNav from '@/components/layout/PublicNav';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/features/auth/AuthContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { AadhaarVerificationAdapter } from '@/features/auth/aadhaarVerification';
import { UserRole } from '@/types';
import {
  User,
  Building2,
  SlidersHorizontal,
  Phone,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  Info,
} from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get('role')?.toUpperCase() as UserRole) || 'CITIZEN';

  const { loginCitizen, loginEmployee, loginAdmin } = useAuth();
  const { lang, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<UserRole>(initialRole);

  // Citizen mandatory identity verification
  const [citizenAuthMethod, setCitizenAuthMethod] = useState<'mobile' | 'aadhaar'>('mobile');
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('123456');

  // Aadhaar sandbox format inspector
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [aadhaarInspectResult, setAadhaarInspectResult] = useState<{
    tested: boolean;
    validFormat: boolean;
    masked?: string;
    message: string;
  } | null>(null);

  // Employee credentials
  const [employeeId, setEmployeeId] = useState('EMP-PWD-409');
  const [employeePassword, setEmployeePassword] = useState('Officer@123');

  // Admin credentials
  const [adminId, setAdminId] = useState('ADM-EXEC-001');
  const [adminPassword, setAdminPassword] = useState('Admin@123');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providerStatus = AadhaarVerificationAdapter.getProviderConfigurationStatus();

  const handleTestAadhaarFormat = () => {
    if (!aadhaarInput.trim()) {
      setAadhaarInspectResult({
        tested: true,
        validFormat: false,
        message:
          lang === 'hi'
            ? 'कृपया 12-अंकीय आधार संख्या प्रारूप दर्ज करें।'
            : 'Please enter a 12-digit Aadhaar number to evaluate format validation.',
      });
      return;
    }

    const res = AadhaarVerificationAdapter.initiateVerification(aadhaarInput);
    setAadhaarInspectResult({
      tested: true,
      validFormat: res.success,
      masked: res.maskedAadhaar,
      message: res.message,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === 'CITIZEN') {
        if (citizenAuthMethod === 'aadhaar') {
          setError(
            lang === 'hi'
              ? 'आधिकारिक यूआईडीएआई आधार AUA गेटवे इस प्रोटोटाइप में कॉन्फ़िगर नहीं है। कृपया सक्रिय एवं अधिकृत मोबाइल OTP विधि द्वारा पहचान सत्यापित करें।'
              : 'Direct UIDAI Aadhaar AUA gateway is unconfigured in this prototype. To fulfill mandatory citizen identity verification, please proceed via Mobile OTP.'
          );
          setLoading(false);
          return;
        }

        const res = await loginCitizen(phone, otp);
        if (res.success) {
          router.push('/citizen/dashboard');
        } else {
          setError(res.error || 'Failed to authenticate mobile OTP.');
        }
      } else if (activeTab === 'EMPLOYEE') {
        const res = await loginEmployee(employeeId, employeePassword);
        if (res.success) {
          router.push('/employee/dashboard');
        } else {
          setError(res.error || 'Failed to authenticate employee credentials.');
        }
      } else if (activeTab === 'ADMIN') {
        const res = await loginAdmin(adminId, adminPassword);
        if (res.success) {
          router.push('/admin/dashboard');
        } else {
          setError(res.error || 'Failed to authenticate administrator credentials.');
        }
      }
    } catch {
      setError('An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 sm:py-16 w-full space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-[#17304F] text-white flex items-center justify-center mx-auto shadow-sm">
          <ShieldCheck className="w-7 h-7 text-[#E07B2E]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17304F] font-heading">
          {lang === 'hi' ? 'पोर्टल में प्रवेश करें' : 'Sign In to FixMyCity'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          {lang === 'hi'
            ? 'अपनी अधिकृत भूमिका का चयन करें और सुरक्षित नागरिक पहचान सत्यापन के साथ आगे बढ़ें।'
            : 'Select your role and authenticate with verified civic credentials.'}
        </p>
      </div>

      {/* Role Tabs */}
      <div className="grid grid-cols-3 gap-1.5 bg-slate-200/80 p-1.5 rounded-xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setActiveTab('CITIZEN');
            setError(null);
          }}
          className={`py-2 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
            activeTab === 'CITIZEN'
              ? 'bg-white text-[#17304F] shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5 text-amber-500" />
          <span>{lang === 'hi' ? 'नागरिक पोर्टल' : 'Citizen'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('EMPLOYEE');
            setError(null);
          }}
          className={`py-2 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
            activeTab === 'EMPLOYEE'
              ? 'bg-white text-[#17304F] shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-blue-500" />
          <span>{lang === 'hi' ? 'विभागीय कर्मचारी' : 'Staff'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('ADMIN');
            setError(null);
          }}
          className={`py-2 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
            activeTab === 'ADMIN'
              ? 'bg-white text-[#17304F] shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />
          <span>{lang === 'hi' ? 'प्रशासक' : 'Admin'}</span>
        </button>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* CITIZEN FORM: MANDATORY IDENTITY VERIFICATION GATE */}
          {activeTab === 'CITIZEN' && (
            <div className="space-y-4">
              {/* Dedicated Step Header */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                      {lang === 'hi' ? 'अनिवार्य पहचान चरण' : 'Mandatory Verification'}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-[#17304F] font-heading">
                      {lang === 'hi' ? 'नागरिक पहचान सत्यापन' : 'Citizen Identity Verification'}
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {lang === 'hi' ? 'गेटवे सक्रिय' : 'Active Gate'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {lang === 'hi'
                    ? 'नागरिक शिकायतों की आधिकारिक जवाबदेही एवं फर्जी शिकायतों की रोकथाम हेतु पहचान सत्यापन अनिवार्य है। इस तैनाती में अधिकृत मोबाइल OTP गेटवे का उपयोग किया जाता है।'
                    : 'To enforce administrative accountability and prevent automated grievance spam, citizen identity verification is required prior to filing.'}
                </p>
              </div>

              {/* Identity Verification Method Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {lang === 'hi' ? 'पहचान सत्यापन विधि चुनें' : 'Select Verification Gateway Method'} *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Method 1: Mobile OTP */}
                  <button
                    type="button"
                    onClick={() => {
                      setCitizenAuthMethod('mobile');
                      setError(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      citizenAuthMethod === 'mobile'
                        ? 'border-[#E07B2E] bg-orange-50/40 ring-1 ring-[#E07B2E]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-[#E07B2E]" />
                        <span className="text-xs font-bold text-slate-900">
                          {lang === 'hi' ? 'मोबाइल OTP' : 'Mobile OTP'}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {lang === 'hi' ? 'सक्रिय एवं अधिकृत' : 'Authorized'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      {lang === 'hi'
                        ? 'सत्यापित मोबाइल स्वामित्व। इस सार्वजनिक सेवा हेतु कानूनी रूप से मान्य।'
                        : 'Verified mobile possession. Legally valid authentication for civic reporting.'}
                    </p>
                  </button>

                  {/* Method 2: Aadhaar e-KYC */}
                  <button
                    type="button"
                    onClick={() => {
                      setCitizenAuthMethod('aadhaar');
                      setError(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      citizenAuthMethod === 'aadhaar'
                        ? 'border-[#17304F] bg-slate-50 ring-1 ring-[#17304F]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-bold text-slate-900">
                          {lang === 'hi' ? 'आधार e-KYC' : 'Aadhaar e-KYC'}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {lang === 'hi' ? 'एकीकरण लंबित' : 'Pending Gateway'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      {lang === 'hi'
                        ? 'धारा 4(3) आधार अधिनियम के अधीन अधिकृत AUA गेटवे आवश्यक है।'
                        : 'Requires authorized AUA license under Section 4(3) of Aadhaar Act.'}
                    </p>
                  </button>
                </div>
              </div>

              {/* METHOD 1: MOBILE OTP FORM */}
              {citizenAuthMethod === 'mobile' && (
                <div className="space-y-3.5 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-[#17304F] uppercase tracking-wider mb-1.5">
                      {lang === 'hi' ? 'पंजीकृत मोबाइल नंबर (10 अंक)' : '10-Digit Mobile Number'} *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter 10-digit mobile number"
                        className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#E07B2E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17304F] uppercase tracking-wider mb-1.5">
                      {lang === 'hi' ? 'पहचान सत्यापन OTP' : 'Verification OTP'} *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        className="w-full pl-9 pr-3 py-2 text-xs font-mono tracking-widest rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#E07B2E]"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {lang === 'hi'
                        ? 'प्रोटोटाइप मूल्यांकन हेतु परीक्षण OTP 123456 का उपयोग करें।'
                        : 'A 6-digit verification code has been dispatched. For prototype evaluation, use 123456.'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>{lang === 'hi' ? 'सत्यापन गारंटी:' : 'Verification Assurance:'}</strong>{' '}
                      {lang === 'hi'
                        ? 'OTP पुष्टि के उपरांत नागरिक का संपर्क स्वामित्व (MOBILE_OTP_VERIFIED) के रूप में प्रमाणित हो जाता है।'
                        : 'Successful OTP submission verifies citizen possession identity as MOBILE_OTP_VERIFIED.'}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#E07B2E] hover:bg-[#c9671d] text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 mt-2"
                  >
                    <span>
                      {loading
                        ? (lang === 'hi' ? 'सत्यापित हो रहा है...' : 'Verifying Identity...')
                        : (lang === 'hi' ? 'पहचान सत्यापित करें और प्रवेश करें' : 'Verify Identity & Enter Citizen Portal')}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* METHOD 2: STATUTORY AADHAAR CONFIGURATION STATE */}
              {citizenAuthMethod === 'aadhaar' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  {/* Configuration Status Card */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                        <Lock className="w-4 h-4 text-[#17304F]" />
                        <span>{lang === 'hi' ? 'सांविधिक आधार e-KYC प्रदाता स्थिति' : 'Statutory Aadhaar Provider Configuration State'}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        {providerStatus.deploymentMode}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-white p-3 rounded-lg border border-slate-200 text-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Provider Specification</span>
                        <span className="font-semibold text-slate-900">{providerStatus.providerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Legal Authority Basis</span>
                        <span className="text-slate-800">{providerStatus.statutoryBasis}</span>
                      </div>
                      <div className="sm:col-span-2 pt-1 border-t border-slate-100 text-slate-600">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Privacy Safeguard Notice</span>
                        <span>{providerStatus.legalNotice}</span>
                      </div>
                    </div>
                  </div>

                  {/* Format Validation & Masking Inspector */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        {lang === 'hi' ? '12-अंकीय प्रारूप जाँच एवं टोकनीकरण सैंडबॉक्स' : 'Format Verification & Masking Sandbox'}
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">Syntax Check Only</span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={14}
                        value={aadhaarInput}
                        onChange={(e) => setAadhaarInput(e.target.value)}
                        placeholder="e.g. 9876 5432 1012"
                        className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#17304F]"
                      />
                      <button
                        type="button"
                        onClick={handleTestAadhaarFormat}
                        className="px-3 py-2 text-xs font-bold rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors shrink-0"
                      >
                        {lang === 'hi' ? 'प्रारूप जांचें' : 'Evaluate Format'}
                      </button>
                    </div>

                    {aadhaarInspectResult && (
                      <div
                        className={`p-2.5 rounded-lg text-[11px] space-y-1 ${
                          aadhaarInspectResult.validFormat
                            ? 'bg-blue-50 border border-blue-200 text-blue-900'
                            : 'bg-red-50 border border-red-200 text-red-900'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5" />
                          <span>
                            {aadhaarInspectResult.validFormat
                              ? (lang === 'hi' ? 'प्रारूप मान्य (पहचान असत्यापित)' : 'Format Valid (Identity Unverified)')
                              : (lang === 'hi' ? 'अमान्य प्रारूप' : 'Invalid Format')}
                          </span>
                        </div>
                        {aadhaarInspectResult.masked && (
                          <div className="font-mono text-xs font-bold text-slate-800">
                            Masked Reference Token: {aadhaarInspectResult.masked}
                          </div>
                        )}
                        <p className="text-[10.5px] leading-relaxed text-slate-700">
                          {aadhaarInspectResult.message}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Primary Fallback Action to avoid citizen disenfranchisement */}
                  <div className="pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setCitizenAuthMethod('mobile')}
                      className="w-full py-2.5 px-3 rounded-lg bg-[#E07B2E] text-white font-bold text-xs hover:bg-[#c9671d] transition-colors flex items-center justify-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      <span>{lang === 'hi' ? 'सक्रिय मोबाइल OTP गेटवे द्वारा आगे बढ़ें' : 'Authenticate via Active Mobile OTP Gate'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EMPLOYEE FORM */}
          {activeTab === 'EMPLOYEE' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#17304F] uppercase tracking-wider mb-1.5">
                  {lang === 'hi' ? 'कर्मचारी आईडी / Department ID' : 'Department Employee ID'} *
                </label>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="EMP-PWD-409"
                  className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17304F] uppercase tracking-wider mb-1.5">
                  {lang === 'hi' ? 'पासवर्ड' : 'Department Password'} *
                </label>
                <input
                  type="password"
                  required
                  value={employeePassword}
                  onChange={(e) => setEmployeePassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600"
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  Verified departmental credentials issued by Municipal IT Admin.
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? 'Authenticating...' : 'Enter Employee Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* ADMIN FORM */}
          {activeTab === 'ADMIN' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#17304F] uppercase tracking-wider mb-1.5">
                  {lang === 'hi' ? 'प्रशासक आईडी / Admin ID' : 'Municipal Administrator ID'} *
                </label>
                <input
                  type="text"
                  required
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="ADM-EXEC-001"
                  className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-300 focus:outline-hidden focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17304F] uppercase tracking-wider mb-1.5">
                  {lang === 'hi' ? 'पासवर्ड' : 'Admin Security Key'} *
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-purple-600"
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  Root municipal administrator access for SLA oversight.
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? 'Authenticating...' : 'Enter Executive Command Center'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <PublicNav />
      <main className="flex-1 flex items-center justify-center">
        <Suspense
          fallback={
            <div className="p-8 text-center text-xs text-slate-500">
              Loading Authentication Gateway...
            </div>
          }
        >
          <LoginContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
