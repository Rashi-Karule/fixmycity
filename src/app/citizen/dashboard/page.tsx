'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Complaint, CivicCategory } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { getSlaStatus } from '@/features/escalation/escalationEngine';
import CitizenDashboardMotion from '@/components/citizen/CitizenDashboardMotion';
import {
  Camera,
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Search,
  Sparkles,
  ThumbsUp,
  ExternalLink,
  Building,
  Check,
  Compass,
  AlertCircle,
  PlusCircle,
  Trash2,
  Droplets,
  Construction,
  Lightbulb,
  Car,
  Trees,
  HeartPulse,
  Scale,
  Users,
} from 'lucide-react';

const CIVIC_CATEGORIES: {
  key: CivicCategory;
  en: string;
  hi: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bgColor: string;
  borderColor: string;
}[] = [
  { key: 'WASTE_MANAGEMENT', en: 'Waste Management', hi: 'कचरा प्रबंधन', icon: Trash2, accentColor: 'text-amber-600', bgColor: 'bg-amber-50/70 hover:bg-amber-100/80', borderColor: 'border-amber-200' },
  { key: 'WATER_SUPPLY', en: 'Water Supply', hi: 'जल आपूर्ति', icon: Droplets, accentColor: 'text-blue-600', bgColor: 'bg-blue-50/70 hover:bg-blue-100/80', borderColor: 'border-blue-200' },
  { key: 'ROADS_INFRASTRUCTURE', en: 'Roads & Infrastructure', hi: 'सड़क और आधारभूत संरचना', icon: Construction, accentColor: 'text-orange-600', bgColor: 'bg-orange-50/70 hover:bg-orange-100/80', borderColor: 'border-orange-200' },
  { key: 'STREET_LIGHTING', en: 'Street Lighting & Electricity', hi: 'सड़क रोशनी और बिजली', icon: Lightbulb, accentColor: 'text-yellow-600', bgColor: 'bg-yellow-50/70 hover:bg-yellow-100/80', borderColor: 'border-yellow-200' },
  { key: 'TRAFFIC_TRANSPORT', en: 'Traffic & Transportation', hi: 'यातायात और परिवहन', icon: Car, accentColor: 'text-indigo-600', bgColor: 'bg-indigo-50/70 hover:bg-indigo-100/80', borderColor: 'border-indigo-200' },
  { key: 'ENVIRONMENT_POLLUTION', en: 'Environment & Pollution', hi: 'पर्यावरण और प्रदूषण', icon: Trees, accentColor: 'text-emerald-600', bgColor: 'bg-emerald-50/70 hover:bg-emerald-100/80', borderColor: 'border-emerald-200' },
  { key: 'PUBLIC_HEALTH', en: 'Public Health & Sanitation', hi: 'सार्वजनिक स्वास्थ्य और स्वच्छता', icon: HeartPulse, accentColor: 'text-rose-600', bgColor: 'bg-rose-50/70 hover:bg-rose-100/80', borderColor: 'border-rose-200' },
  { key: 'SAFETY_GOVERNANCE', en: 'Safety & Governance', hi: 'सुरक्षा और शासन', icon: Scale, accentColor: 'text-purple-600', bgColor: 'bg-purple-50/70 hover:bg-purple-100/80', borderColor: 'border-purple-200' },
];

