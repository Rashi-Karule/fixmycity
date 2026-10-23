'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/AuthContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Complaint } from '@/types';
import { getSlaStatus } from '@/features/escalation/escalationEngine';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { AlertOctagon, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function OverduePage() {
  const { user } = useAuth();
  const { lang } = useLanguage();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/complaints')
      .then((res) => res.json())
      .then((d) => {
        if (d.success) {
          const deptId = user?.department_id;
          const assigned = deptId
            ? d.data.filter((c: Complaint) => c.department_id === deptId)
            : d.data;

          const now = Date.now();
          const overdue = assigned.filter(
            (c: Complaint) => c.status !== 'RESOLVED' && (c.is_escalated || now > new Date(c.deadline).getTime())
          );
          setComplaints(overdue);
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-red-50 border border-red-300 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-red-900 font-heading">
              {lang === 'hi' ? 'विलंबित एवं एस्केलेट हुई शिकायतें' : 'Overdue SLA Breach Queue'}
            </h1>
            <p className="text-xs text-red-700 mt-0.5">
              These complaints have passed their allotted SLA resolution window. Senior municipal administration has been notified.
            </p>
          </div>
        </div>
        <div className="text-xs font-bold bg-white text-red-700 px-3 py-1.5 rounded-lg border border-red-200">
          {complaints.length} Critical Issues
        </div>
      </div>

      {complaints.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">Zero Overdue Complaints</h3>
          <p className="text-xs text-slate-500">
            All tickets assigned to your department are progressing within designated SLA deadlines. Excellent work!
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-red-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-red-50/70 border-b border-red-200 text-red-800 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4">Tracking ID</th>
                  <th className="py-3 px-4">Summary</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Original Deadline</th>
                  <th className="py-3 px-4">SLA Breach</th>
                  <th className="py-3 px-4 text-right">Emergency Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {complaints.map((item) => {
                  const sla = getSlaStatus(item.deadline);
                  return (
                    <tr key={item.id} className="hover:bg-red-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-red-700">{item.tracking_id}</td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-[#17304F] truncate">{item.title}</div>
                        <div className="text-[11px] text-slate-500 truncate">{item.address}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <CategoryBadge category={item.category} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(item.deadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-red-600">
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-mono">
                          {sla.formattedRemaining.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/employee/issues/${item.id}`}
                          className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs"
                        >
                          Resolve Now →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
