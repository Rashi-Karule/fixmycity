'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/features/auth/AuthContext';
import {
  Menu,
  Globe,
  LogOut,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface AdminHeaderProps {
  onMobileMenuToggle: () => void;
}

export default function AdminHeader({ onMobileMenuToggle }: AdminHeaderProps) {
  const { lang, toggleLang } = useLanguage();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
        {/* Left: Mobile Menu Trigger & Context */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <div className="text-xs font-semibold text-slate-800">
              {lang === 'hi'
                ? 'केंद्रीय प्रशासनिक नियंत्रण कक्ष — नागरिक सेवा'
                : 'Executive Command Center — Civic Administration Oversight'}
            </div>
          </div>
        </div>

        {/* Right Utility Bar: Lang Toggle, Admin Identity, Logout */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLang}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>{lang === 'hi' ? 'English' : 'हिंदी'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">
              {user?.name || 'Executive Administrator'}
            </span>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'hi' ? 'लॉगआउट' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
