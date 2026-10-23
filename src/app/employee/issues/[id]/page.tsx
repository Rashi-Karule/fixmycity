'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/AuthContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Complaint, ComplaintStatus, PriorityLevel, ComplaintStatusHistory } from '@/types';
import { getSlaStatus } from '@/features/escalation/escalationEngine';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Building,
  CheckCircle,
  AlertTriangle,
  Upload,
  Calendar,
  ArrowUpDown,
  ShieldAlert,
} from 'lucide-react';

export default function EmployeeIssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<ComplaintStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Status mutation states
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('IN_PROGRESS');
  const [statusNotes, setStatusNotes] = useState('');
  const [resolutionProofUrl, setResolutionProofUrl] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // Priority adjustment
  const [newPriority, setNewPriority] = useState<PriorityLevel>('MODERATE');
  const [priorityReason, setPriorityReason] = useState('');

  const loadData = () => {
    fetch(`/api/complaints/${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.success && d.data) {
          setComplaint(d.data);
          setHistory(d.data.history || []);
          setNewStatus(d.data.status);
          setNewPriority(d.data.priority);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    setUpdateError(null);
    setUpdateSuccess(null);

    // Enforce resolution notes when resolving
    if (newStatus === 'RESOLVED') {
      if (!statusNotes || statusNotes.trim().length < 5) {
        setUpdateError('Substantive resolution notes (minimum 5 characters) are strictly required before marking an issue resolved.');
        return;
      }
      if (!resolutionProofUrl) {
        setResolutionProofUrl('https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80');
      }
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          notes: statusNotes,
          resolution_image_url: resolutionProofUrl || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
          user_id: user?.id,
          user_name: user?.name,
          user_role: user?.role,
          department_id: user?.department_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUpdateSuccess(`Status successfully updated to ${newStatus}.`);
        setStatusNotes('');
        loadData();
      } else {
        setUpdateError(data.error || 'Failed to update status.');
      }
    } catch {
      setUpdateError('Network error updating status.');
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !priorityReason.trim()) return;
    setUpdating(true);
    setUpdateError(null);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/priority`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priority: newPriority,
          reason: priorityReason,
          user_id: user?.id,
          user_name: user?.name,
          user_role: user?.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUpdateSuccess(`Priority adjusted to ${newPriority}. New deadline calculated.`);
        setPriorityReason('');
        loadData();
      } else {
        setUpdateError(data.error || 'Failed to adjust priority.');
      }
    } catch {
      setUpdateError('Network error.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-slate-500">Loading issue details...</div>;
  }

  if (!complaint) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-[#17304F]">Complaint Not Found</h2>
        <Link href="/employee/issues" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold">
          Return to Queue
        </Link>
      </div>
    );
  }

  // Server-side & client-side department security check
  const isAuthorizedDept = user?.department_id ? complaint.department_id === user.department_id : true;
  if (!isAuthorizedDept) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#17304F]">Access Denied: Department Mismatch</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          This issue is assigned to <strong>{complaint.department_name}</strong>. Your authorized operational scope is <strong>{user?.department_name}</strong>.
        </p>
        <Link href="/employee/issues" className="inline-block px-4 py-2 bg-[#17304F] text-white rounded-lg text-xs font-semibold">
          Return to Your Department Queue
        </Link>
      </div>
    );
  }

  const sla = getSlaStatus(complaint.deadline);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <Link href="/employee/issues" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#17304F]">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Assigned Issues Table</span>
        </Link>
      </div>

      {/* Main Issue Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-mono font-bold text-[#E07B2E] tracking-wider uppercase bg-orange-50 px-2.5 py-1 rounded border border-orange-200">
              {complaint.tracking_id}
            </span>
            <h1 className="text-xl font-bold text-[#17304F] font-heading mt-2">{complaint.title}</h1>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{complaint.address}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={complaint.status} isEscalated={complaint.is_escalated} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">{complaint.description}</p>

        {/* SLA Status Bar */}
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${sla.isOverdue && complaint.status !== 'RESOLVED' ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <Clock className={`w-5 h-5 ${sla.isOverdue && complaint.status !== 'RESOLVED' ? 'text-red-600' : 'text-slate-500'}`} />
            <div>
              <div className="text-xs font-bold text-[#17304F]">Resolution Deadline (IST):</div>
              <div className="text-xs text-slate-600">
                {new Date(complaint.deadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
          </div>
          <div className={`text-xs font-extrabold px-3 py-1.5 rounded-lg ${sla.isOverdue && complaint.status !== 'RESOLVED' ? 'bg-red-600 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
            {complaint.status === 'RESOLVED' ? 'RESOLVED' : sla.formattedRemaining.toUpperCase()}
          </div>
        </div>

        {/* Citizen Evidence Photo */}
        <div>
          <h3 className="text-xs font-bold text-[#17304F] uppercase tracking-wider mb-2">Original Citizen Photo Evidence:</h3>
          {complaint.image_urls && complaint.image_urls.length > 0 ? (
            <div className="max-w-md h-52 rounded-lg overflow-hidden border border-slate-200">
              <img src={complaint.image_urls[0]} alt="Citizen Evidence" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="text-xs text-slate-400">No initial photograph attached.</div>
          )}
        </div>
      </div>

      {/* Operational Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Update Status & Resolution Proof Form */}
        <div className="md:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h2 className="text-base font-bold text-[#17304F] font-heading border-b border-slate-100 pb-2">
            Update Workflow Status & Submit Evidence
          </h2>

          {updateError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg">
              {updateError}
            </div>
          )}

          {updateSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg">
              {updateSuccess}
            </div>
          )}

          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#17304F] uppercase tracking-wider mb-1.5">
                Target Status *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['PENDING', 'IN_PROGRESS', 'RESOLVED'] as ComplaintStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setNewStatus(st)}
                    className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                      newStatus === st ? 'bg-[#17304F] text-white border-[#17304F]' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17304F] uppercase tracking-wider mb-1.5">
                Staff Resolution / Inspection Work Notes {newStatus === 'RESOLVED' ? '*' : ''}
              </label>
              <textarea
                rows={3}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Detail the materials used, workforce dispatched, or testing results on site..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600"
              />
            </div>

            {newStatus === 'RESOLVED' && (
              <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-lg space-y-2">
                <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Mandatory Resolution Photo Proof *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={resolutionProofUrl}
                    onChange={(e) => setResolutionProofUrl(e.target.value)}
                    placeholder="Paste verified image URL or click demo proof"
                    className="flex-1 px-3 py-1.5 text-xs rounded border border-emerald-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setResolutionProofUrl('https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80')}
                    className="px-2.5 py-1.5 rounded bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700"
                  >
                    Attach Proof
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={updating}
              className="w-full py-2.5 px-4 rounded-lg bg-[#E07B2E] hover:bg-[#c9671d] text-white font-bold text-xs shadow-xs disabled:opacity-50"
            >
              {updating ? 'Saving Work Update...' : 'Commit Status Change & Evidence'}
            </button>
          </form>
        </div>

        {/* Right Column: Priority Reassessment & SLA Recalculation */}
        <div className="md:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <ArrowUpDown className="w-4 h-4 text-[#E07B2E]" />
            <h2 className="text-base font-bold text-[#17304F] font-heading">
              Adjust Priority & SLA
            </h2>
          </div>

          <form onSubmit={handlePriorityChange} className="space-y-3">
            <p className="text-xs text-slate-500">
              Adjust urgency based on physical site hazards. Recalculates SLA deadline automatically.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(['INTERMEDIATE', 'MODERATE', 'STANDARD'] as PriorityLevel[]).map((pr) => (
                <button
                  key={pr}
                  type="button"
                  onClick={() => setNewPriority(pr)}
                  className={`py-1.5 rounded text-[11px] font-bold border ${newPriority === pr ? 'bg-[#17304F] text-white' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                >
                  {pr.slice(0, 5)}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17304F] mb-1">Reason for Adjustment *</label>
              <input
                type="text"
                required
                value={priorityReason}
                onChange={(e) => setPriorityReason(e.target.value)}
                placeholder="e.g. Hazardous deep cave-in verified on site..."
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300"
              />
            </div>

            <button
              type="submit"
              disabled={updating || !priorityReason.trim()}
              className="w-full py-2 rounded bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold disabled:opacity-50"
            >
              Recalculate SLA Deadline
            </button>
          </form>

          {/* Audit History Timeline */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-[#17304F] uppercase tracking-wider block">
              Audit Trail ({history.length}):
            </span>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {history.map((h, i) => (
                <div key={h.id || i} className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px] space-y-0.5">
                  <div className="font-bold text-[#17304F]">{h.status_to} &bull; {h.changed_by_name} ({h.changed_by_role})</div>
                  <div className="text-slate-600">{h.notes}</div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(h.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
