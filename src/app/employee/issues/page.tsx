'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Complaint, PriorityLevel } from '@/types';
import { getSlaStatus } from '@/features/escalation/escalationEngine';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { Filter, Search, ArrowRight, ShieldAlert } from 'lucide-react';

function IssuesContent() {
  const searchParams = useSearchParams();
  const initialPriority = searchParams.get('priority') || 'ALL';

  const { user } = useAuth();
  const { lang } = useLanguage();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState(initialPriority);

  useEffect(() => {
    fetch('/api/complaints')
      .then((res) => res.json())
      .then((d) => {
        if (d.success) {
          const deptId = user?.department_id;
          const assigned = deptId
            ? d.data.filter((c: Complaint) => c.department_id === deptId)
            : d.data;
          setComplaints(assigned);
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = complaints.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;
    if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!c.title.toLowerCase().includes(q) && !c.tracking_id.toLowerCase().includes(q) && !c.address.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17304F] font-heading">
          {lang === 'hi' ? 'आवंटित विभागीय शिकायतें' : 'Assigned Departmental Issues'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Showing grievances assigned exclusively to <strong>{user?.department_name || 'your department'}</strong>.
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, location or reference ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-[#17304F]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-[#17304F]"
          >
            <option value="ALL">All Priorities</option>
            <option value="INTERMEDIATE">Intermediate (24h)</option>
            <option value="MODERATE">Moderate (3d)</option>
            <option value="STANDARD">Standard (7d)</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-[#17304F]"
          >
            <option value="ALL">All Categories</option>
            <option value="ROADS_INFRASTRUCTURE">Roads & Potholes</option>
            <option value="WASTE_MANAGEMENT">Waste Management</option>
            <option value="WATER_SUPPLY">Water Supply</option>
            <option value="STREET_LIGHTING">Street Lighting</option>
            <option value="TRAFFIC_TRANSPORT">Traffic</option>
            <option value="PUBLIC_HEALTH">Public Health</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                <th className="py-3 px-4">Tracking ID</th>
                <th className="py-3 px-4">Summary</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">SLA Remaining</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const sla = getSlaStatus(item.deadline);
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      item.is_escalated && item.status !== 'RESOLVED' ? 'bg-red-50/40' : ''
                    }`}
                  >
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
                      <span className={`font-semibold ${sla.isOverdue && item.status !== 'RESOLVED' ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                        {item.status === 'RESOLVED' ? 'Resolved' : sla.formattedRemaining}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/employee/issues/${item.id}`}
                        className="px-3 py-1.5 rounded-md bg-[#17304F] hover:bg-[#244670] text-white text-xs font-semibold shadow-xs"
                      >
                        Action Issue →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500">
            No complaints found matching current criteria.
          </div>
        )}
      </div>
    </div>
  );
}

export default function IssuesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs">Loading operational issues...</div>}>
      <IssuesContent />
    </Suspense>
  );
}
