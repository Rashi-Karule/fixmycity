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
import {
  Building2,
  Clock,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Flame,
  LayoutList,
  ShieldCheck,
} from 'lucide-react';

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/complaints')
      .then((res) => res.json())
      .then((d) => {
        if (d.success) {
          // Department-scoped: employees only see complaints assigned to their authorized department
          const deptId = user?.department_id;
          const assigned = deptId
            ? d.data.filter((c: Complaint) => c.department_id === deptId)
            : d.data;
          setComplaints(assigned);
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const totalAssigned = complaints.length;
  const resolved = complaints.filter((c) => c.status === 'RESOLVED').length;
  const inProgress = complaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const pending = complaints.filter((c) => c.status === 'PENDING').length;
  const overdue = complaints.filter((c) => c.is_escalated && c.status !== 'RESOLVED').length;

  const urgentQueue = complaints
    .filter((c) => c.status !== 'RESOLVED')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5);

  const deptName = user?.department_name || 'Public Works & Roads Infrastructure Dept';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Officer Header Card */}
      <div className="bg-[#17304F] text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-[#244670]">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
            <Building2 className="w-4 h-4 text-[#E07B2E]" />
            <span>{deptName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading">
            {lang === 'hi' ? 'विभागीय कार्य कतार' : 'Department Operational Queue'}
          </h1>
          <p className="text-xs text-slate-300 font-sans">
            Officer: <strong className="text-white">{user?.name}</strong> &bull; Employee ID:{' '}
            <span className="font-mono text-[#E07B2E]">{user?.employee_id || 'EMP-PWD-409'}</span> &bull; Jurisdiction: Assigned Regional Scope
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/employee/issues"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <LayoutList className="w-4 h-4" />
            <span>View All Assigned ({totalAssigned})</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">Total Assigned</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#17304F] font-heading">{totalAssigned}</div>
          <div className="text-[10px] text-slate-400 mt-1">In department scope</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">Pending Inspection</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-heading">{pending}</div>
          <div className="text-[10px] text-amber-700 mt-1 font-semibold">Requires dispatch</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">Work In Progress</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-heading">{inProgress}</div>
          <div className="text-[10px] text-blue-700 mt-1 font-semibold">Field teams active</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">Resolved on SLA</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-heading">{resolved}</div>
          <div className="text-[10px] text-emerald-700 mt-1 font-semibold">With photo proof</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-xs font-semibold text-red-600 mb-1 flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Overdue SLA</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-red-600 font-heading">{overdue}</div>
          <Link href="/employee/overdue" className="text-[10px] text-red-700 font-bold hover:underline mt-1 block">
            Immediate Action Required →
          </Link>
        </div>
      </div>

      {/* Urgent SLA Queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#E07B2E]" />
            <h2 className="text-base font-bold text-[#17304F] font-heading">
              Priority Work Queue (Earliest Deadlines First)
            </h2>
          </div>
          <Link href="/employee/issues" className="text-xs font-bold text-blue-600 hover:underline">
            View Complete Queue →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                <th className="py-3 px-4">Tracking ID</th>
                <th className="py-3 px-4">Issue Summary</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">SLA Deadline</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {urgentQueue.map((item) => {
                const sla = getSlaStatus(item.deadline);
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#E07B2E]">{item.tracking_id}</td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-[#17304F] truncate">{item.title}</div>
                      <div className="text-[11px] text-slate-500 truncate">{item.address}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <CategoryBadge category={item.category} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} isEscalated={item.is_escalated} />
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={item.priority} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-semibold ${sla.isOverdue ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                        {sla.formattedRemaining}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/employee/issues/${item.id}`}
                        className="px-3 py-1.5 rounded-md bg-[#17304F] hover:bg-[#244670] text-white text-xs font-semibold shadow-xs"
                      >
                        Action Issue
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
