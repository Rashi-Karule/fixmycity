'use client';

import React from 'react';
import { PriorityLevel } from '@/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  const { t } = useLanguage();

  const styles: Record<PriorityLevel, { bg: string; text: string; border: string }> = {
    INTERMEDIATE: {
      bg: 'bg-orange-50',
      text: 'text-[#E07B2E]',
      border: 'border-[#E07B2E]/30',
    },
    MODERATE: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    STANDARD: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
    },
  };

  const style = styles[priority] || styles.MODERATE;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${style.bg} ${style.text} border ${style.border}`}
    >
      {t(`priorities.${priority}`, priority)}
    </span>
  );
}
