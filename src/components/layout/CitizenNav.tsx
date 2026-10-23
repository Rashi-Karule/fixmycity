'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/features/auth/AuthContext';
import {
  ShieldCheck,
  Globe,
  PlusCircle,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  FileText,
  Users,
  Building,
} from 'lucide-react';

export default function CitizenNav() {
  const { lang, toggleLang, t } = useLanguage();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { href: '/citizen/dashboard', label: lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard', icon: LayoutDashboard },
    { href: '/citizen/report', label: lang === 'hi' ? 'नई समस्या दर्ज करें' : 'Raise Issue', highlight: true, icon: PlusCircle },
    { href: '/citizen/my-complaints', label: lang === 'hi' ? 'मेरी शिकायतें' : 'My Complaints', icon: FileText },
    { href: '/citizen/community', label: lang === 'hi' ? 'सामुदायिक समस्याएं' : 'Community Issues', icon: Users },
    { href: '/citizen/departments', label: lang === 'hi' ? 'विभाग निर्देशिका' : 'Departments', icon: Building },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#17304F] text-white border-b border-[#244670] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/citizen/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#E07B2E] flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 font-heading">
                FixMyCity
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-white/15 text-[#E07B2E]">
                  Citizen
                </span>
              </div>
              <div className="text-[10px] text-slate-300 hidden sm:block">
                {lang === 'hi' ? 'नागरिक समस्या निवारण पोर्टल' : 'Citizen Grievance Redressal'}
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-1.5">
            {links.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              if (link.highlight) {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold bg-[#E07B2E] text-white hover:bg-[#c9671d] transition-colors shadow-xs ml-1"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-slate-300" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Utilities: Language Toggle, User Pill, Logout */}
          <div className="hidden sm:flex items-center space-x-3">
            <button
              onClick={toggleLang}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-[#244670] hover:bg-[#2d568a] text-slate-100 transition-colors border border-[#3b608d]"
            >
              <Globe className="w-3.5 h-3.5 text-[#E07B2E]" />
              <span>{lang === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-white/15">
              <div className="flex items-center gap-1.5 text-xs text-slate-200">
                <div className="w-6 h-6 rounded-full bg-[#E07B2E]/30 text-[#E07B2E] flex items-center justify-center font-bold">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-white max-w-[100px] truncate">{user?.name || 'Citizen'}</span>
              </div>

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
          <div className="flex lg:hidden items-center gap-2">
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
        <div className="lg:hidden bg-[#0f2137] border-t border-[#244670] px-4 pt-3 pb-6 space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-xs font-medium ${
                pathname === link.href ? 'bg-[#E07B2E] text-white font-bold' : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-[#244670] flex items-center justify-between text-xs text-slate-300">
            <span>{user?.name} (Citizen)</span>
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
