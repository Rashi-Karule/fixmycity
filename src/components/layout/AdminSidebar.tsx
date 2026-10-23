'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/features/auth/AuthContext';
import {
  SlidersHorizontal,
  FileCheck2,
  FileSpreadsheet,
  Users2,
  AlertTriangle,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Building,
  CheckCircle,
} from 'lucide-react';

interface AdminSidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function AdminSidebar({ mobileOpen, setMobileOpen }: AdminSidebarProps) {
  const { lang } = useLanguage();
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    {
      href: '/admin/dashboard',
      labelEn: 'Command Center',
      labelHi: 'नियंत्रण कक्ष',
      icon: SlidersHorizontal,
      description: 'Central municipal oversight',
    },
    {
      href: '/admin/complaints',
      labelEn: 'All Complaints',
      labelHi: 'समस्त शिकायतें',
      icon: FileCheck2,
      description: 'City-wide issue audit queue',
    },
    {
      href: '/admin/departments',
      labelEn: 'Department Directory',
      labelHi: 'विभाग व क्षेत्रीय कार्यालय',
      icon: FileSpreadsheet,
      description: 'Ward units & bulk CSV import',
    },
    {
      href: '/admin/employees',
      labelEn: 'Employees & Scope',
      labelHi: 'कर्मचारी व अधिकार क्षेत्र',
      icon: Users2,
      description: 'Staff clearances & jurisdiction',
    },
    {
      href: '/admin/escalations',
      labelEn: 'Escalations',
      labelHi: 'SLA उल्लंघन व एस्केलेशन',
      icon: AlertTriangle,
      badge: 'SLA',
      description: 'Overdue breach audit log',
    },
    {
      href: '/admin/reports',
      labelEn: 'Reports & Analytics',
      labelHi: 'रिपोर्ट्स एवं विश्लेषण',
      icon: BarChart3,
      description: 'SLA compliance & CSV export',
    },
    {
      href: '/admin/settings',
      labelEn: 'SLA & Settings',
      labelHi: 'SLA नीतियां व सेटिंग्स',
      icon: Settings,
      description: 'Priority threshold policies',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0f2137] text-white select-none">
      {/* Brand & Clearance Header */}
      <div className="p-5 border-b border-[#244670]">
        <div className="flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E07B2E] text-white flex items-center justify-center font-bold shadow-sm shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5 font-heading">
                FixMyCity
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#E07B2E]/20 text-[#E07B2E] border border-[#E07B2E]/40">
                  Admin
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-sans">
                {lang === 'hi' ? 'केंद्रीय प्रशासनिक नियंत्रण कक्ष' : 'Executive Command Center'}
              </div>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 px-3 py-1.5 rounded-lg bg-[#17304F] border border-[#244670] flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-mono">ADM-EXEC-001</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            CLEARANCE ACTIVE
          </span>
        </div>
      </div>

      {/* Primary Navigation Links (All 7 Destinations Visibly Listed) */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {lang === 'hi' ? 'प्रशासनिक मॉड्यूल' : 'Executive Modules'}
        </div>

        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-[#17304F] text-white border-l-4 border-[#E07B2E] shadow-sm font-bold'
                  : 'text-slate-300 hover:bg-[#17304F]/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#E07B2E]' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <div>
                  <div className="leading-snug">
                    {lang === 'hi' ? link.labelHi : link.labelEn}
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal leading-tight hidden lg:block">
                    {link.description}
                  </div>
                </div>
              </div>

              {link.badge && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-900/60 text-red-300 border border-red-700/50">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Signed-in Administrator Info */}
      <div className="p-4 border-t border-[#244670] bg-[#0c1a2c]">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 max-w-[170px] truncate">
            <div className="text-xs font-bold text-white truncate font-heading">
              {user?.name || 'Executive Administrator'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {lang === 'hi' ? 'कार्यकारी प्रशासनिक निगरानी' : 'Executive Administrative Oversight'}
            </div>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            className="p-2 rounded-lg bg-[#17304F] hover:bg-red-900/40 text-slate-300 hover:text-red-300 border border-[#244670] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Persistent Desktop Sidebar (width w-64, fixed sticky, zero dropdowns) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40 border-r border-[#244670]">
        {sidebarContent}
      </aside>

      {/* Responsive Mobile Drawer / Slide-Over */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0f2137] z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
