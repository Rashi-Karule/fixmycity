'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/features/auth/AuthContext';
import { Complaint, ComplaintStatus, PriorityLevel } from '@/types';
import { getSlaStatus } from '@/features/escalation/escalationEngine';
import {
  Building2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Upload,
  Filter,
  Check,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';

export default function EmployeeDashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Selected complaint modal / detail drawer
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('IN_PROGRESS');
  const [statusNotes, setStatusNotes] = useState('');
  const [resolutionProofUrl, setResolutionProofUrl] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Priority adjustment
  const [newPriority, setNewPriority] = useState<PriorityLevel>('MODERATE');
  const [priorityReason, setPriorityReason] = useState('');

  const loadDepartmentComplaints = () => {
    setLoading(true);
    fetch('/api/complaints')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // In staff view, default to the employee's assigned department if they have one
          const deptId = user?.department_id;
          const relevant = deptId
            ? data.data.filter((c: Complaint) => c.department_id === deptId)
            : data.data; // or show all if demo switch
          setComplaints(relevant);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDepartmentComplaints();
  }, [user]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComplaint) return;
    setUpdateError(null);

    if (newStatus === 'RESOLVED') {
      if (!statusNotes || statusNotes.trim().length < 5) {
        setUpdateError('Detailed resolution notes (minimum 5 characters) are required before marking an issue resolved.');
        return;
      }
      if (!resolutionProofUrl) {
        // Fallback demo resolution proof photo if none provided
        setResolutionProofUrl('https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80');
      }
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/complaints/${activeComplaint.id}/status`, {
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
        setActiveComplaint(null);
        setStatusNotes('');
        setResolutionProofUrl('');
        loadDepartmentComplaints();
      } else {
        setUpdateError(data.error || 'Failed to update status');
      }
    } catch {
      setUpdateError('Network error updating status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComplaint || !priorityReason.trim()) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/complaints/${activeComplaint.id}/priority`, {
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
        setActiveComplaint(null);
        setPriorityReason('');
        loadDepartmentComplaints();
      } else {
        setUpdateError(data.error || 'Failed to adjust priority');
      }
    } catch {
      setUpdateError('Network error');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = complaints.filter((c) => {
    if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && c.status !== selectedStatus) return false;
    return true;
  });

  const departmentName = user?.department_name || 'Public Works & Roads Infrastructure Dept';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Staff Dashboard Header */}
        <div className="bg-[#17304F] text-white p-6 rounded-xl border border-[#244670] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#E07B2E] uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>{departmentName}</span>
            </div>
            <h1 className="text-2xl font-bold font-heading mt-1">
              {t('employee.title', 'Department Operational Queue')}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Logged in officer: <strong className="text-white">{user?.name || 'Er. Sunita Kulkarni'}</strong> &bull; Employee ID: <span className="font-mono">{user?.employee_id || 'EMP-PWD-409'}</span>
            </p>
          </div>

          <div className="flex gap-2">
            <span className="bg-[#244670] border border-[#3b608d] px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200">
              Department Assigned Tickets: <strong className="text-white text-sm">{complaints.length}</strong>
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-[#17304F] focus:outline-hidden focus:border-[#E07B2E]"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-[#17304F] focus:outline-hidden focus:border-[#E07B2E]"
            >
              <option value="ALL">All Categories</option>
              <option value="ROADS_INFRASTRUCTURE">Roads & Potholes</option>
              <option value="WASTE_MANAGEMENT">Waste Management</option>
              <option value="WATER_SUPPLY">Water Supply</option>
              <option value="STREET_LIGHTING">Street Lighting</option>
            </select>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Showing {filtered.length} tickets
          </span>
        </div>

        {/* Operational Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Tracking ID</th>
                  <th className="py-3.5 px-4">Grievance Summary</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">SLA Deadline (IST)</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
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
                      <td className="py-3.5 px-4 font-mono font-bold text-[#E07B2E]">
                        {item.tracking_id}
                      </td>
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
                        <div
                          className={`font-semibold ${
                            sla.isOverdue && item.status !== 'RESOLVED'
                              ? 'text-red-600 font-bold flex items-center gap-1'
                              : 'text-slate-700'
                          }`}
                        >
                          {sla.isOverdue && item.status !== 'RESOLVED' && (
                            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                          )}
                          <span>
                            {item.status === 'RESOLVED' ? 'Resolved' : sla.formattedRemaining}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(item.deadline).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setActiveComplaint(item);
                            setNewStatus(item.status);
                            setNewPriority(item.priority);
                            setUpdateError(null);
                          }}
                          className="px-3 py-1.5 rounded-md bg-[#17304F] hover:bg-[#244670] text-white font-semibold text-xs transition-colors shadow-xs"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">
              {t('employee.noAssignedComplaints', 'No complaints pending in your department queue.')}
            </div>
          )}
        </div>

        {/* Modal: Update Status and Resolution Evidence */}
        {activeComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
              <div className="bg-[#17304F] text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base font-heading">
                    Update Complaint: {activeComplaint.tracking_id}
                  </h3>
                  <div className="text-xs text-slate-300 truncate max-w-md">
                    {activeComplaint.title}
                  </div>
                </div>
                <button
                  onClick={() => setActiveComplaint(null)}
                  className="text-white/80 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {updateError && (
                  <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded-lg text-xs font-medium">
                    {updateError}
                  </div>
                )}

                {/* Status Selection */}
                <form onSubmit={handleUpdateStatus} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#17304F] uppercase tracking-wider mb-1.5">
                      Progress Status *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['PENDING', 'IN_PROGRESS', 'RESOLVED'] as ComplaintStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setNewStatus(st)}
                          className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                            newStatus === st
                              ? 'bg-[#17304F] text-white border-[#17304F]'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {st.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17304F] uppercase tracking-wider mb-1.5">
                      {t('employee.resolutionNotes', 'Work Resolution Notes')} {newStatus === 'RESOLVED' ? '*' : ''}
                    </label>
                    <textarea
                      rows={3}
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      placeholder="Specify actions taken, machinery deployed, materials used, or inspection details..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#E07B2E]"
                    />
                  </div>

                  {newStatus === 'RESOLVED' && (
                    <div className="space-y-2 bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-lg">
                      <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider">
                        {t('employee.resolutionProofUpload', 'Upload Resolution Photo Proof')} *
                      </label>
                      <p className="text-[11px] text-emerald-800">
                        Municipal accountability requires on-site photographic proof of the finished repair before closing.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={resolutionProofUrl}
                          onChange={(e) => setResolutionProofUrl(e.target.value)}
                          placeholder="Paste image URL or use verified demo repair photo"
                          className="flex-1 px-3 py-1.5 text-xs rounded border border-emerald-300 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setResolutionProofUrl(
                              'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80'
                            )
                          }
                          className="px-2.5 py-1.5 rounded bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700"
                        >
                          Use Demo Proof
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveComplaint(null)}
                      className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#17304F] text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-5 py-2 rounded-lg bg-[#E07B2E] hover:bg-[#c9671d] text-white text-xs font-bold shadow-xs disabled:opacity-50"
                    >
                      {updating ? 'Saving...' : 'Confirm Status Update'}
                    </button>
                  </div>
                </form>

                {/* Priority & Deadline Adjustment Accordion */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-[#17304F] uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#E07B2E]" />
                    <span>Adjust Urgency Priority & Recalculate SLA</span>
                  </div>
                  <form onSubmit={handlePriorityChange} className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <div className="grid grid-cols-3 gap-2">
                      {(['INTERMEDIATE', 'MODERATE', 'STANDARD'] as PriorityLevel[]).map((pr) => (
                        <button
                          key={pr}
                          type="button"
                          onClick={() => setNewPriority(pr)}
                          className={`py-1.5 rounded text-[11px] font-bold border ${
                            newPriority === pr
                              ? 'bg-[#17304F] text-white'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          {pr}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Reason for priority change (e.g. site inspection confirmed open hazard)..."
                      value={priorityReason}
                      onChange={(e) => setPriorityReason(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 bg-white"
                    />
                    <button
                      type="submit"
                      disabled={updating || !priorityReason.trim()}
                      className="w-full py-1.5 rounded bg-[#244670] hover:bg-[#17304F] text-white text-xs font-semibold disabled:opacity-50"
                    >
                      Update Priority & SLA
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
