'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Complaint, Department, CivicCategory, ComplaintStatus, PriorityLevel } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { getSlaStatus } from '@/features/escalation/escalationEngine';
import {
  FileCheck2,
  Search,
  Filter,
  ArrowUpDown,
  Building,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export default function AdminAllComplaintsPage() {
  const { lang, t } = useLanguage();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortField, setSortField] = useState<'created_at' | 'deadline' | 'priority'>('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    Promise.all([
      fetch('/api/complaints').then((r) => r.json()),
      fetch('/api/departments').then((r) => r.json()),
    ])
      .then(([compData, deptData]) => {
        if (compData.success) setComplaints(compData.data || []);
        if (deptData.success) setDepartments(deptData.departments || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter logic
  const now = new Date();
  const filtered = complaints.filter((c) => {
    if (departmentFilter !== 'ALL' && c.department_id !== departmentFilter) return false;
    if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) return false;
    if (overdueOnly) {
      if (c.status === 'RESOLVED' || c.status === 'REJECTED') return false;
      const isOverdue = now.getTime() > new Date(c.deadline).getTime();
      if (!isOverdue) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        c.title.toLowerCase().includes(q) ||
        c.tracking_id.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.citizen_name && c.citizen_name.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortField === 'created_at') {
      diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (sortField === 'deadline') {
      diff = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    } else if (sortField === 'priority') {
      const pWeights: Record<PriorityLevel, number> = { INTERMEDIATE: 3, MODERATE: 2, STANDARD: 1 };
      diff = (pWeights[a.priority] || 0) - (pWeights[b.priority] || 0);
    }
    return sortAsc ? diff : -diff;
  });

  // Paginated
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-heading">
                {lang === 'hi' ? 'समस्त नागरिक शिकायतें' : 'All Civic Complaints'}
              </h1>
              <p className="text-sm text-slate-600">
                {lang === 'hi'
                  ? 'शहर भर में दर्ज शिकायतों की निगरानी, विभाग आवंटन और समाधान स्थिति'
                  : 'City-wide complaint monitoring, departmental jurisdiction, and operational tracking'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 shadow-sm text-xs text-slate-600">
            {lang === 'hi' ? 'कुल रिकॉर्ड्स' : 'Total Records'}:{' '}
            <strong className="text-purple-700 font-semibold">{filtered.length}</strong> / {complaints.length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={lang === 'hi' ? 'आईडी, शीर्षक या नागरिक द्वारा खोजें...' : 'Search by ID, title, address...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="ALL">{lang === 'hi' ? 'सभी विभाग' : 'All Departments'}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="ALL">{lang === 'hi' ? 'सभी स्थितियाँ' : 'All Statuses'}</option>
              <option value="PENDING">PENDING (लंबित)</option>
              <option value="IN_PROGRESS">IN_PROGRESS (प्रगति पर)</option>
              <option value="RESOLVED">RESOLVED (समाधान)</option>
              <option value="REJECTED">REJECTED (अस्वीकृत)</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="ALL">{lang === 'hi' ? 'सभी प्राथमिकता' : 'All Priorities'}</option>
              <option value="INTERMEDIATE">INTERMEDIATE (24h)</option>
              <option value="MODERATE">MODERATE (3 days)</option>
              <option value="STANDARD">STANDARD (7 days)</option>
            </select>
          </div>

          {/* Overdue Checkbox */}
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg border border-red-200 transition-colors w-full justify-center">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => {
                  setOverdueOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
              />
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'केवल समय-सीमा पार' : 'Overdue Only'}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mb-3" />
            <p className="text-sm">{lang === 'hi' ? 'डेटा लोड हो रहा है...' : 'Loading complaint records...'}</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileCheck2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-700">
              {lang === 'hi' ? 'कोई शिकायत नहीं मिली' : 'No complaints match the filter criteria'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'hi' ? 'कृपया फ़िल्टर रीसेट करें।' : 'Try resetting search terms or filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">{lang === 'hi' ? 'शिकायत क्रमांक' : 'Tracking ID'}</th>
                  <th className="py-3 px-4">{lang === 'hi' ? 'शीर्षक एवं श्रेणी' : 'Title & Category'}</th>
                  <th className="py-3 px-4">{lang === 'hi' ? 'विभाग एवं कार्यालय' : 'Department & Office'}</th>
                  <th className="py-3 px-4">{lang === 'hi' ? 'स्थिति' : 'Status'}</th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-slate-100" onClick={() => { setSortField('priority'); setSortAsc(!sortAsc); }}>
                    <div className="flex items-center gap-1">
                      <span>{lang === 'hi' ? 'प्राथमिकता' : 'Priority'}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:bg-slate-100" onClick={() => { setSortField('deadline'); setSortAsc(!sortAsc); }}>
                    <div className="flex items-center gap-1">
                      <span>{lang === 'hi' ? 'SLA समय-सीमा' : 'SLA Deadline'}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">{lang === 'hi' ? 'कार्रवाई' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((c) => {
                  const sla = getSlaStatus(c.deadline);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-purple-700 whitespace-nowrap">
                        {c.tracking_id}
                        {c.is_escalated && (
                          <span className="block mt-0.5 text-[10px] text-red-600 font-sans font-bold flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> ESCALATED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 line-clamp-1">{c.title}</div>
                        <div className="mt-1">
                          <CategoryBadge category={c.category} />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 line-clamp-1">{c.department_name}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400" />
                          {c.department_office_name || 'Designated Ward'}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-[11px] text-slate-700 font-mono">
                          {new Date(c.deadline).toLocaleDateString()} {new Date(c.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mt-0.5 ${
                            sla.isOverdue
                              ? 'bg-red-100 text-red-700'
                              : sla.hoursRemaining < 24
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {sla.formattedRemaining}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/track?id=${c.tracking_id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold border border-purple-200 transition-colors"
                        >
                          <span>{lang === 'hi' ? 'विवरण' : 'Audit'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              {lang === 'hi' ? 'पृष्ठ' : 'Page'} <strong className="font-semibold text-slate-900">{currentPage}</strong> / {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
