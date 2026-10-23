'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Download,
} from 'lucide-react';

export default function AdminReportsPage() {
  const { lang } = useLanguage();

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

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/metrics')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setMetrics(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const exportReportCsv = () => {
    if (!metrics) return;
    let csv = 'Department,Total Complaints,Resolved Complaints,Overdue Complaints,Resolution Rate (%)\n';
    metrics.departmentBreakdown.forEach((dept) => {
      const rate = dept.total > 0 ? ((dept.resolved / dept.total) * 100).toFixed(1) : '0';
      csv += `"${dept.departmentName}",${dept.total},${dept.resolved},${dept.overdue},${rate}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fixmycity_department_sla_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-heading">
              {lang === 'hi' ? 'विभागीय प्रदर्शन एवं SLA अनुपालन रिपोर्ट' : 'Departmental Performance & SLA Analytics'}
            </h1>
            <p className="text-sm text-slate-600">
              {lang === 'hi'
                ? 'शिकायत समाधान दर, औसत निवारण समय और श्रेणीवार विश्लेषण'
                : 'Civic issue turnaround time, departmental compliance, and resolution efficiency metrics'}
            </p>
          </div>
        </div>

        <button
          onClick={exportReportCsv}
          disabled={!metrics}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>{lang === 'hi' ? 'CSV रिपोर्ट डाउनलोड करें' : 'Export Analytics CSV'}</span>
        </button>
      </div>

      {loading || !metrics ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mb-3" />
          <p className="text-sm">{lang === 'hi' ? 'एनालिटिक्स तैयार हो रहे हैं...' : 'Generating SLA compliance analytics...'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">{lang === 'hi' ? 'शहरव्यापी समाधान दर' : 'City Resolution Rate'}</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 font-heading">
                {metrics.resolutionRate}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {metrics.totalResolved} {lang === 'hi' ? 'सफलतापूर्वक हल की गईं' : 'issues successfully closed'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">{lang === 'hi' ? 'औसत समाधान अवधि' : 'Avg Resolution Time'}</span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 font-heading">
                {metrics.avgResolutionHours} hrs
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {lang === 'hi' ? 'पंजीकरण से समाधान तक की अवधि' : 'From submission to field verification'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">{lang === 'hi' ? 'SLA उल्लंघन' : 'SLA Breaches'}</span>
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-3xl font-extrabold text-red-600 font-heading">
                {metrics.totalOverdue}
              </div>
              <p className="text-[11px] text-red-600 mt-1">
                {lang === 'hi' ? 'निर्धारित समय-सीमा से अधिक' : 'Exceeded designated deadline'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">{lang === 'hi' ? 'सक्रिय एस्केलेशन' : 'Active Escalations'}</span>
                <ShieldCheck className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-3xl font-extrabold text-purple-700 font-heading">
                {metrics.activeEscalations}
              </div>
              <p className="text-[11px] text-purple-600 mt-1">
                {lang === 'hi' ? 'प्रशासनिक संज्ञान में' : 'Under executive review'}
              </p>
            </div>
          </div>

          {/* Department Breakdown Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-base font-bold text-slate-900 font-heading mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-600" />
              <span>{lang === 'hi' ? 'विभागवार प्रदर्शन एवं दक्षता सूची' : 'Departmental Breakdown & SLA Compliance'}</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">{lang === 'hi' ? 'विभाग' : 'Department Name'}</th>
                    <th className="py-3 px-4">{lang === 'hi' ? 'कुल शिकायतें' : 'Assigned Issues'}</th>
                    <th className="py-3 px-4">{lang === 'hi' ? 'समाधान' : 'Resolved'}</th>
                    <th className="py-3 px-4">{lang === 'hi' ? 'समय-सीमा पार' : 'Overdue'}</th>
                    <th className="py-3 px-4">{lang === 'hi' ? 'अनुपालन दर' : 'SLA Compliance'}</th>
                    <th className="py-3 px-4">{lang === 'hi' ? 'दक्षता प्रगति' : 'Performance Progress'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.departmentBreakdown.map((dept) => {
                    const rate = dept.total > 0 ? Math.round((dept.resolved / dept.total) * 100) : 0;
                    return (
                      <tr key={dept.departmentId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {dept.departmentName}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">{dept.total}</td>
                        <td className="py-3 px-4 text-emerald-700 font-semibold">{dept.resolved}</td>
                        <td className="py-3 px-4 text-red-600 font-semibold">{dept.overdue}</td>
                        <td className="py-3 px-4 font-mono font-bold text-purple-700">{rate}%</td>
                        <td className="py-3 px-4 w-48">
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                rate >= 70 ? 'bg-emerald-500' : rate >= 40 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-base font-bold text-slate-900 font-heading mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" />
              <span>{lang === 'hi' ? 'नागरिक समस्या श्रेणी वितरण' : 'Civic Issue Volume by Category'}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
                  <div className="text-xs text-slate-600 font-medium truncate mb-1">
                    {cat.category.replace('_', ' ')}
                  </div>
                  <div className="text-xl font-bold text-slate-900 font-mono">
                    {cat.count}{' '}
                    <span className="text-[10px] text-slate-400 font-sans font-normal">
                      ({metrics.totalComplaints > 0 ? Math.round((cat.count / metrics.totalComplaints) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
