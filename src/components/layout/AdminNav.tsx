'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/features/auth/AuthContext';
import {
  SlidersHorizontal,
  Globe,
  FileSpreadsheet,
  Users2,
  AlertTriangle,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  FileCheck2,
} from 'lucide-react';

export default function AdminNav() {
  const { lang, toggleLang } = useLanguage();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { href: '/admin/dashboard', label: lang === 'hi' ? 'नियंत्रण कक्ष' : 'Command Center', icon: SlidersHorizontal },
    { href: '/admin/complaints', label: lang === 'hi' ? 'समस्त शिकायतें' : 'All Complaints', icon: FileCheck2 },
    { href: '/admin/departments', label: lang === 'hi' ? 'विभाग प्रदर्शन' : 'Department Directory', icon: FileSpreadsheet },
    { href: '/admin/employees', label: lang === 'hi' ? 'कर्मचारी व आवंटन' : 'Employees & Scope', icon: Users2 },
    { href: '/admin/escalations', label: lang === 'hi' ? 'एस्केलेशन लॉग' : 'Escalations', icon: AlertTriangle },
    { href: '/admin/reports', label: lang === 'hi' ? 'रिपोर्ट्स एवं विश्लेषण' : 'Reports & Analytics', icon: BarChart3 },
    { href: '/admin/settings', label: lang === 'hi' ? 'SLA नीतियां' : 'SLA & Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#17304F] text-white border-b border-[#244670] shadow-sm">
      {/* Admin Executive Header Bar */}
      <div className="bg-[#0f2137] text-purple-200 px-4 py-1 text-[11px] font-medium flex items-center justify-between border-b border-[#244670]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          <span>
            {lang === 'hi' ? 'कार्यकारी प्रशासन नियंत्रण कक्ष:' : 'Administrative Oversight:'}{' '}
            <strong className="text-white">Central Civic Command</strong>
          </span>
        </div>
        <div className="hidden sm:block text-slate-400">
          Admin clearance: <span className="text-purple-300 font-mono">ADM-EXEC-001</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-sm">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 font-heading">
                FixMyCity
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  Admin
                </span>
              </div>
              <div className="text-[10px] text-slate-300 hidden sm:block">
                {lang === 'hi' ? 'कार्यकारी निगरानी एवं जवाबदेही' : 'Executive Command Center'}
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center space-x-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-900/60 text-white font-semibold border border-purple-500/40'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-purple-300" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Utilities */}
          <div className="hidden sm:flex items-center space-x-3">
            <button
              onClick={toggleLang}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-[#244670] hover:bg-[#2d568a] text-slate-100 transition-colors border border-[#3b608d]"
            >
              <Globe className="w-3.5 h-3.5 text-[#E07B2E]" />
              <span>{lang === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-white/15">
              <span className="text-xs font-semibold text-white max-w-[120px] truncate">
                {user?.name || 'Commissioner Rao'}
              </span>
              <button
                onClick={logout}
                title="Log Out"
                className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile hamburger */}
          <div className="flex xl:hidden items-center gap-2">
            <button onClick={toggleLang} className="p-1.5 rounded bg-[#244670] text-xs font-bold text-white">
              {lang === 'en' ? 'हि' : 'En'}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-white">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#0f2137] border-t border-[#244670] px-4 pt-3 pb-6 space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-xs font-medium ${
                pathname === link.href ? 'bg-purple-700 text-white font-bold' : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-[#244670] flex items-center justify-between text-xs text-slate-300">
            <span>{user?.name} (Admin)</span>
            <button onClick={logout} className="text-red-300 hover:text-red-200 flex items-center gap-1">
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
