'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, MapPin, Phone, Mail, ExternalLink, Globe } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function Footer() {
  const { t, lang } = useLanguage();

  return (
    <footer className="bg-[#17304F] text-slate-300 border-t border-[#244670] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Identity & Neutral Disclosure */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#E07B2E] flex items-center justify-center text-white font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">FixMyCity</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              {t('nav.subtitle', 'India-Wide Civic Issue Reporting & Resolution Platform')}.
            </p>
            <div className="pt-2 text-[11px] text-slate-300 border-t border-[#244670] leading-relaxed">
              <strong className="text-amber-400 block mb-0.5 font-semibold">Civic Prototype Notice:</strong>
              FixMyCity is a civic technology prototype. Official government integration and authorization depend on the relevant public authority.
            </div>
          </div>

          {/* Col 2: Citizen Resources */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              {t('nav.title', 'Citizen Services')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/citizen/report" className="hover:text-white transition-colors">
                  {t('nav.reportIssue', 'Report an Issue')}
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-white transition-colors">
                  {t('nav.trackComplaint', 'Track Complaint Status')}
                </Link>
              </li>
              <li>
                <Link href="/citizen/community" className="hover:text-white transition-colors">
                  {t('nav.communityIssues', 'Community GIS Map')}
                </Link>
              </li>
              <li>
                <Link href="/citizen/departments" className="hover:text-white transition-colors">
                  {lang === 'hi' ? 'विभाग व कार्यालय निर्देशिका' : 'Public Directory of Offices'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Role Portals */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Role Access & Operations
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/login?role=citizen" className="hover:text-white transition-colors">
                  Citizen Portal Access
                </Link>
              </li>
              <li>
                <Link href="/login?role=employee" className="hover:text-white transition-colors">
                  Staff Operational Queue
                </Link>
              </li>
              <li>
                <Link href="/login?role=admin" className="hover:text-white transition-colors">
                  Executive Command Center
                </Link>
              </li>
              <li>
                <Link href="/api/cron/escalate" target="_blank" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Scheduled Escalation Cron</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Official External Government Resources */}
          <div className="space-y-2 text-xs">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Official Government Portals (External Links)
            </h4>
            <p className="text-[11px] text-slate-400 mb-2">
              Authoritative external portals for public records, grievance redressal, and governance standards:
            </p>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <a
                  href="https://www.india.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white flex items-center gap-1 hover:underline"
                >
                  <Globe className="w-3 h-3 text-[#E07B2E]" />
                  <span>National Portal of India</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://pgportal.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white flex items-center gap-1 hover:underline"
                >
                  <Globe className="w-3 h-3 text-[#E07B2E]" />
                  <span>CPGRAMS (Official Central Redressal)</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.umang.gov.in/landing/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white flex items-center gap-1 hover:underline"
                >
                  <Globe className="w-3 h-3 text-[#E07B2E]" />
                  <span>UMANG (Unified Citizen Services)</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://lgdirectory.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white flex items-center gap-1 hover:underline"
                >
                  <Globe className="w-3 h-3 text-[#E07B2E]" />
                  <span>Local Government Directory (LGD)</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://data.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white flex items-center gap-1 hover:underline"
                >
                  <Globe className="w-3 h-3 text-[#E07B2E]" />
                  <span>Open Government Data (OGD) India</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://guidelines.india.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white flex items-center gap-1 hover:underline"
                >
                  <Globe className="w-3 h-3 text-[#E07B2E]" />
                  <span>GIGW 3.0 Guidelines Reference</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#244670] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <div>
            &copy; 2026 FixMyCity. Open civic technology architecture.
          </div>
          <div className="mt-2 sm:mt-0 text-[11px] text-slate-400">
            Jurisdiction routing adheres to Local Government Directory (LGD) structure &amp; GIGW 3.0 accessibility principles.
          </div>
        </div>
      </div>
    </footer>
  );
}
