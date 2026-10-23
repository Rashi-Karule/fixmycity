'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PublicNav from '@/components/layout/PublicNav';
import Footer from '@/components/layout/Footer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/features/auth/AuthContext';
import { Complaint, ComplaintComment, ComplaintStatusHistory } from '@/types';
import { getSlaStatus } from '@/features/escalation/escalationEngine';
import {
  Search,
  MapPin,
  Clock,
  Building,
  CheckCircle2,
  AlertTriangle,
  Send,
  Calendar,
  ThumbsUp,
  ShieldCheck,
} from 'lucide-react';

function TrackContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || '';
  const { t } = useLanguage();
  const { user } = useAuth();

  const [searchId, setSearchId] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<ComplaintStatusHistory[]>([]);
  const [comments, setComments] = useState<ComplaintComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const performSearch = async (idToSearch: string) => {
    if (!idToSearch.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/complaints/${encodeURIComponent(idToSearch.trim())}`);
      const data = await res.json();

      if (data.success && data.data) {
        setComplaint(data.data);
        setHistory(data.data.history || []);
        setComments(data.data.comments || []);
      } else {
        setComplaint(null);
        setError(data.error || 'No complaint found with this reference ID.');
      }
    } catch {
      setError('Failed to reach tracking server. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      performSearch(initialId);
    }
  }, [initialId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !newComment.trim() || newComment.length < 2) return;

    setCommentSubmitting(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment_text: newComment,
          user_id: user?.id || 'u1000000-0000-0000-0000-000000000001',
          user_name: user?.name || 'Citizen User',
          user_role: user?.role || 'CITIZEN',
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

  const sla = complaint ? getSlaStatus(complaint.deadline) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full space-y-8">
      {/* Search Header */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17304F] font-heading">
          {t('track.title', 'Track Complaint Status')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
          {t('track.subtitle', 'Enter your reference tracking ID (e.g., FMC-2026-8821) to view real-time municipal audit history.')}
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            performSearch(searchId);
          }}
          className="max-w-md mx-auto flex gap-2 pt-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              required
              placeholder={t('track.inputPlaceholder', 'Enter Reference ID...')}
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs font-mono font-medium rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#E07B2E] uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-[#E07B2E] text-white font-semibold text-xs hover:bg-[#c9671d] transition-colors shadow-xs"
          >
            {loading ? 'Searching...' : t('track.trackBtn', 'Check Status')}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs text-center">
          {error}
        </div>
      )}

      {/* Complaint Detail Card */}
      {complaint && (
        <div className="space-y-6">
          {/* Overdue / Escalation Alert Banner */}
          {complaint.is_escalated && complaint.status !== 'RESOLVED' && (
            <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3 text-xs text-red-800 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-red-900">
                  Automated SLA Escalation Triggered
                </div>
                <p className="mt-0.5 text-red-700 leading-relaxed font-sans">
                  {t(
                    'track.escalatedNotice',
                    'This complaint exceeded its designated SLA deadline without resolution. An urgent escalation record has been dispatched to Senior Municipal Administration and the Zonal Head for disciplinary oversight.'
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Main Ticket Details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-[#E07B2E] tracking-wider uppercase bg-orange-50 px-2.5 py-1 rounded border border-orange-200">
                  {complaint.tracking_id}
                </span>
                <h2 className="text-xl font-bold text-[#17304F] font-heading mt-2">
                  {complaint.title}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={complaint.status} isEscalated={complaint.is_escalated} />
                <PriorityBadge priority={complaint.priority} />
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed">
              {complaint.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg text-xs">
              <div>
                <span className="text-slate-500 font-medium">Issue Category:</span>
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
                <span className="text-slate-500 font-medium">SLA Resolution Deadline:</span>
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
                <span className="text-slate-500 font-medium">Assigned Ward Office:</span>
                <div className="font-semibold text-[#17304F] mt-1">
                  {complaint.department_office_name || 'Central Ward Office'}
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-medium">SLA Status:</span>
                <div
                  className={`font-bold mt-1 ${
                    sla?.isOverdue && complaint.status !== 'RESOLVED' ? 'text-red-600' : 'text-emerald-700'
                  }`}
                >
                  {complaint.status === 'RESOLVED' ? 'Resolved within SLA' : sla?.formattedRemaining}
                </div>
              </div>
            </div>

            {/* Photo Evidence Comparison: Citizen Evidence vs Resolution Proof */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-bold text-[#17304F] uppercase tracking-wider mb-2">
                  {t('track.evidence', 'Original Citizen Photo Evidence')}
                </h3>
                {complaint.image_urls && complaint.image_urls.length > 0 ? (
                  <div className="h-48 rounded-lg overflow-hidden border border-slate-200">
                    <img
                      src={complaint.image_urls[0]}
                      alt="Citizen Evidence"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-32 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                    No initial photo attached
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold text-[#17304F] uppercase tracking-wider mb-2">
                  {t('track.resolutionProof', 'Municipal Resolution Evidence')}
                </h3>
                {complaint.resolution_image_url ? (
                  <div className="h-48 rounded-lg overflow-hidden border border-emerald-300 relative">
                    <img
                      src={complaint.resolution_image_url}
                      alt="Resolution Evidence"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 right-2 bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                      Verified On-Site Work
                    </span>
                  </div>
                ) : (
                  <div className="h-48 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-xs text-slate-500 p-4 text-center">
                    <Clock className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="font-medium">Resolution proof pending</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      Field staff must upload completion photo and notes to close ticket.
                    </span>
                  </div>
                )}
                {complaint.resolution_notes && (
                  <div className="mt-2 text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 p-2.5 rounded">
                    <strong>Official Work Note:</strong> {complaint.resolution_notes}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Audit Status History Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-base font-bold text-[#17304F] font-heading border-b border-slate-100 pb-2">
              {t('track.timeline', 'Audit Timeline & Status Progression')}
            </h3>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200 pl-8">
              {history.map((item, idx) => (
                <div key={item.id || idx} className="relative space-y-1">
                  <div className="absolute -left-8 top-1 w-3 h-3 rounded-full bg-[#17304F] border-2 border-white shadow-xs" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[#17304F]">
                      Status: {item.status_to}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-sans">
                    {item.notes}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Actioned by: <strong>{item.changed_by_name}</strong> ({item.changed_by_role})
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Community Comments Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-base font-bold text-[#17304F] font-heading border-b border-slate-100 pb-2">
              Public Discussion & Updates ({comments.length})
            </h3>

            {comments.length > 0 ? (
              <div className="space-y-3">
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
                    <p className="text-slate-600 leading-relaxed">{comm.comment_text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No public comments yet.</p>
            )}

            <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Add a constructive community comment or verification update..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#E07B2E]"
              />
              <button
                type="submit"
                disabled={commentSubmitting || !newComment.trim()}
                className="px-4 py-2 rounded-lg bg-[#17304F] hover:bg-[#244670] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <PublicNav />
      <main className="flex-1">
        <Suspense fallback={<div className="p-12 text-center text-xs">Loading tracker...</div>}>
          <TrackContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
