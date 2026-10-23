'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/AuthContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Complaint, ComplaintStatus } from '@/types';
import { ComplaintCard } from '@/components/complaints/ComplaintCard';
import { PlusCircle, FileText, Filter, Search } from 'lucide-react';

export default function MyComplaintsPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/complaints')
      .then((res) => res.json())
      .then((d) => {
        if (d.success) {
          // Filter strictly to current citizen's own tickets
          const mine = d.data.filter(
            (c: Complaint) => c.citizen_id === user?.id || c.citizen_phone === user?.phone
          );
          setComplaints(mine);
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = complaints.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!c.title.toLowerCase().includes(q) && !c.tracking_id.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17304F] font-heading">
            {lang === 'hi' ? 'मेरी दर्ज शिकायतें' : 'My Filed Complaints'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {lang === 'hi'
              ? 'आपके द्वारा दर्ज की गई शिकायतों की वर्तमान स्थिति और समाधान इतिहास देखें।'
              : 'Track the status, assigned ward office, and resolution progress of your submitted grievances.'}
          </p>
        </div>

        <Link
          href="/citizen/report"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#E07B2E] hover:bg-[#c9671d] text-white text-xs font-bold transition-all shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{lang === 'hi' ? 'नई समस्या दर्ज करें' : 'Raise New Issue'}</span>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or reference ID (e.g. FMC-2026)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#E07B2E]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-[#17304F]"
          >
            <option value="ALL">All Statuses ({complaints.length})</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">No complaints found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {complaints.length === 0
              ? 'You have not submitted any complaints yet. When you report a civic issue, it will be listed here with live SLA status.'
              : 'No complaints match your active filter.'}
          </p>
          {complaints.length === 0 && (
            <div className="pt-2">
              <Link
                href="/citizen/report"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E07B2E] text-white text-xs font-bold"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>File your first report</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <ComplaintCard key={item.id} complaint={item} />
          ))}
        </div>
      )}
    </div>
  );
}
