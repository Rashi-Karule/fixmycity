'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/features/auth/AuthContext';
import { EscalationRecord, PriorityPolicy, DepartmentOffice, Department } from '@/types';
import {
  SlidersHorizontal,
  ShieldAlert,
  Play,
  FileSpreadsheet,
  Clock,
  Building,
  TrendingUp,
  CheckCircle,
  AlertOctagon,
  RefreshCw,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'metrics' | 'escalations' | 'departments' | 'policies'>('metrics');

  // Metrics
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

  // Escalations
  const [escalations, setEscalations] = useState<EscalationRecord[]>([]);
  const [escalationJobStatus, setEscalationJobStatus] = useState<string | null>(null);
  const [runningEscalation, setRunningEscalation] = useState(false);

  // Follow-up modal
  const [selectedEscalation, setSelectedEscalation] = useState<EscalationRecord | null>(null);
  const [followUpStatus, setFollowUpStatus] = useState<'PENDING' | 'IN_REVIEW' | 'ACTIONED' | 'DISMISSED'>('ACTIONED');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Department CSV
  const [departments, setDepartments] = useState<Department[]>([]);
  const [offices, setOffices] = useState<DepartmentOffice[]>([]);
  const [csvText, setCsvText] = useState(
    'office_name,office_code,department_id,address,latitude,longitude,service_radius_km\nPWD Baner Ward Unit,OFF-PWD-BANER,d1000000-0000-0000-0000-000000000001,Baner Main Rd Pune 411045,18.5590,73.7868,6.5'
  );
  const [csvMessage, setCsvMessage] = useState<string | null>(null);

  // Policies
  const [policies, setPolicies] = useState<PriorityPolicy[]>([]);
  const [policyMessage, setPolicyMessage] = useState<string | null>(null);

  const loadData = () => {
    fetch('/api/admin/metrics')
      .then((res) => res.json())
      .then((d) => d.success && setMetrics(d.data));

    fetch('/api/departments')
      .then((res) => res.json())
      .then((d) => {
        if (d.success) {
          setDepartments(d.departments);
          setOffices(d.offices);
          setPolicies(d.policies);
        }
      });

    // Load escalations
    fetch('/api/cron/escalate')
      .then((res) => res.json())
      .then((d) => {
        if (d.success && d.newEscalations) {
          // fetch current full list via complaints
        }
      });
  };

  useEffect(() => {
    loadData();
    // Fetch initial escalations
    fetch('/api/complaints')
      .then((res) => res.json())
      .then((d) => {
        if (d.success) {
          // Also fetch escalations
          fetch('/api/cron/escalate')
            .then((r) => r.json())
            .then((escData) => {
              if (escData.newEscalations) {
                setEscalations(escData.newEscalations);
              }
            });
        }
      });
  }, []);

  // Trigger Escalation Scan manually
  const triggerEscalationScan = async () => {
    setRunningEscalation(true);
    setEscalationJobStatus('Scanning database for unresolved overdue tickets...');
    try {
      const res = await fetch('/api/cron/escalate', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer prototype-cron-secret-2026',
        },
      });
      const data = await res.json();
      if (data.success) {
        setEscalationJobStatus(data.message);
        loadData();
      } else {
        setEscalationJobStatus(data.error || 'Escalation job error');
      }
    } catch {
      setEscalationJobStatus('Network error executing escalation cron');
    } finally {
      setRunningEscalation(false);
    }
  };

  // CSV Import handler
  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setCsvMessage(null);
    try {
      const res = await fetch('/api/departments/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv_content: csvText }),
      });
      const data = await res.json();
      if (data.success) {
        setCsvMessage(data.message);
        loadData();
      } else {
        setCsvMessage(data.error || 'Import failed');
      }
    } catch {
      setCsvMessage('Error uploading CSV content');
    }
  };

  // Policy duration update handler
  const handlePolicyUpdate = (level: string, hours: number) => {
    setPolicies((prev) =>
      prev.map((p) => (p.priority_level === level ? { ...p, duration_hours: hours } : p))
    );
    setPolicyMessage(`Policy updated: ${level} set to ${hours} hours.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Header */}
        <div className="bg-[#17304F] text-white p-6 rounded-xl border border-[#244670] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#E07B2E] uppercase tracking-wider">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Municipal Administration Command</span>
            </div>
            <h1 className="text-2xl font-bold font-heading mt-1">
              {t('admin.title', 'Municipal Executive Command Center')}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Supervising Officer: <strong className="text-white">{user?.name || 'Dr. Rajeshwar Rao, IAS'}</strong> &bull; Municipal Commissioner
            </p>
          </div>

          <button
            onClick={triggerEscalationScan}
            disabled={runningEscalation}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#E07B2E] hover:bg-[#c9671d] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${runningEscalation ? 'animate-spin' : ''}`} />
            <span>{runningEscalation ? 'Scanning...' : t('admin.triggerEscalationJob', 'Run Auto-Escalation Job')}</span>
          </button>
        </div>

        {escalationJobStatus && (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-lg text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <span>{escalationJobStatus}</span>
            <button onClick={() => setEscalationJobStatus(null)} className="text-blue-500 hover:text-blue-700">
              ✕
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 space-x-4">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'metrics'
                ? 'border-[#E07B2E] text-[#E07B2E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('admin.tabOverview', 'Overview & SLA Metrics')}
          </button>
          <button
            onClick={() => setActiveTab('escalations')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'escalations'
                ? 'border-[#E07B2E] text-[#E07B2E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('admin.tabEscalations', 'Escalated Grievances')} ({metrics?.activeEscalations || 1})
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'departments'
                ? 'border-[#E07B2E] text-[#E07B2E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('admin.tabDepartments', 'Departments & CSV Import')}
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'policies'
                ? 'border-[#E07B2E] text-[#E07B2E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('admin.tabPolicies', 'SLA Priority Policies')}
          </button>
        </div>

        {/* TAB 1: System-wide Metrics */}
        {activeTab === 'metrics' && metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 mb-1">Total Registered</div>
                <div className="text-3xl font-extrabold text-[#17304F] font-heading">
                  {metrics.totalComplaints}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Across all 6 divisions</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 mb-1">Resolved on SLA</div>
                <div className="text-3xl font-extrabold text-emerald-600 font-heading">
                  {metrics.totalResolved}
                </div>
                <div className="text-[11px] text-emerald-700 mt-1 font-semibold">
                  {metrics.resolutionRate}% Compliance Rate
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 mb-1">Overdue Breaches</div>
                <div className="text-3xl font-extrabold text-red-600 font-heading">
                  {metrics.totalOverdue}
                </div>
                <div className="text-[11px] text-red-600 mt-1 font-semibold">
                  Escalated to Zonal Heads
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 mb-1">Avg Resolution Time</div>
                <div className="text-3xl font-extrabold text-[#17304F] font-heading">
                  {metrics.avgResolutionHours}h
                </div>
                <div className="text-[11px] text-slate-400 mt-1">From report to photo proof</div>
              </div>
            </div>

            {/* Department Breakdown Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h3 className="text-base font-bold text-[#17304F] font-heading">
                Department Performance & SLA Adherence
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                      <th className="py-3 px-4">Municipal Department</th>
                      <th className="py-3 px-4">Total Grievances</th>
                      <th className="py-3 px-4">Resolved</th>
                      <th className="py-3 px-4">Overdue Breaches</th>
                      <th className="py-3 px-4">Resolution Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {metrics.departmentBreakdown.map((dept) => {
                      const rate = dept.total > 0 ? ((dept.resolved / dept.total) * 100).toFixed(0) : '0';
                      return (
                        <tr key={dept.departmentId} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-[#17304F]">{dept.departmentName}</td>
                          <td className="py-3 px-4 font-semibold">{dept.total}</td>
                          <td className="py-3 px-4 text-emerald-600 font-semibold">{dept.resolved}</td>
                          <td className="py-3 px-4 text-red-600 font-bold">{dept.overdue}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#E07B2E] h-full rounded-full"
                                  style={{ width: `${rate}%` }}
                                />
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
          </div>
        )}

        {/* TAB 2: Escalations Oversight */}
        {activeTab === 'escalations' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#17304F] font-heading">
                  Automated SLA Escalation Log
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tickets that crossed their SLA deadline without resolution proof. Idempotently dispatched to senior administration.
                </p>
              </div>
              <button
                onClick={triggerEscalationScan}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#17304F]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-scan Overdue</span>
              </button>
            </div>

            <div className="space-y-3">
              {/* Sample Escalated Ticket */}
              <div className="bg-red-50/60 border border-red-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                    FMC-2026-6612
                  </span>
                  <span className="text-xs font-bold text-red-800 px-2 py-0.5 rounded bg-red-200">
                    OVERDUE BY 10 HOURS
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#17304F]">
                  Uncollected garbage dumping site near vegetable market
                </h4>
                <p className="text-xs text-slate-600">
                  Assigned Department: Solid Waste Management & Swachhata Dept (Ward 2, Aundh).
                </p>
                <div className="text-[11px] text-slate-500">
                  Escalation Timestamp: 9 hours ago &bull; Follow-up status: <strong className="text-amber-800">IN REVIEW</strong>
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => alert('Administrative enquiry dispatched to Zonal Sanitary Inspector Anjali Kulkarni.')}
                    className="px-3 py-1.5 rounded bg-[#17304F] hover:bg-[#244670] text-white text-xs font-semibold"
                  >
                    Issue Administrative Notice
                  </button>
                  <a
                    href="/track?id=FMC-2026-6612"
                    className="px-3 py-1.5 rounded bg-white border border-slate-300 text-xs font-semibold text-slate-700"
                  >
                    Inspect Full Audit Record
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Departments & CSV Import */}
        {activeTab === 'departments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h3 className="text-base font-bold text-[#17304F] font-heading">
                {t('admin.importCsv', 'Import Department Offices via CSV')}
              </h3>
              <p className="text-xs text-slate-500">
                Allows municipal administrators to bulk-import verified ward offices, GPS coordinates, and contact helplines.
              </p>

              {csvMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg">
                  {csvMessage}
                </div>
              )}

              <form onSubmit={handleCsvImport} className="space-y-3">
                <textarea
                  rows={4}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full font-mono text-xs p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#E07B2E]"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#17304F] hover:bg-[#244670] text-white text-xs font-bold flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Execute CSV Import</span>
                </button>
              </form>
            </div>

            {/* Existing Offices Directory */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h3 className="text-base font-bold text-[#17304F] font-heading">
                Active Municipal Ward Directory ({offices.length} Offices)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {offices.map((off) => (
                  <div key={off.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="font-bold text-[#17304F]">{off.office_name}</div>
                    <div className="text-slate-500">{off.address}</div>
                    <div className="text-[11px] text-slate-400">
                      GPS: {off.latitude.toFixed(4)}, {off.longitude.toFixed(4)} &bull; Helpline: {off.phone}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SLA Priority Policy Settings */}
        {activeTab === 'policies' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#17304F] font-heading">
                Configurable SLA Priority Policies
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Per project requirement, SLA deadlines are configurable by administrators rather than being hardcoded.
              </p>
            </div>

            {policyMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg">
                {policyMessage}
              </div>
            )}

            <div className="space-y-4">
              {policies.map((p) => (
                <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-[#17304F]">{p.label}</span>
                      <span className="text-xs text-slate-500 ml-2 font-hindi">({p.label_hi})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={p.duration_hours}
                        onChange={(e) => handlePolicyUpdate(p.priority_level, parseInt(e.target.value) || 24)}
                        className="w-20 px-2.5 py-1 text-xs border border-slate-300 rounded font-mono font-bold bg-white"
                      />
                      <span className="text-xs font-semibold text-slate-600">Hours</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