export default function CitizenDashboardPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/complaints')
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setComplaints(d.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Filter complaints derived directly from real database records
  const myComplaints = complaints.filter(
    (c) => c.citizen_id === user?.id || (user?.phone && c.citizen_phone === user.phone)
  );

  const resolvedComplaints = complaints.filter((c) => c.status === 'RESOLVED');
  const inProgressComplaints = complaints.filter((c) => c.status === 'IN_PROGRESS');
  const pendingComplaints = complaints.filter((c) => c.status === 'PENDING' || c.status === 'UNDER_ADMIN_REVIEW');

  const totalPublic = complaints.length;
  // SLA / Resolution compliance mathematically derived:
  const resolutionRate = totalPublic > 0 ? Math.round((resolvedComplaints.length / totalPublic) * 100) : 100;

  // Derive distinct jurisdictions count from actual complaint records
  const distinctDistricts = new Set(complaints.map((c) => c.district).filter(Boolean));
  const distinctLocalBodies = new Set(complaints.map((c) => c.local_body_name).filter(Boolean));
  const activeJurisdictionsCount = Math.max(1, distinctLocalBodies.size);

  const router = useRouter();
  const [quickTrackId, setQuickTrackId] = useState('');

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTrackId.trim()) {
      router.push(`/track?id=${encodeURIComponent(quickTrackId.trim())}`);
    }
  };

  const overdueOrEscalatedComplaints = complaints.filter(
    (c) => c.is_escalated || (c.status !== 'RESOLVED' && getSlaStatus(c.deadline).isOverdue)
  );

  return (
    <div className="citizen-dashboard-wrapper min-h-screen">
      {/* ============================================================== */}
      {/* 1. RESTORED FULL-WIDTH EDGE-TO-EDGE RECTANGULAR HERO SECTION     */}
      {/* ============================================================== */}
      <section className="relative w-full overflow-hidden bg-[#091527] text-white border-b border-[#1b3a5d]">
        {/* Scoped Canvas Motion Background — Strictly restricted to /citizen/dashboard */}
        <CitizenDashboardMotion />

        {/* Dark vignette/gradient overlay for optimal contrast and readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#091527]/95 via-[#0d223c]/85 to-[#091527]/92 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column (58% width): Context, Restored Headline, Description, Actions, Tracker */}
            <div className="lg:col-span-7 space-y-6">
              {/* Context / Citizen Greeting */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md border border-white/15 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {lang === 'hi' ? 'नागरिक सेवा केंद्र' : 'National Citizen Grievance Portal'} &bull;{' '}
                  <strong className="text-amber-300">{user?.name || 'Aarav Sharma'}</strong>
                </span>
              </div>

              {/* Exact Restored Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-heading leading-[1.18] text-white">
                {lang === 'hi' ? (
                  <>
                    नागरिक सशक्तिकरण। <br className="hidden sm:inline" />
                    <span className="text-[#E07B2E]">नगरपालिका उत्तरदायित्व का प्रवर्तन</span>
                  </>
                ) : (
                  <>
                    Empowering Citizens. <br className="hidden sm:inline" />
                    <span className="text-[#E07B2E]">Enforcing Municipal Accountability</span>
                  </>
                )}
              </h1>

              {/* Concise Explanation */}
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl font-sans">
                {lang === 'hi'
                  ? 'नागरिक बुनियादी ढांचे की समस्याएं सीधे संबंधित नगर निकाय को रिपोर्ट करें, उनकी प्रगति को रीयल-टाइम ट्रैक करें और प्रमाणित फील्ड समाधान देखें।'
                  : 'Report civic infrastructure problems directly to the responsible municipal department. Every complaint is tracked against strict SLA deadlines with automated escalation.'}
              </p>

              {/* Core Actions */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Primary orange Report an Issue action */}
                  <Link
                    href="/citizen/report"
                    id="btn-report-issue"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#E07B2E] hover:bg-[#c96920] text-white font-extrabold text-xs sm:text-sm shadow-lg hover:shadow-orange-500/25 transition-all group"
                  >
                    <PlusCircle className="w-4 h-4 text-white group-hover:rotate-90 transition-transform" />
                    <span>{lang === 'hi' ? 'समस्या दर्ज करें' : 'Report an Issue'}</span>
                  </Link>

                  {/* Secondary Explore Community Map action */}
                  <Link
                    href="/citizen/community"
                    id="btn-explore-map"
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#17304F]/90 hover:bg-[#203f66] text-slate-100 font-semibold text-xs sm:text-sm border border-[#2d527c] backdrop-blur-xs transition-all shadow-sm"
                  >
                    <Compass className="w-4 h-4 text-sky-400" />
                    <span>{lang === 'hi' ? 'सामुदायिक मानचित्र देखें' : 'Explore Community Map'}</span>
                  </Link>
                </div>

                {/* Direct quick reporting shortcuts */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-0.5">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {lang === 'hi' ? 'रिपोर्टिंग मोड:' : 'Reporting options:'}
                  </span>
                  <Link
                    href="/citizen/report?mode=ai"
                    id="btn-quick-ai"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 hover:bg-white/15 text-amber-300 text-[11px] font-semibold border border-white/10 transition-colors"
                  >
                    <Camera className="w-3 h-3 text-amber-300" />
                    <span>AI Photo</span>
                  </Link>
                  <Link
                    href="/citizen/report?mode=manual"
                    id="btn-quick-manual"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 hover:bg-white/15 text-slate-200 text-[11px] font-semibold border border-white/10 transition-colors"
                  >
                    <FileText className="w-3 h-3 text-slate-300" />
                    <span>Manual Form</span>
                  </Link>
                </div>
              </div>

              {/* Compact Quick Complaint Status Tracker */}
              <div className="bg-[#0b1a2c]/85 border border-[#23446b]/80 rounded-xl p-4 max-w-lg backdrop-blur-md shadow-md">
                <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === 'hi' ? 'त्वरित शिकायत स्थिति ट्रैकर:' : 'Quick Complaint Status Tracker:'}</span>
                </div>
                <form onSubmit={handleQuickTrack} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={lang === 'hi' ? 'उदा. FMC-2026-8821' : 'e.g. FMC-2026-8821'}
                    value={quickTrackId}
                    onChange={(e) => setQuickTrackId(e.target.value)}
                    id="quick-track-input"
                    className="flex-1 px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/15 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-hidden focus:border-[#E07B2E] transition-colors"
                  />
                  <button
                    type="submit"
                    id="btn-quick-track-submit"
                    className="px-5 py-2.5 rounded-lg bg-[#E07B2E] hover:bg-[#c96920] text-white text-xs font-bold transition-all shadow-sm shrink-0"
                  >
                    {lang === 'hi' ? 'ट्रैक करें' : 'Track'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column (42% width): Four Distinct Compact Statistics Cards (2x2 Grid) */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Total Grievances */}
              <div className="bg-[#10243d]/85 border border-[#23446b]/80 hover:border-[#386b9e] rounded-xl p-5 shadow-lg backdrop-blur-md transition-all">
                <div className="flex items-center justify-between text-slate-300 text-xs font-semibold">
                  <span>{lang === 'hi' ? 'कुल शिकायतें' : 'Total Grievances'}</span>
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white mt-2">
                  {totalPublic}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {lang === 'hi' ? 'नागरिकों द्वारा दर्ज' : 'Reported by citizens'}
                </div>
              </div>

              {/* Card 2: Resolved On-Time */}
              <div className="bg-[#10243d]/85 border border-[#23446b]/80 hover:border-emerald-500/50 rounded-xl p-5 shadow-lg backdrop-blur-md transition-all">
                <div className="flex items-center justify-between text-slate-300 text-xs font-semibold">
                  <span>{lang === 'hi' ? 'समय पर हल' : 'Resolved On-Time'}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-400 mt-2">
                  {resolvedComplaints.length}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {lang === 'hi' ? 'फोटो साक्ष्य सहित सत्यापित' : 'Verified with photo evidence'}
                </div>
              </div>

              {/* Card 3: In Resolution Queue */}
              <div className="bg-[#10243d]/85 border border-[#23446b]/80 hover:border-amber-500/50 rounded-xl p-5 shadow-lg backdrop-blur-md transition-all">
                <div className="flex items-center justify-between text-slate-300 text-xs font-semibold">
                  <span>{lang === 'hi' ? 'प्रक्रिया में' : 'In Resolution Queue'}</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-400 mt-2">
                  {inProgressComplaints.length + pendingComplaints.length}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {lang === 'hi' ? 'SLA समयसीमा के तहत' : 'Under SLA enforcement'}
                </div>
              </div>

              {/* Card 4: Overdue / Escalated */}
              <div className="bg-[#10243d]/85 border border-[#23446b]/80 hover:border-rose-500/50 rounded-xl p-5 shadow-lg backdrop-blur-md transition-all">
                <div className="flex items-center justify-between text-slate-300 text-xs font-semibold">
                  <span>{lang === 'hi' ? 'अतिदेय / अग्रेषित' : 'Overdue / Escalated'}</span>
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-rose-400 mt-2">
                  {overdueOrEscalatedComplaints.length}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {lang === 'hi' ? 'प्रशासन को सूचित' : 'Flagged to Municipal Admin'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* REST OF CITIZEN DASHBOARD CONTENT (MAX-W-7XL CONTAINER)         */}
      {/* ============================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">

      {/* ============================================================== */}
      {/* 2. CIVIC IMPACT METRICS BAR (Derived purely from database)      */}
      {/* ============================================================== */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#E07B2E]" />
            <span>{lang === 'hi' ? 'सार्वजनिक समाधान एवं SLA प्रदर्शन आँकड़े' : 'Platform Civic Impact & Resolution Statistics'}</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            {lang === 'hi' ? 'सक्रिय स्थानीय निकाय:' : 'Supported Local Bodies:'}{' '}
            <strong className="text-slate-800">{activeJurisdictionsCount}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="px-2 pt-2 sm:pt-0">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              {lang === 'hi' ? 'कुल दर्ज शिकायतें' : 'Total Grievances'}
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#17304F] mt-1">
              {totalPublic}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Database verified records</div>
          </div>

          <div className="px-2 pt-4 sm:pt-0">
            <div className="text-xs text-emerald-700 uppercase tracking-wider font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'hi' ? 'सफलतापूर्वक समाधान' : 'Resolved on Field'}</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 mt-1">
              {resolvedComplaints.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">With official photo proof</div>
          </div>

          <div className="px-2 pt-4 sm:pt-0">
            <div className="text-xs text-amber-700 uppercase tracking-wider font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{lang === 'hi' ? 'कार्य प्रगति पर' : 'Active Field Work'}</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-600 mt-1">
              {inProgressComplaints.length + pendingComplaints.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Under SLA timeline</div>
          </div>

          <div className="px-2 pt-4 sm:pt-0">
            <div className="text-xs text-blue-700 uppercase tracking-wider font-semibold">
              {lang === 'hi' ? 'SLA अनुपालन दर' : 'SLA Compliance Rate'}
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-600 mt-1">
              {resolutionRate}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">(Resolved / Total) &times; 100</div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. FEATURED RESOLUTION STORY (Real Resolution Evidence)         */}
      {/* ============================================================== */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h2 className="text-xl font-bold text-slate-900 font-heading">
                {lang === 'hi' ? 'प्रमाणित समाधान एवं कार्य रिपोर्ट' : 'Verified Field Resolution Proofs'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'hi'
                ? 'विभागीय टीमों द्वारा स्थल पर किए गए वास्तविक कार्य एवं समाधान साक्ष्य।'
                : 'Genuine civic resolutions with verified field work summaries and official photo evidence.'}
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            {resolvedComplaints.length} {lang === 'hi' ? 'सत्यापित समाधान' : 'Verified Solutions'}
          </span>
        </div>

        {resolvedComplaints.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-600 text-xs space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-800">
              {lang === 'hi' ? 'वर्तमान में कोई सत्यापित समाधान प्रदर्शित करने योग्य नहीं है।' : 'No verified resolution stories available yet.'}
            </p>
            <p className="text-slate-500 max-w-md mx-auto">
              {lang === 'hi'
                ? 'विभागीय टीमों द्वारा शिकायतों का निवारण किए जाने और फोटो प्रमाण अपलोड होने पर वे यहां प्रदर्शित होंगे।'
                : 'Verified resolution stories with photo evidence will appear here as public works departments complete assigned tasks.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Main Featured Resolution Card */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                {/* Photo Proof Header */}
                <div className="relative h-60 sm:h-72 bg-slate-900 w-full overflow-hidden flex items-center justify-center">
                  {resolvedComplaints[0].resolution_image_url ? (
                    <img
                      src={resolvedComplaints[0].resolution_image_url}
                      alt="Official resolution proof"
                      className="w-full h-full object-cover"
                    />
                  ) : resolvedComplaints[0].image_urls && resolvedComplaints[0].image_urls[0] ? (
                    <img
                      src={resolvedComplaints[0].image_urls[0]}
                      alt="Civic issue photo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-slate-400 text-xs flex flex-col items-center gap-1">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                      <span>Verified Field Resolution</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-sm">
                      <Check className="w-3 h-3" />
                      <span>FIELD VERIFIED RESOLUTION</span>
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-black/70 text-white backdrop-blur-xs">
                      {resolvedComplaints[0].tracking_id}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryBadge category={resolvedComplaints[0].category} />
                    <span className="text-[11px] text-slate-500 font-mono">
                      {resolvedComplaints[0].local_body_name || 'Designated Public Authority'}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                    {resolvedComplaints[0].title}
                  </h3>

                  {resolvedComplaints[0].resolution_notes && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-100 text-xs text-emerald-900 space-y-1">
                      <strong className="font-semibold block flex items-center gap-1 text-emerald-800">
                        <Check className="w-3.5 h-3.5" />
                        <span>Public Work &amp; Redressal Summary:</span>
                      </strong>
                      <p className="leading-relaxed">{resolvedComplaints[0].resolution_notes}</p>
                    </div>
                  )}

                  <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{resolvedComplaints[0].address}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  Resolved: {resolvedComplaints[0].resolved_at ? new Date(resolvedComplaints[0].resolved_at).toLocaleDateString() : 'Recently verified'}
                </span>
                <Link
                  href={`/track?id=${resolvedComplaints[0].tracking_id}`}
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <span>View Complete Audit Trail</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Contextual Accountability Panel on the Right */}
            <div className="lg:col-span-4 bg-gradient-to-br from-slate-900 to-[#17304F] text-white rounded-2xl p-6 flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#E07B2E] text-white flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Accountability Standard
                    </h4>
                    <span className="text-[10px] text-slate-300">GIGW 3.0 Public Redressal</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  FixMyCity enforces strict photo proof and engineer notes before any civic ticket can transition to
                  <span className="text-emerald-400 font-bold"> RESOLVED</span> status.
                </p>

                <div className="space-y-2.5 pt-2 border-t border-slate-700/80 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Escalation Window:</span>
                    <span className="font-semibold text-slate-200">Strict SLA Policies</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Photo Evidence:</span>
                    <span className="font-semibold text-emerald-400">Mandatory on Site</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Public Audit Log:</span>
                    <span className="font-semibold text-amber-400">Immutable History</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Link
                  href="/citizen/community"
                  className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-center text-xs font-bold text-white transition-colors block border border-white/15"
                >
                  Browse All Community Resolutions &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* 4. EIGHT-CATEGORY CIVIC ISSUE EXPLORER (Bilingual EN / HI)     */}
      {/* ============================================================== */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            {lang === 'hi' ? 'नागरिक समस्या श्रेणियां' : 'Civic Issue Category Explorer'}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'hi'
              ? 'विशिष्ट नागरिक समस्या दर्ज करने के लिए संबंधित श्रेणी चुनें (सभी 8 श्रेणियां उपलब्ध):'
              : 'Select a municipal or rural civic category to initiate a pre-classified grievance report:'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {CIVIC_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.key}
                href={`/citizen/report?category=${cat.key}&mode=ai`}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between group shadow-2xs hover:shadow-sm ${cat.bgColor} ${cat.borderColor}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-lg bg-white shadow-2xs ${cat.accentColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 group-hover:text-slate-800 transition-all" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#E07B2E] transition-colors leading-tight font-heading">
                    {cat.en}
                  </h3>
                  <p className="text-[10px] text-slate-600 mt-0.5 font-hindi font-medium">
                    {cat.hi}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. TWO COLUMN SPLIT: MY COMPLAINTS TIMELINE & COMMUNITY PULSE  */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        {/* Left Column: My Grievances Timeline */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-heading">
                {lang === 'hi' ? 'मेरी शिकायतें' : 'My Reported Grievances'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'hi' ? 'आपके पंजीकृत खाते से संबद्ध सक्रिय व हल शिकायतें' : 'Your personal grievances and live redressal progression.'}
              </p>
            </div>
            <Link
              href="/citizen/my-complaints"
              className="text-xs font-bold text-[#E07B2E] hover:underline flex items-center gap-1"
            >
              <span>{lang === 'hi' ? 'सभी देखें' : 'View All'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {myComplaints.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {lang === 'hi' ? 'आपने अभी तक कोई शिकायत दर्ज नहीं की है' : 'You have not reported any issues yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {lang === 'hi'
                  ? 'अपने इलाके में गड्ढे, कचरा या स्ट्रीटलाइट की समस्या देखें? AI फोटो से सेकंडों में रिपोर्ट करें।'
                  : 'Notice a pothole, leaking pipe, or dark street? Capture a photo to report it in seconds.'}
              </p>
              <Link
                href="/citizen/report?mode=ai"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E07B2E] hover:bg-[#c96920] text-white text-xs font-bold shadow-sm transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'पहली समस्या दर्ज करें' : 'Report an Issue with AI'}</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myComplaints.slice(0, 4).map((item) => {
                const sla = getSlaStatus(item.deadline);
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#E07B2E]">
                          {item.tracking_id}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="text-xs font-bold text-slate-900 line-clamp-1">{item.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{item.address}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <div className="text-[10px] text-slate-500">
                        {sla.isOverdue ? (
                          <span className="font-bold text-red-600">Overdue SLA</span>
                        ) : (
                          <span>{sla.formattedRemaining}</span>
                        )}
                      </div>
                      <Link
                        href={`/track?id=${item.tracking_id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Community Issues & Civic Map Access */}
        <section className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-heading">
                {lang === 'hi' ? 'सामुदायिक समस्याएं' : 'Community Pulse'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'hi' ? 'नागरिकों द्वारा समर्थित सार्वजनिक समस्याएं' : 'Public civic issues reported across jurisdictions.'}
              </p>
            </div>
            <Link
              href="/citizen/community"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>{lang === 'hi' ? 'GIS मानचित्र' : 'GIS Map'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {complaints.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <CategoryBadge category={item.category} />
                  <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3 text-blue-600" />
                    <span>{item.supports_count} Supporters</span>
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-900 line-clamp-1">{item.title}</div>
                <div className="text-[11px] text-slate-500 line-clamp-1">{item.address}</div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <StatusBadge status={item.status} />
                  <Link
                    href={`/track?id=${item.tracking_id}`}
                    className="text-xs font-bold text-slate-700 hover:text-[#E07B2E] transition-colors"
                  >
                    View &amp; Support &rarr;
                  </Link>
                </div>
              </div>
            ))}

            {/* Public Directory of Offices Link */}
            <Link
              href="/citizen/departments"
              className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 hover:bg-slate-100 transition-colors flex items-center justify-between text-xs text-slate-700 font-semibold block"
            >
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                <span>{lang === 'hi' ? 'सार्वजनिक प्रशासनिक कार्यालय निर्देशिका देखें' : 'View Verified Public Offices Directory'}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  </div>
);
}
