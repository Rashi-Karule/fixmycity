'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, MapPin, Phone, Mail, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#17304F] text-slate-300 border-t border-[#244670] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Identity & College Prototype info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#E07B2E] flex items-center justify-center text-white font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">FixMyCity</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('nav.subtitle', 'Citizens Issue Reporting & Government Accountability System')}.
            </p>
            <div className="pt-2 text-[11px] text-slate-400 border-t border-[#244670]">
              <strong className="text-slate-200">College Idea Lab Prototype:</strong> Developed for academic evaluation with realistic civic workflows, automated SLA tracking, and GIS dispatch.
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
                <Link href="/citizen/complaints" className="hover:text-white transition-colors">
                  {t('nav.communityIssues', 'Community GIS Map')}
                </Link>
              </li>
              <li>
                <Link href="/track?id=FMC-2026-6612" className="hover:text-white transition-colors">
                  Sample Escalated Grievance
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Administrative & Operations */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Municipal Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/employee" className="hover:text-white transition-colors">
                  {t('nav.operationalDashboard', 'Staff Operational Queue')}
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">
                  {t('nav.adminCenter', 'Executive Command Center')}
                </Link>
              </li>
              <li>
                <Link href="/api/cron/escalate" target="_blank" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Scheduled Escalation Cron</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <span className="text-slate-400 text-[11px]">
                  Map Tiles: OpenStreetMap contributors
                </span>
              </li>
            </ul>
          </div>

          {/* Col 4: Realistic Ward Contacts (Demo) */}
          <div className="space-y-2 text-xs">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Demonstration City Hall
            </h4>
            <div className="flex items-start gap-2 text-slate-400">
              <MapPin className="w-4 h-4 text-[#E07B2E] shrink-0 mt-0.5" />
              <span>Municipal Central Corporation, Shivajinagar, Pune 411005</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Phone className="w-4 h-4 text-[#E07B2E] shrink-0" />
              <span>Helpline: 1800-103-0220 (Demo)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Mail className="w-4 h-4 text-[#E07B2E] shrink-0" />
              <span>grievances@fixmycity.demo.in</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#244670] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <div>
            &copy; 2026 FixMyCity. Open civic-tech architecture.
          </div>
          <div className="mt-2 sm:mt-0 text-[11px] text-slate-400">
            Complaints rendered with simulated GPS coordinates within PMC jurisdiction boundaries.
          </div>
        </div>
      </div>
    </footer>
  );
}
