'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/layout/PublicNav';
import Footer from '@/components/layout/Footer';
import CivicMap from '@/components/maps/CivicMap';
import { ComplaintCard } from '@/components/complaints/ComplaintCard';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Complaint, DepartmentOffice } from '@/types';
import {
  ShieldAlert,
  Search,
  PlusCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  FileCheck2,
} from 'lucide-react';

export default function HomePage() {
  const { t } = useLanguage();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [offices, setOffices] = useState<DepartmentOffice[]>([]);
  const [quickTrackId, setQuickTrackId] = useState('');

  useEffect(() => {
    // Load active complaints & offices
    fetch('/api/complaints')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setComplaints(data.data);
        }
      })
      .catch((err) => console.error(err));

    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOffices(data.offices);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter((c) => c.status === 'RESOLVED').length;
  const pendingComplaints = complaints.filter(
    (c) => c.status === 'PENDING' || c.status === 'IN_PROGRESS'
  ).length;
  const overdueComplaints = complaints.filter((c) => c.is_escalated).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <PublicNav />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[#17304F] text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#244670]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Headline and Primary Actions */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E07B2E]/20 border border-[#E07B2E]/40 text-[#E07B2E] text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E07B2E]" />
                  {t('home.badge', 'College Prototype — Municipal Accountability Platform')}
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-heading leading-tight">
                  {t('home.headline', 'Empowering Citizens, Enforcing Municipal Accountability')}
                </h1>

                <p className="text-base sm:text-lg text-slate-300 font-sans leading-relaxed max-w-2xl">
                  {t(
                    'home.subheading',
                    'Report civic infrastructure issues directly to the responsible municipal department. Every complaint is tracked against strict SLA deadlines with automated escalation.'
                  )}
                </p>

                {/* Primary & Secondary Call to Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    href="/citizen/report"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#E07B2E] hover:bg-[#c9671d] text-white font-bold text-sm transition-all shadow-md hover:shadow-lg"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{t('home.ctaReport', 'Report an Issue')}</span>
                  </Link>

                  <Link
                    href="/citizen/complaints"
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg bg-[#244670] hover:bg-[#2d568a] text-slate-100 font-semibold text-sm transition-all border border-[#3b608d]"
                  >
                    <MapPin className="w-4 h-4 text-[#E07B2E]" />
                    <span>{t('home.ctaExplore', 'Explore Community Map')}</span>
                  </Link>
                </div>

                {/* Quick Track Bar */}
                <div className="bg-[#0f2137]/90 border border-[#244670] p-3 rounded-lg max-w-lg mt-4 shadow-inner">
                  <div className="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-[#E07B2E]" />
                    <span>Quick Complaint Status Tracker:</span>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (quickTrackId.trim()) {
                        window.location.href = `/track?id=${encodeURIComponent(quickTrackId.trim())}`;
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      placeholder="e.g. FMC-2026-8821"
                      value={quickTrackId}
                      onChange={(e) => setQuickTrackId(e.target.value)}
                      className="flex-1 bg-white/10 border border-slate-600 rounded px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-[#E07B2E]"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded bg-[#E07B2E] text-white text-xs font-semibold hover:bg-[#c9671d] transition-colors"
                    >
                      Track
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Live Metric Cards (labelled demo data) */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
                <div className="bg-[#244670]/60 border border-[#3b608d] rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold">{t('home.totalComplaints', 'Total Grievances')}</span>
                    <TrendingUp className="w-4 h-4 text-blue-300" />
                  </div>
                  <div className="text-3xl font-extrabold text-white font-heading">{totalComplaints}</div>
                  <div className="text-[11px] text-slate-300 mt-1">Reported by citizens</div>
                </div>

                <div className="bg-[#244670]/60 border border-[#3b608d] rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold">{t('home.resolvedComplaints', 'Resolved On-Time')}</span>
                    <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-400 font-heading">{resolvedComplaints}</div>
                  <div className="text-[11px] text-slate-300 mt-1">Verified with photo evidence</div>
                </div>

                <div className="bg-[#244670]/60 border border-[#3b608d] rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold">{t('home.pendingComplaints', 'Active Queue')}</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-amber-300 font-heading">{pendingComplaints}</div>
                  <div className="text-[11px] text-slate-300 mt-1">Under SLA enforcement</div>
                </div>

                <div className="bg-[#244670]/60 border border-[#3b608d] rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold">Overdue / Escalated</span>
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-red-400 font-heading">{overdueComplaints}</div>
                  <div className="text-[11px] text-slate-300 mt-1">Flagged to Municipal Admin</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Step Civic Resolution Workflow */}
        <section className="py-12 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl font-bold text-[#17304F] font-heading">
                How FixMyCity Enforces Accountability
              </h2>
              <p className="text-sm text-slate-600 mt-2">
                A closed-loop system connecting citizen reports to verified department resolutions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 relative">
                <div className="w-10 h-10 rounded-lg bg-[#17304F] text-white flex items-center justify-center font-bold text-base mb-4 font-heading">
                  1
                </div>
                <h3 className="font-bold text-base text-[#17304F] mb-2 font-heading">
                  {t('home.step1Title', '1. Report with GPS & Photo')}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  {t(
                    'home.step1Desc',
                    'Upload grievance photos and pinpoint location. AI assists in detecting category.'
                  )}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 relative">
                <div className="w-10 h-10 rounded-lg bg-[#E07B2E] text-white flex items-center justify-center font-bold text-base mb-4 font-heading">
                  2
                </div>
                <h3 className="font-bold text-base text-[#17304F] mb-2 font-heading">
                  {t('home.step2Title', '2. Smart Geo-Routing & SLA')}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  {t(
                    'home.step2Desc',
                    'Auto-dispatches to the nearest eligible department office with SLA calculation.'
                  )}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 relative">
                <div className="w-10 h-10 rounded-lg bg-[#059669] text-white flex items-center justify-center font-bold text-base mb-4 font-heading">
                  3
                </div>
                <h3 className="font-bold text-base text-[#17304F] mb-2 font-heading">
                  {t('home.step3Title', '3. Photo Proof & Auto-Escalation')}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  {t(
                    'home.step3Desc',
                    'Staff must submit photo evidence. Automated escalation triggers if SLA is breached.'
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Live GIS Map & Recent Grievances Preview */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#17304F] font-heading">
                Pan-India Civic Activity Pulse
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Live complaints pinned by category and resolution state across urban local bodies and rural Panchayats.
              </p>
            </div>
            <Link
              href="/citizen/complaints"
              className="text-xs font-bold text-[#E07B2E] hover:underline flex items-center gap-1"
            >
              <span>View Full Community Feed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <CivicMap complaints={complaints} offices={offices} height="460px" />
            </div>

            <div className="lg:col-span-4 space-y-3.5">
              <div className="font-bold text-sm text-[#17304F] pb-2 border-b border-slate-200 font-heading">
                Recent Public Grievances
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[420px] pr-1">
                {complaints.slice(0, 3).map((complaint) => (
                  <ComplaintCard key={complaint.id} complaint={complaint} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
