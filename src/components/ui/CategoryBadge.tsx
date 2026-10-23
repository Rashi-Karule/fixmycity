'use client';

import React from 'react';
import { CivicCategory } from '@/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function CategoryBadge({ category }: { category: CivicCategory }) {
  const { t } = useLanguage();

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#17304F]/8 text-[#17304F] border border-[#17304F]/15">
      {t(`categories.${category}`, category)}
    </span>
  );
}
