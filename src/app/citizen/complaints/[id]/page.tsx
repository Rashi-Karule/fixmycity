'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/features/auth/AuthContext';
import { Complaint, ComplaintComment, ComplaintStatusHistory } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { getSlaStatus } from '@/features/escalation/escalationEngine';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Building,
  CheckCircle2,
  ThumbsUp,
  Send,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

export default function CitizenComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { lang, t } = useLanguage();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<ComplaintStatusHistory[]>([]);
  const [comments, setComments] = useState<ComplaintComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const loadData = () => {
    fetch(`/api/complaints/${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.success && d.data) {
          setComplaint(d.data);
          setHistory(d.data.history || []);
          setComments(d.data.comments || []);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSupport = async () => {
    if (!complaint) return;
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id || 'u1000000-0000-0000-0000-000000000001' }),
      });
      const data = await res.json();
      if (data.success) {
        setComplaint({ ...complaint, supports_count: data.newCount });
      }
    } catch {
      alert('Failed to register support');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !newComment.trim()) return;
    setCommentSubmitting(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment_text: newComment,
          user_id: user?.id || 'u1000000-0000-0000-0000-000000000001',
          user_name: user?.name || 'Citizen User',
          user_role: 'CITIZEN',
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setComments((prev) => [...prev, data.data]);
        setNewComment('');
      }
    } catch {
      alert('Failed to post comment');
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-slate-500">
        Loading complaint records...
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-[#17304F]">Complaint Not Found</h2>
        <p className="text-xs text-slate-600">The requested grievance reference does not exist.</p>
        <Link href="/citizen/dashboard" className="inline-block px-4 py-2 bg-[#17304F] text-white rounded-lg text-xs font-semibold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const sla = getSlaStatus(complaint.deadline);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/citizen/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#17304F]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Overdue alert if escalated */}
      {complaint.is_escalated && complaint.status !== 'RESOLVED' && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3 text-xs text-red-800">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm text-red-900">SLA Breach Notice</div>
            <p className="mt-0.5 text-red-700 font-sans leading-relaxed">
              This issue passed its allocated resolution deadline without completion. It has been escalated to Senior Municipal Administration for urgent follow-up.
            </p>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-mono font-bold text-[#E07B2E] tracking-wider uppercase bg-orange-50 px-2.5 py-1 rounded border border-orange-200">
              {complaint.tracking_id}
            </span>
            <h1 className="text-xl font-bold text-[#17304F] font-heading mt-2">
              {complaint.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={complaint.status} isEscalated={complaint.is_escalated} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed font-sans">
          {complaint.description}
        </p>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg text-xs">
          <div>
            <span className="text-slate-500 font-medium">Category:</span>
            <div className="mt-1">
              <CategoryBadge category={complaint.category} />
            </div>
          </div>

          <div>
            <span className="text-slate-500 font-medium">Location:</span>
            <div className="font-semibold text-[#17304F] flex items-center gap-1 mt-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{complaint.address}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-500 font-medium">Expected Resolution:</span>
            <div className="font-semibold text-[#17304F] flex items-center gap-1 mt-1">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                {new Date(complaint.deadline).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          </div>

          <div>
            <span className="text-slate-500 font-medium">Responsible Department:</span>
            <div className="font-semibold text-[#17304F] flex items-center gap-1 mt-1">
              <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{complaint.department_name || 'Municipal Works Dept'}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-500 font-medium">Ward Office:</span>
            <div className="font-semibold text-[#17304F] mt-1">
              {complaint.department_office_name || 'Ward Office'}
            </div>
          </div>

          <div>
            <span className="text-slate-500 font-medium">SLA State:</span>
            <div className={`font-bold mt-1 ${sla.isOverdue && complaint.status !== 'RESOLVED' ? 'text-red-600' : 'text-emerald-700'}`}>
              {complaint.status === 'RESOLVED' ? 'Resolved On-Time' : sla.formattedRemaining}
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-[#17304F] uppercase tracking-wider mb-2">
              Citizen Photo Evidence
            </h3>
            {complaint.image_urls && complaint.image_urls.length > 0 ? (
              <div className="h-48 rounded-lg overflow-hidden border border-slate-200">
                <img src={complaint.image_urls[0]} alt="Citizen Evidence" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="h-32 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400">
                No photo attached
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#17304F] uppercase tracking-wider mb-2">
              Verified Resolution Evidence
            </h3>
            {complaint.resolution_image_url ? (
              <div className="h-48 rounded-lg overflow-hidden border border-emerald-300 relative">
                <img src={complaint.resolution_image_url} alt="Resolution" className="w-full h-full object-cover" />
                <span className="absolute top-2 right-2 bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  Verified On-Site Work
                </span>
              </div>
            ) : (
              <div className="h-48 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-xs text-slate-500 p-4 text-center">
                <Clock className="w-6 h-6 text-slate-400 mb-1" />
                <span>Field work underway</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Photo proof will appear here once verified by department staff.</span>
              </div>
            )}
            {complaint.resolution_notes && (
              <div className="mt-2 text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 p-2.5 rounded">
                <strong>Department Note:</strong> {complaint.resolution_notes}
              </div>
            )}
          </div>
        </div>

        {/* Upvote button */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <button
            onClick={handleSupport}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#17304F] text-xs font-bold transition-colors border border-slate-300"
          >
            <ThumbsUp className="w-3.5 h-3.5 text-[#E07B2E]" />
            <span>Support Complaint ({complaint.supports_count})</span>
          </button>
        </div>
      </div>

      {/* Public Status Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="text-base font-bold text-[#17304F] font-heading border-b border-slate-100 pb-2">
          Public Status History
        </h3>

        <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200 pl-8">
          {history.map((item, idx) => (
            <div key={item.id || idx} className="relative space-y-1">
              <div className="absolute -left-8 top-1 w-3 h-3 rounded-full bg-[#17304F] border-2 border-white shadow-xs" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#17304F]">Status: {item.status_to}</span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(item.created_at).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="text-xs text-slate-600 font-sans">{item.notes}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Community Comments */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="text-base font-bold text-[#17304F] font-heading border-b border-slate-100 pb-2">
          Community Updates & Comments ({comments.length})
        </h3>

        <div className="space-y-2.5">
          {comments.map((comm) => (
            <div key={comm.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#17304F]">{comm.user_name}</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(comm.created_at).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <p className="text-slate-600">{comm.comment_text}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-2">
          <input
            type="text"
            placeholder="Add community update or verification comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#E07B2E]"
          />
          <button
            type="submit"
            disabled={commentSubmitting || !newComment.trim()}
            className="px-4 py-2 rounded-lg bg-[#17304F] text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post</span>
          </button>
        </form>
      </div>
    </div>
  );
}
