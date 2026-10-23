'use client';

import React from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { UserCheck, Building2, Mail, Phone, ShieldCheck, LogOut } from 'lucide-react';

export default function EmployeeProfilePage() {
  const { user, logout } = useAuth();
  const { lang } = useLanguage();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#17304F] font-heading">
          {lang === 'hi' ? 'कर्मचारी प्रोफ़ाइल एवं अधिकृत कार्यक्षेत्र' : 'Staff Profile & Authorized Scope'}
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Verified departmental credentials and assigned public service operational jurisdiction.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#17304F]">{user?.name}</h2>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>Role: <strong className="text-blue-700">Government Employee</strong></span>
              <span>&bull;</span>
              <span>ID: <strong className="font-mono text-slate-800">{user?.employee_id || 'EMP-PWD-409'}</strong></span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium">Assigned Public Department:</span>
            <div className="font-bold text-[#17304F] flex items-center gap-1.5 pt-0.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>{user?.department_name || 'Public Works & Roads Infrastructure Dept'}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium">Official Contact Email:</span>
            <div className="font-bold text-[#17304F] flex items-center gap-1.5 pt-0.5 truncate">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="truncate">{user?.email || 'officer.pwd@civic.sample.in'}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium">Operational Jurisdiction:</span>
            <div className="font-bold text-[#17304F] pt-0.5">
              Assigned Regional Maintenance Sector
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium">Authorization Status:</span>
            <div className="font-bold text-emerald-700 flex items-center gap-1 pt-0.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Active Field Verification Clearance</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs font-semibold transition-colors border border-slate-300 hover:border-red-300"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Staff Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
}
