'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { UserProfile, Department } from '@/types';
import {
  Users2,
  Building2,
  ShieldCheck,
  Search,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  UserCheck,
} from 'lucide-react';

export default function AdminEmployeesPage() {
  const { lang } = useLanguage();

  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'EMPLOYEE' | 'ADMIN'>('ALL');

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/employees').then((r) => r.json()),
      fetch('/api/departments').then((r) => r.json()),
    ])
      .then(([staffData, deptData]) => {
        if (staffData.success) setStaff(staffData.data || []);
        if (deptData.success) setDepartments(deptData.departments || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = staff.filter((s) => {
    if (roleFilter !== 'ALL' && s.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        s.name.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.department_name && s.department_name.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
            <Users2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-heading">
              {lang === 'hi' ? 'नगर पालिका कर्मचारी एवं विभाग अधिकार क्षेत्र' : 'Municipal Staff & Department Scopes'}
            </h1>
            <p className="text-sm text-slate-600">
              {lang === 'hi'
                ? 'सत्यापित विभागीय कर्मचारी, विशेषाधिकार एवं कार्य-आवंटन नियंत्रण'
                : 'Verified departmental personnel, credential management, and role-enforced jurisdiction scopes'}
            </p>
          </div>
        </div>

        <div className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-600">
          {lang === 'hi' ? 'सत्यापित स्टाफ' : 'Verified Staff'}:{' '}
          <strong className="text-purple-700 font-semibold">{staff.length}</strong>
        </div>
      </div>

      {/* Security Governance Notice */}
      <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 mb-6 text-xs text-purple-900 flex items-start gap-3">
        <Lock className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold">
            {lang === 'hi' ? 'सख्त भूमिका सुरक्षा नीति:' : 'Strict Role Security Policy:'}
          </strong>{' '}
          {lang === 'hi'
            ? 'सरकारी कर्मचारी केवल अपने आवंटित विभाग की शिकायतों को देख एवं संशोधित कर सकते हैं। प्रशासकीय पैनल में कर्मचारी खातों का सार्वजनिक स्व-पंजीकरण पूर्णतया प्रतिबंधित है।'
            : 'Government staff are restricted strictly to their verified department complaints. Public self-registration for official staff or administrative access is strictly disabled.'}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={lang === 'hi' ? 'नाम, ईमेल, फोन या विभाग खोजें...' : 'Search by staff name, email, or department...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'ALL' | 'EMPLOYEE' | 'ADMIN')}
              className="w-full py-2 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="ALL">{lang === 'hi' ? 'सभी भूमिकाएँ' : 'All Staff Roles'}</option>
              <option value="EMPLOYEE">GOVERNMENT EMPLOYEE (विभागीय कर्मचारी)</option>
              <option value="ADMIN">ADMINISTRATOR (प्रशासक)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mb-3" />
            <p className="text-sm">{lang === 'hi' ? 'लोड हो रहा है...' : 'Loading personnel records...'}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-700">
              {lang === 'hi' ? 'कोई कर्मचारी नहीं मिला' : 'No staff personnel match your search'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">{lang === 'hi' ? 'अधिकारी का नाम' : 'Staff Name & Clearance'}</th>
                  <th className="py-3 px-4">{lang === 'hi' ? 'भूमिका' : 'Role'}</th>
                  <th className="py-3 px-4">{lang === 'hi' ? 'आवंटित विभाग' : 'Assigned Department'}</th>
                  <th className="py-3 px-4">{lang === 'hi' ? 'संपर्क जानकारी' : 'Contact Credentials'}</th>
                  <th className="py-3 px-4 text-center">{lang === 'hi' ? 'सत्यापन स्थिति' : 'Verification'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((person) => {
                  return (
                    <tr key={person.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{person.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">ID: {person.id}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {person.role === 'ADMIN' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            ADMINISTRATOR
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            GOVT EMPLOYEE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {person.department_name || (person.role === 'ADMIN' ? 'City-Wide Executive Oversight' : 'General Municipal')}
                        </div>
                        {person.department_id && (
                          <div className="text-[10px] font-mono text-slate-400">Dept ID: {person.department_id}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 space-y-0.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{person.email || 'govt.official@pmc.gov.in'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{person.phone || '+91 98220 00000'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>VERIFIED</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
