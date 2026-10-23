'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Department, DepartmentOffice } from '@/types';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { Building, Phone, Mail, MapPin, Search } from 'lucide-react';

export default function CitizenDepartmentsPage() {
  const { lang } = useLanguage();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [offices, setOffices] = useState<DepartmentOffice[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/departments')
      .then((res) => res.json())
      .then((d) => {
        if (d.success) {
          setDepartments(d.departments);
          setOffices(d.offices);
        }
      });
  }, []);

  const filtered = departments.filter((d) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.name_hi.includes(q) ||
        d.code.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17304F] font-heading">
          {lang === 'hi' ? 'लोक सेवा विभाग एवं क्षेत्रीय कार्यालय निर्देशिका' : 'Public Department & Regional Office Directory'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          {lang === 'hi'
            ? 'अधिकृत जन सेवा विभाग, उनकी कार्य श्रेणियां और क्षेत्रीय रखरखाव कार्यालय विवरण।'
            : 'Directory of public departments, handled civic categories, and registered regional maintenance offices across jurisdictions.'}
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 max-w-md">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search departments by name or code (e.g. PWD, Waste)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs focus:outline-hidden"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((dept) => {
          const deptOffices = offices.filter((o) => o.department_id === dept.id);
          return (
            <div key={dept.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#E07B2E] tracking-wider uppercase bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                    {dept.code}
                  </span>
                  <h3 className="text-base font-bold text-[#17304F] font-heading mt-1.5">
                    {lang === 'hi' ? dept.name_hi : dept.name}
                  </h3>
                  <div className="text-xs text-slate-500 font-hindi mt-0.5">
                    {lang === 'hi' ? dept.name : dept.name_hi}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#17304F]/5 text-[#17304F] flex items-center justify-center shrink-0">
                  <Building className="w-4 h-4" />
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                {dept.description}
              </p>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Governed Categories:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {dept.categories.map((c) => (
                    <CategoryBadge key={c} category={c} />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-[#E07B2E] shrink-0" />
                  <span className="font-mono text-[11px]">{dept.helpline}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 truncate">
                  <Mail className="w-3.5 h-3.5 text-[#E07B2E] shrink-0" />
                  <span className="truncate text-[11px]">{dept.contact_email}</span>
                </div>
              </div>

              {/* Offices under this department */}
              {deptOffices.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-[#17304F] uppercase tracking-wider block">
                    Local Ward Offices ({deptOffices.length}):
                  </span>
                  <div className="space-y-1.5">
                    {deptOffices.map((off) => (
                      <div key={off.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                        <div className="font-semibold text-[#17304F]">{off.office_name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{off.address}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
