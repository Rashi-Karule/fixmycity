'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/features/auth/AuthContext';
import { EscalationRecord } from '@/types';
import {
  AlertTriangle,
  ShieldAlert,
  Play,
  CheckCircle,
  Clock,
  Building,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  FileCheck,
} from 'lucide-react';

export default function AdminEscalationsPage() {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [escalations, setEscalations] = useState<EscalationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Background scanner execution
  const [runningJob, setRunningJob] = useState(false);
  const [jobMessage, setJobMessage] = useState<string | null>(null);

  // Follow-up modal
  const [selectedEscalation, setSelectedEscalation] = useState<EscalationRecord | null>(null);
  const [followUpStatus, setFollowUpStatus] = useState<'PENDING' | 'IN_REVIEW' | 'ACTIONED' | 'DISMISSED'>('ACTIONED');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadEscalations = () => {
    fetch('/api/admin/escalations')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setEscalations(d.data || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEscalations();
  }, []);

  const triggerEscalationCron = async () => {
    setRunningJob(true);
    setJobMessage('Executing automated scan for unresolved overdue complaints...');
    try {
      const res = await fetch('/api/cron/escalate', {
        method: 'POST',
        headers: { Authorization: 'Bearer prototype-cron-secret-2026' },
      });
      const data = await res.json();
      if (data.success) {
        setJobMessage(
          lang === 'hi'
            ? `स्कैन संपन्न! ${data.newEscalationsCount} नई शिकायतें एस्केलेट की गईं। कुल एस्केलेटेड: ${data.totalEscalatedComplaints}`
            : `Scan complete! ${data.newEscalationsCount} new complaints escalated. Total escalated: ${data.totalEscalatedComplaints}`
        );
        loadEscalations();
      } else {
        setJobMessage(data.error || 'Scan execution encountered an error.');
      }
    } catch (err: unknown) {
      setJobMessage(err instanceof Error ? err.message : 'Error executing escalation cron job.');
    } finally {
      setRunningJob(false);
    }
  };

  const handleUpdateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEscalation) return;
    setSubmittingAction(true);
    try {
      const res = await fetch('/api/admin/escalations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escalationId: selectedEscalation.id,
          followUpStatus,
          followUpNotes,
          actionedBy: user?.name || 'PMC Executive Administrator',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedEscalation(null);
        setFollowUpNotes('');
        loadEscalations();
      } else {
        alert(data.error || 'Failed to update escalation.');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update escalation.');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-100 text-red-700 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-heading">
              {lang === 'hi' ? 'SLA उल्लंघन एवं एस्केलेशन ऑडिट लॉग' : 'SLA Breach & Escalation Audit Records'}
            </h1>
            <p className="text-sm text-slate-600">
              {lang === 'hi'
                ? 'समय-सीमा पार शिकायतों का स्वतः एस्केलेशन, प्रशासनिक निर्देश और जवाबदेही'
                : 'Automated breach detections, municipal supervisor dispatch, and auditable executive follow-up'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerEscalationCron}
            disabled={runningJob}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            {runningJob ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>{runningJob ? (lang === 'hi' ? 'स्कैन जारी है...' : 'Scanning...') : (lang === 'hi' ? 'एस्केलेशन स्कैन चलाएं' : 'Trigger Escalation Scan')}</span>
          </button>
        </div>
      </div>

      {/* Banner if job executed */}
      {jobMessage && (
        <div className="p-3 mb-6 bg-slate-900 text-slate-100 rounded-xl text-xs flex items-center justify-between border border-slate-700 font-mono">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{jobMessage}</span>
          </div>
          <button onClick={() => setJobMessage(null)} className="text-slate-400 hover:text-white ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Escalation Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mb-3" />
            <p className="text-sm">{lang === 'hi' ? 'एस्केलेशन रिकॉर्ड लोड हो रहे हैं...' : 'Loading escalation audit records...'}</p>
          </div>
        ) : escalations.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShieldAlert className="w-12 h-12 mx-auto text-emerald-400 mb-3" />
            <p className="text-base font-semibold text-slate-700">
              {lang === 'hi' ? 'कोई सक्रिय एस्केलेशन नहीं' : 'No active escalated complaints'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'hi' ? 'सभी विभाग अपनी निर्धारित SLA समय-सीमा के भीतर कार्य कर रहे हैं।' : 'All municipal departments are currently adhering to their SLA policies.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">{lang === 'hi' ? 'एस्केलेशन आईडी' : 'Escalation Ref'}</th>
                  <th className="py-3 px-4">{lang === 'hi' ? 'संबंधित शिकायत' : 'Complaint Title'}</th>
                  <th className="py-3 px-4">{lang === 'hi' ? 'जिम्मेदार विभाग' : 'Department Scope'}</th>
                  <th className="py-3 px-4">{lang === 'hi' ? 'कारण एवं समय' : 'Reason & Time'}</th>
                  <th className="py-3 px-4">{lang === 'hi' ? 'प्राधिकरण को प्रेषित' : 'Notified Authority'}</th>
                  <th className="py-3 px-4">{lang === 'hi' ? 'फॉलो-अप स्थिति' : 'Follow-up Status'}</th>
                  <th className="py-3 px-4 text-right">{lang === 'hi' ? 'कार्रवाई' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {escalations.map((esc) => {
                  return (
                    <tr key={esc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-red-700 whitespace-nowrap">
                        {esc.id}
                        <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                          {new Date(esc.escalation_timestamp).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 line-clamp-1">{esc.complaint_title}</div>
                        <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                          ID: {esc.complaint_id}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 line-clamp-1">{esc.department_name}</div>
                        <div className="text-[10px] text-red-600 font-mono mt-0.5">
                          Expired: {new Date(esc.original_deadline).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs">
                        <div className="text-xs line-clamp-2">Overdue by {esc.overdue_hours}h past SLA deadline</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200 text-[10px]">
                          PMC Central Command
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            esc.follow_up_status === 'ACTIONED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : esc.follow_up_status === 'IN_REVIEW'
                              ? 'bg-blue-100 text-blue-800'
                              : esc.follow_up_status === 'DISMISSED'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {esc.follow_up_status}
                        </span>
                        {esc.actioned_by && (
                          <div className="text-[10px] text-slate-400 mt-0.5">By: {esc.actioned_by}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedEscalation(esc);
                            setFollowUpStatus(esc.follow_up_status);
                            setFollowUpNotes(esc.follow_up_notes || '');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold border border-purple-200 transition-colors"
                        >
                          <FileCheck className="w-3 h-3" />
                          <span>{lang === 'hi' ? 'निरीक्षण / अपडेट' : 'Review'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedEscalation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  {lang === 'hi' ? 'एस्केलेशन प्रशासनिक कार्रवाई' : 'Auditable Escalation Follow-Up'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEscalation(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 text-xs space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <strong>{lang === 'hi' ? 'शिकायत:' : 'Complaint:'}</strong> {selectedEscalation.complaint_title}
              </div>
              <div>
                <strong>{lang === 'hi' ? 'विभाग:' : 'Department:'}</strong> {selectedEscalation.department_name}
              </div>
              <div>
                <strong>{lang === 'hi' ? 'कारण:' : 'Breach Reason:'}</strong> Overdue by {selectedEscalation.overdue_hours} hours past SLA threshold
              </div>
              <div>
                <strong>{lang === 'hi' ? 'मूल समय-सीमा:' : 'Original Deadline:'}</strong>{' '}
                {new Date(selectedEscalation.original_deadline).toLocaleString()}
              </div>
            </div>

            <form onSubmit={handleUpdateFollowUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'hi' ? 'फॉलो-अप स्थिति निर्धारित करें' : 'Update Follow-Up Decision'}
                </label>
                <select
                  value={followUpStatus}
                  onChange={(e) => setFollowUpStatus(e.target.value as any)}
                  className="w-full py-2 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="IN_REVIEW">IN_REVIEW (जाँच की जा रही है)</option>
                  <option value="ACTIONED">ACTIONED (कार्रवाई पूर्ण / निर्देश जारी)</option>
                  <option value="DISMISSED">DISMISSED (खारिज / वैध विलंब)</option>
                  <option value="PENDING">PENDING (लंबित)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'hi' ? 'प्रशासनिक निर्देश / ऑडिट नोट्स' : 'Administrative Directive & Audit Notes'}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={lang === 'hi' ? 'विभागीय अधिकारी को जारी निर्देश या स्पष्टीकरण दर्ज करें...' : 'Enter directives issued to department head or reasons for dismissal...'}
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedEscalation(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {submittingAction
                    ? (lang === 'hi' ? 'सहेजा जा रहा है...' : 'Saving...')
                    : (lang === 'hi' ? 'कार्रवाई सहेजें' : 'Save Directive')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
