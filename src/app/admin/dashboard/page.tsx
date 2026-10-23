'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/AuthContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  SlidersHorizontal,
  Play,
  TrendingUp,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Building,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  Users2,
  AlertTriangle,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const [metrics, setMetrics] = useState<{
    totalComplaints: number;
    totalResolved: number;
    totalInProgress: number;
    totalPending: number;
    totalOverdue: number;
    activeEscalations: number;
    resolutionRate: number;
    avgResolutionHours: number;
    departmentBreakdown: { departmentId: string; departmentName: string; total: number; resolved: number; overdue: number }[];
    categoryBreakdown: { category: string; count: number }[];
  } | null>(null);

  const [runningEscalation, setRunningEscalation] = useState(false);
  const [escalationStatus, setEscalationStatus] = useState<string | null>(null);

  const loadMetrics = () => {
    fetch('/api/admin/metrics')
      .then((res) => res.json())
      .then((d) => d.success && setMetrics(d.data));
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const triggerEscalationScan = async () => {
    setRunningEscalation(true);
    setEscalationStatus('Executing automated scan for unresolved overdue complaints...');
    try {
      const res = await fetch('/api/cron/escalate', {
        method: 'POST',
        headers: { Authorization: 'Bearer prototype-cron-secret-2026' },
      });
      const data = await res.json();
      if (data.success) {
        setEscalationStatus(data.message);
        loadMetrics();
      } else {
        setEscalationStatus(data.error || 'Escalation job error.');
      }
    } catch {
      setEscalationStatus('Network error triggering escalation cron.');
    } finally {
      setRunningEscalation(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-[#17304F] text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-[#244670]">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-400/30">
            <SlidersHorizontal className="w-4 h-4 text-[#E07B2E]" />
            <span>Municipal Administration Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading">
            {lang === 'hi' ? 'पुणे नगर निगम मुख्य नियंत्रण कक्ष' : 'City-Wide Executive Command Center'}
          </h1>
          <p className="text-xs text-slate-300 font-sans">
            Supervising Commissioner: <strong className="text-white">{user?.name || 'Dr. Rajeshwar Rao, IAS'}</strong> &bull; Clearances: <span className="font-mono text-purple-300">System-Wide Oversight</span>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={triggerEscalationScan}
            disabled={runningEscalation}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#E07B2E] hover:bg-[#c9671d] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${runningEscalation ? 'animate-spin' : ''}`} />
            <span>{runningEscalation ? 'Scanning...' : 'Run Auto-Escalation Job'}</span>
          </button>
        </div>
      </div>

      {escalationStatus && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <span>{escalationStatus}</span>
          <button onClick={() => setEscalationStatus(null)} className="text-blue-500 hover:text-blue-700">✕</button>
        </div>
      )}

      {/* KPI Cards Grid */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 mb-1">Total Grievances</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#17304F] font-heading">{metrics.totalComplaints}</div>
            <div className="text-[10px] text-slate-400 mt-1">Across 6 departments</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 mb-1">Resolved on SLA</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-heading">{metrics.totalResolved}</div>
            <div className="text-[10px] text-emerald-700 font-bold mt-1">{metrics.resolutionRate}% Compliance</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 mb-1">In Progress</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-heading">{metrics.totalInProgress}</div>
            <div className="text-[10px] text-blue-700 mt-1 font-semibold">Field work ongoing</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 mb-1">Pending</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-heading">{metrics.totalPending}</div>
            <div className="text-[10px] text-slate-400 mt-1">Awaiting dispatch</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-red-200 shadow-xs">
            <div className="text-xs font-semibold text-red-600 mb-1 flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Overdue Breaches</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-600 font-heading">{metrics.totalOverdue}</div>
            <div className="text-[10px] text-red-700 font-semibold mt-1">SLA Missed</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs">
            <div className="text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Escalated</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-700 font-heading">{metrics.activeEscalations}</div>
            <Link href="/admin/escalations" className="text-[10px] text-purple-800 font-bold hover:underline mt-1 block">
              Inspect Notices →
            </Link>
          </div>
        </div>
      )}

      {/* Department Performance Table */}
      {metrics && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-[#17304F] font-heading">
                Municipal Department Performance & SLA Adherence
              </h2>
              <p className="text-xs text-slate-500">Live breakdown of resolutions, overdue breaches, and active workloads.</p>
            </div>
            <Link href="/admin/departments" className="text-xs font-bold text-purple-700 hover:underline">
              Manage Ward Directory →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                  <th className="py-3 px-4">Municipal Department</th>
                  <th className="py-3 px-4">Total Assigned</th>
                  <th className="py-3 px-4">Resolved</th>
                  <th className="py-3 px-4">Overdue Breaches</th>
                  <th className="py-3 px-4">Resolution Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.departmentBreakdown.map((dept) => {
                  const rate = dept.total > 0 ? ((dept.resolved / dept.total) * 100).toFixed(0) : '0';
                  return (
                    <tr key={dept.departmentId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#17304F]">{dept.departmentName}</td>
                      <td className="py-3 px-4 font-semibold">{dept.total}</td>
                      <td className="py-3 px-4 text-emerald-600 font-semibold">{dept.resolved}</td>
                      <td className="py-3 px-4 text-red-600 font-bold">{dept.overdue}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-[#E07B2E] h-full rounded-full" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="font-semibold text-slate-700">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Administrative Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/complaints"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-purple-600 transition-all group"
        >
          <FileCheck2 className="w-6 h-6 text-purple-600 mb-2" />
          <h3 className="font-bold text-sm text-[#17304F] group-hover:text-purple-700">All Complaints Register</h3>
          <p className="text-xs text-slate-500 mt-1">Audit, search, and filter all civic tickets filed city-wide.</p>
        </Link>

        <Link
          href="/admin/escalations"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-purple-600 transition-all group"
        >
          <AlertTriangle className="w-6 h-6 text-red-600 mb-2" />
          <h3 className="font-bold text-sm text-[#17304F] group-hover:text-purple-700">Escalation Oversight</h3>
          <p className="text-xs text-slate-500 mt-1">Review overdue SLA breaches and record formal disciplinary actions.</p>
        </Link>

        <Link
          href="/admin/settings"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-purple-600 transition-all group"
        >
          <SlidersHorizontal className="w-6 h-6 text-[#E07B2E] mb-2" />
          <h3 className="font-bold text-sm text-[#17304F] group-hover:text-purple-700">SLA Priority Policies</h3>
          <p className="text-xs text-slate-500 mt-1">Configure SLA duration hours for Intermediate, Moderate, and Standard priorities.</p>
        </Link>
      </div>
    </div>
  );
}
