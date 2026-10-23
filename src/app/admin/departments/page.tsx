'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Department, DepartmentOffice } from '@/types';
import {
  Building,
  FileSpreadsheet,
  Upload,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Phone,
  Layers,
  Search,
} from 'lucide-react';

export default function AdminDepartmentsPage() {
  const { lang } = useLanguage();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [offices, setOffices] = useState<DepartmentOffice[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & filter
  const [search, setSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  // CSV Import state
  const [csvText, setCsvText] = useState(
    'office_name,office_code,department_id,address,latitude,longitude,service_radius_km,phone,state,district,local_body_name,lgd_code\nBBMP South Division Road Works,OFF-PWD-KA-BLR-02,d1000000-0000-0000-0000-000000000001,Jayanagar 4th Block Bengaluru,12.9298,77.5833,6.5,Not yet verified,Karnataka,Bengaluru Urban,Bruhat Bengaluru Mahanagara Palike,LGD-ULB-251301\nMCD Karol Bagh Sanitation Hub,OFF-SWM-DL-KB-01,d2000000-0000-0000-0000-000000000002,Pusa Road Karol Bagh Delhi,28.6510,77.1906,5.0,Not yet verified,Delhi (NCT),Central Delhi,Municipal Corporation of Delhi,LGD-ULB-275101'
  );
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    fetch('/api/departments')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setDepartments(d.departments || []);
          setOffices(d.offices || []);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCsvImport = async () => {
    if (!csvText.trim()) return;
    setImporting(true);
    setImportMessage(null);
    try {
      const res = await fetch('/api/admin/departments/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent: csvText }),
      });
      const data = await res.json();
      if (data.success) {
        setImportMessage({
          type: 'success',
          text:
            lang === 'hi'
              ? `सफलतापूर्वक ${data.data.addedCount} नए क्षेत्रीय कार्यालय जोड़े गए!`
              : `Successfully imported ${data.data.addedCount} new department offices!`,
        });
        loadData();
      } else {
        setImportMessage({
          type: 'error',
          text: data.error || 'Failed to import CSV.',
        });
      }
    } catch (err: unknown) {
      setImportMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Network error during CSV upload.',
      });
    } finally {
      setImporting(false);
    }
  };

  const filteredOffices = offices.filter((o) => {
    if (selectedDeptFilter !== 'ALL' && o.department_id !== selectedDeptFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        o.office_name.toLowerCase().includes(q) ||
        o.office_code.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q);
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
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-heading">
              {lang === 'hi' ? 'विभाग एवं क्षेत्रीय कार्यालय निर्देशिका' : 'Municipal Departments & Ward Directory'}
            </h1>
            <p className="text-sm text-slate-600">
              {lang === 'hi'
                ? 'कार्यालयों के जीपीएस निर्देशांक, सेवा त्रिज्या एवं CSV डेटा आयात'
                : 'Authoritative municipal office directory, GIS coordinates, service radius, and bulk CSV management'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600">
            {lang === 'hi' ? 'कुल विभाग' : 'Departments'}: <strong className="text-purple-700">{departments.length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600">
            {lang === 'hi' ? 'कुल क्षेत्रीय कार्यालय' : 'Ward Units'}: <strong className="text-purple-700">{offices.length}</strong>
          </div>
        </div>
      </div>

      {/* CSV Bulk Importer Accordion Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Upload className="w-5 h-5 text-purple-600" />
          <h2 className="text-base font-bold text-slate-900 font-heading">
            {lang === 'hi' ? 'CSV द्वारा क्षेत्रीय कार्यालयों का थोक आयात' : 'Bulk Import Department Offices (CSV)'}
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          {lang === 'hi'
            ? 'निर्देश: प्रारूप में office_name, office_code, department_id, address, latitude, longitude, service_radius_km शामिल होना चाहिए।'
            : 'Format: office_name, office_code, department_id, address, latitude, longitude, service_radius_km, phone'}
        </p>

        <textarea
          rows={4}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
        />

        {importMessage && (
          <div
            className={`p-3 rounded-lg text-xs font-semibold mb-3 flex items-center gap-2 ${
              importMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {importMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{importMessage.text}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleCsvImport}
            disabled={importing || !csvText.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{importing ? (lang === 'hi' ? 'आयात हो रहा है...' : 'Importing CSV...') : (lang === 'hi' ? 'CSV आयात निष्पादित करें' : 'Execute CSV Import')}</span>
          </button>
        </div>
      </div>

      {/* Directory Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={lang === 'hi' ? 'कार्यालय का नाम, कोड या पता खोजें...' : 'Search office name, ward code, or address...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="w-full py-2 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="ALL">{lang === 'hi' ? 'सभी विभाग' : 'All Departments'}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Offices Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mb-3" />
            <p className="text-sm">{lang === 'hi' ? 'लोड हो रहा है...' : 'Loading directory...'}</p>
          </div>
        ) : filteredOffices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Building className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-700">
              {lang === 'hi' ? 'कोई कार्यालय नहीं मिला' : 'No offices match your search'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">{lang === 'hi' ? 'कार्यालय का नाम' : 'Office Name & Code'}</th>
                  <th className="py-3 px-4">{lang === 'hi' ? 'संबद्ध विभाग' : 'Department'}</th>
                  <th className="py-3 px-4">{lang === 'hi' ? 'पता' : 'Address'}</th>
                  <th className="py-3 px-4">{lang === 'hi' ? 'GPS निर्देशांक' : 'GIS Lat/Long'}</th>
                  <th className="py-3 px-4">{lang === 'hi' ? 'सेवा त्रिज्या' : 'Service Radius'}</th>
                  <th className="py-3 px-4">{lang === 'hi' ? 'संपर्क' : 'Contact'}</th>
                  <th className="py-3 px-4 text-center">{lang === 'hi' ? 'स्थिति' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOffices.map((off) => {
                  const dept = departments.find((d) => d.id === off.department_id);
                  return (
                    <tr key={off.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{off.office_name}</div>
                        <div className="font-mono text-[10px] text-purple-700">{off.office_code}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {dept?.name || 'Department'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{off.address}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {off.latitude.toFixed(4)}, {off.longitude.toFixed(4)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                          {off.service_radius_km} km
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{off.phone || '020-25501000'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          ACTIVE
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
