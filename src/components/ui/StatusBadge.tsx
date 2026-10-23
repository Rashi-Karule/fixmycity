'use client';

import React from 'react';
import { ComplaintStatus } from '@/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function StatusBadge({ status, isEscalated }: { status: ComplaintStatus; isEscalated?: boolean }) {
  const { t } = useLanguage();

  if (isEscalated && status !== 'RESOLVED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700 border border-red-300">
        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
        {t('common.overdue', 'Overdue')} ({t('track.escalatedNotice', 'Escalated').slice(0, 9)})
      </span>
    );
  }

  const styles: Record<ComplaintStatus, { bg: string; text: string; border: string; dot: string }> = {
    PENDING: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
      dot: 'bg-amber-500',
    },
    IN_PROGRESS: {
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-300',
      dot: 'bg-blue-600',
    },
    RESOLVED: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
      dot: 'bg-emerald-600',
    },
    UNDER_ADMIN_REVIEW: {
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-300',
      dot: 'bg-purple-600',
    },
    REJECTED: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
      dot: 'bg-slate-500',
    },
  };

  const style = styles[status] || styles.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold ${style.bg} ${style.text} border ${style.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {t(`statuses.${status}`, status)}
    </span>
  );
}
