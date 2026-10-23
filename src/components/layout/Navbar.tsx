'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/features/auth/AuthContext';
import {
  ShieldCheck,
  Globe,
  Menu,
  X,
  User,
  Building2,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { UserRole } from '@/types';

export default function Navbar() {
  const { lang, toggleLang, t } = useLanguage();
  const { user, switchDemoRole } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: t('nav.home', 'Home') },
    { href: '/citizen/report', label: t('nav.reportIssue', 'Report Issue'), highlight: true },
    { href: '/track', label: t('nav.trackComplaint', 'Track') },
    { href: '/citizen/complaints', label: t('nav.communityIssues', 'Community Feed') },
    { href: '/employee', label: t('nav.operationalDashboard', 'Staff') },
    { href: '/admin', label: t('nav.adminCenter', 'Admin') },
  ];

  const handleRoleSelect = (role: UserRole) => {
    switchDemoRole(role);
    setRoleMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#17304F] text-white border-b border-[#244670] shadow-sm">
      {/* Prototype Banner */}
      <div className="bg-[#E07B2E] text-white px-4 py-1 text-xs text-center font-medium tracking-wide flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span>{t('common.demoDataNotice', 'College Prototype Mode — Realistic Indian Municipal Administration Data')}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-[#E07B2E] flex items-center justify-center text-white shadow-sm group-hover:bg-[#c9671d] transition-colors">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5 font-heading">
                FixMyCity
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-white/15 text-[#E07B2E]">
                  Demo
                </span>
              </div>
              <div className="text-[11px] text-slate-300 hidden sm:block truncate max-w-xs font-sans">
                {t('nav.subtitle', 'Citizens Issue Reporting & Government Accountability System')}
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              if (link.highlight) {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3.5 py-1.5 rounded-md text-sm font-semibold bg-[#E07B2E] text-white hover:bg-[#c9671d] transition-colors shadow-xs ml-1"
                  >
                    {link.label}
                  </Link>
                );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Utility: Language Toggle & Demo Role Switcher */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-[#244670] hover:bg-[#2d568a] text-slate-100 transition-colors border border-[#3b608d]"
              title="Switch language between English and Hindi"
            >
              <Globe className="w-3.5 h-3.5 text-[#E07B2E]" />
              <span>{lang === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            {/* Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-[#244670] hover:bg-[#2d568a] text-white border border-[#3b608d] transition-colors"
              >
                {user?.role === 'ADMIN' ? (
                  <SlidersHorizontal className="w-3.5 h-3.5 text-purple-300" />
                ) : user?.role === 'EMPLOYEE' ? (
                  <Building2 className="w-3.5 h-3.5 text-blue-300" />
                ) : (
                  <User className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span className="font-semibold capitalize truncate max-w-[120px]">
                  {user?.role === 'ADMIN'
                    ? 'Admin'
                    : user?.role === 'EMPLOYEE'
                    ? 'PWD Officer'
                    : 'Citizen'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-300" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white text-[#17304F] rounded-lg shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    Switch Active Role
                  </div>
                  <button
                    onClick={() => handleRoleSelect('CITIZEN')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                      user?.role === 'CITIZEN' ? 'font-bold text-[#E07B2E]' : ''
                    }`}
                  >
                    <span>Citizen (Aarav Sharma)</span>
                    {user?.role === 'CITIZEN' && <span className="text-xs">●</span>}
                  </button>
                  <button
                    onClick={() => handleRoleSelect('EMPLOYEE')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                      user?.role === 'EMPLOYEE' ? 'font-bold text-[#E07B2E]' : ''
                    }`}
                  >
                    <span>PWD Employee (Er. Sunita)</span>
                    {user?.role === 'EMPLOYEE' && <span className="text-xs">●</span>}
                  </button>
                  <button
                    onClick={() => handleRoleSelect('ADMIN')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                      user?.role === 'ADMIN' ? 'font-bold text-[#E07B2E]' : ''
                    }`}
                  >
                    <span>Admin (Commissioner Rao)</span>
                    {user?.role === 'ADMIN' && <span className="text-xs">●</span>}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleLang}
              className="p-1.5 rounded-md bg-[#244670] text-slate-100 text-xs font-semibold"
            >
              {lang === 'en' ? 'हि' : 'En'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-200 hover:text-white hover:bg-white/10"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0f2137] border-t border-[#244670] px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                pathname === link.href
                  ? 'bg-[#E07B2E] text-white font-semibold'
                  : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-[#244670] flex flex-col gap-2">
            <div className="text-xs text-slate-400 font-semibold uppercase">Active User Role:</div>
            <div className="flex gap-2">
              <button
                onClick={() => handleRoleSelect('CITIZEN')}
                className={`flex-1 py-1.5 rounded text-xs font-semibold ${
                  user?.role === 'CITIZEN' ? 'bg-[#E07B2E] text-white' : 'bg-[#244670] text-slate-200'
                }`}
              >
                Citizen
              </button>
              <button
                onClick={() => handleRoleSelect('EMPLOYEE')}
                className={`flex-1 py-1.5 rounded text-xs font-semibold ${
                  user?.role === 'EMPLOYEE' ? 'bg-[#E07B2E] text-white' : 'bg-[#244670] text-slate-200'
                }`}
              >
                Staff
              </button>
              <button
                onClick={() => handleRoleSelect('ADMIN')}
                className={`flex-1 py-1.5 rounded text-xs font-semibold ${
                  user?.role === 'ADMIN' ? 'bg-[#E07B2E] text-white' : 'bg-[#244670] text-slate-200'
                }`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
