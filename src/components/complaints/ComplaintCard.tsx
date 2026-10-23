'use client';

import React from 'react';
import Link from 'next/link';
import { Complaint } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { getSlaStatus } from '@/features/escalation/escalationEngine';
import { MapPin, Clock, ThumbsUp, ChevronRight, Building } from 'lucide-react';

interface ComplaintCardProps {
  complaint: Complaint;
  onSupport?: (id: string) => void;
  isSupportedByUser?: boolean;
}

export function ComplaintCard({ complaint, onSupport, isSupportedByUser }: ComplaintCardProps) {
  const sla = getSlaStatus(complaint.deadline);

  return (
    <div className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all overflow-hidden flex flex-col">
      {/* Top Header */}
      <div className="p-4 sm:p-5 flex-1 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold text-[#E07B2E] tracking-wider bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
            {complaint.tracking_id}
          </span>
          <StatusBadge status={complaint.status} isEscalated={complaint.is_escalated} />
        </div>

        <div>
          <h3 className="font-bold text-[#17304F] text-base leading-snug font-heading line-clamp-1 hover:text-[#E07B2E]">
            <Link href={`/track?id=${complaint.tracking_id}`}>{complaint.title}</Link>
          </h3>
          <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
            {complaint.description}
          </p>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <CategoryBadge category={complaint.category} />
          <PriorityBadge priority={complaint.priority} />
        </div>

        {/* Meta info: Address, Dept, SLA */}
        <div className="space-y-1.5 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{complaint.address}</span>
          </div>

          {complaint.department_name && (
            <div className="flex items-center gap-1.5 truncate">
              <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{complaint.department_name}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <Clock
                className={`w-3.5 h-3.5 ${
                  sla.isOverdue && complaint.status !== 'RESOLVED' ? 'text-red-500' : 'text-slate-400'
                }`}
              />
              <span
                className={`font-semibold ${
                  sla.isOverdue && complaint.status !== 'RESOLVED' ? 'text-red-600 font-bold' : 'text-slate-600'
                }`}
              >
                {complaint.status === 'RESOLVED' ? 'Resolved' : sla.formattedRemaining}
              </span>
            </div>

            <span className="text-[10px] text-slate-400">
              {new Date(complaint.created_at).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <button
          onClick={(e) => {
            e.preventDefault();
            onSupport?.(complaint.id);
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
            isSupportedByUser
              ? 'bg-[#E07B2E] text-white'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ThumbsUp className="w-3 h-3" />
          <span>{complaint.supports_count} Supports</span>
        </button>

        <Link
          href={`/track?id=${complaint.tracking_id}`}
          className="text-xs font-semibold text-[#17304F] hover:text-[#E07B2E] flex items-center gap-0.5"
        >
          <span>Track Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
