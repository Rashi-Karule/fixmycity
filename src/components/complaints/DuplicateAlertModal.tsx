'use client';

import React from 'react';
import { DuplicateCandidate } from '@/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { AlertTriangle, ThumbsUp, ArrowRight, X } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface DuplicateAlertModalProps {
  candidate: DuplicateCandidate;
  onSupportExisting: (complaintId: string) => void;
  onProceedAnyway: () => void;
  onCancel: () => void;
}

export function DuplicateAlertModal({
  candidate,
  onSupportExisting,
  onProceedAnyway,
  onCancel,
}: DuplicateAlertModalProps) {
  const { t } = useLanguage();
  const { complaint, distanceMeters, similarityScore, reasons } = candidate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-amber-200 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-500 text-white px-5 py-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight font-heading">
                {t('report.duplicateDetectedTitle', 'Possible Duplicate Issue Found Nearby!')}
              </h3>
              <p className="text-xs text-amber-100 mt-0.5 font-sans">
                {distanceMeters} meters away &bull; {(similarityScore * 100).toFixed(0)}% match confidence
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-white/80 hover:text-white p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            {t(
              'report.duplicateDetectedDesc',
              'A similar open complaint was already reported nearby. Supporting this existing complaint elevates its municipal priority and avoids ticketing backlog.'
            )}
          </p>

          {/* Existing Complaint Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#E07B2E] tracking-wider uppercase">
                {complaint.tracking_id}
              </span>
              <StatusBadge status={complaint.status} isEscalated={complaint.is_escalated} />
            </div>
            <h4 className="text-sm font-bold text-[#17304F] leading-snug">
              {complaint.title}
            </h4>
            <p className="text-xs text-slate-500 line-clamp-2">
              {complaint.description}
            </p>
            <div className="text-[11px] text-slate-400">
              Reported at: {complaint.address} &bull; Current supports: {complaint.supports_count}
            </div>

            {/* Reasons pills */}
            <div className="pt-1 flex flex-wrap gap-1">
              {reasons.map((r, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={() => onSupportExisting(complaint.id)}
              className="flex-1 py-2.5 px-4 rounded-lg bg-[#E07B2E] hover:bg-[#c9671d] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{t('report.supportExisting', 'Support Existing Complaint (+1)')}</span>
            </button>
            <button
              onClick={onProceedAnyway}
              className="py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#17304F] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-300"
            >
              <span>{t('report.proceedAnyway', 'Submit as New Separate Issue')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
