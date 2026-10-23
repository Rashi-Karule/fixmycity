'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/features/auth/AuthContext';
import { ShieldCheck, Globe, LogIn, Search, Home } from 'lucide-react';

export default function PublicNav() {
  const { lang, toggleLang, t } = useLanguage();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-[#17304F] text-white border-b border-[#244670] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-[#E07B2E] flex items-center justify-center text-white shadow-sm group-hover:bg-[#c9671d] transition-colors">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5 font-heading">
                FixMyCity
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-white/15 text-[#E07B2E]">
                  Public
                </span>
              </div>
              <div className="text-[11px] text-slate-300 hidden sm:block truncate max-w-xs font-sans">
                {t('nav.subtitle', 'India-Wide Civic Issue Reporting & Resolution Platform')}
              </div>
            </div>
          </Link>

          {/* Links */}
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-200 hover:bg-white/10"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{t('nav.home', 'Home')}</span>
            </Link>

            <Link
              href="/track"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-200 hover:bg-white/10"
            >
              <Search className="w-3.5 h-3.5 text-[#E07B2E]" />
              <span>{t('nav.trackComplaint', 'Track')}</span>
            </Link>

            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-[#244670] hover:bg-[#2d568a] text-slate-100 transition-colors border border-[#3b608d]"
            >
              <Globe className="w-3.5 h-3.5 text-[#E07B2E]" />
              <span>{lang === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            {/* Portal Destination or Login Button */}
            {user ? (
              <Link
                href={
                  user.role === 'ADMIN'
                    ? '/admin/dashboard'
                    : user.role === 'EMPLOYEE'
                    ? '/employee/dashboard'
                    : '/citizen/dashboard'
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold bg-[#E07B2E] text-white hover:bg-[#c9671d] transition-colors shadow-xs"
              >
                <span>Enter Portal ({user.role})</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold bg-[#E07B2E] text-white hover:bg-[#c9671d] transition-colors shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t('nav.signIn', 'Sign In')}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
