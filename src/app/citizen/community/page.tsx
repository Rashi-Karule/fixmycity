'use client';

import React, { useState, useEffect } from 'react';
import CivicMap from '@/components/maps/CivicMap';
import { ComplaintCard } from '@/components/complaints/ComplaintCard';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/features/auth/AuthContext';
import { Complaint, DepartmentOffice } from '@/types';
import { Filter, Map, List, Search } from 'lucide-react';

export default function CommunityPage() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [offices, setOffices] = useState<DepartmentOffice[]>([]);
  const [viewMode, setViewMode] = useState<'both' | 'map' | 'list'>('both');

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = () => {
    fetch('/api/complaints')
      .then((res) => res.json())
      .then((d) => d.success && setComplaints(d.data));
    fetch('/api/departments')
      .then((res) => res.json())
      .then((d) => d.success && setOffices(d.offices));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSupport = async (id: string) => {
    try {
      const res = await fetch(`/api/complaints/${id}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id || 'u1000000-0000-0000-0000-000000000001' }),
      });
      const data = await res.json();
      if (data.success) {
        setComplaints((prev) =>
          prev.map((c) => (c.id === id ? { ...c, supports_count: data.newCount } : c))
        );
      }
    } catch {
      alert('Failed to register support');
    }
  };

  const filtered = complaints.filter((c) => {
    if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && c.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!c.title.toLowerCase().includes(q) && !c.tracking_id.toLowerCase().includes(q) && !c.address.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17304F] font-heading">
            {lang === 'hi' ? 'सामुदायिक समस्याएं एवं GIS मानचित्र' : 'Community Grievances & GIS Map'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {lang === 'hi'
              ? 'विभिन्न शहरी एवं ग्रामीण क्षेत्रों में नागरिकों द्वारा दर्ज सार्वजनिक समस्याएं देखें और उनका समर्थन करें।'
              : 'Browse public complaints filed by citizens across urban and rural jurisdictions, and support issues to prioritize resolution.'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('both')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              viewMode === 'both' ? 'bg-white text-[#17304F] shadow-xs' : 'text-slate-600'
            }`}
          >
            Split View
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
              viewMode === 'map' ? 'bg-white text-[#17304F] shadow-xs' : 'text-slate-600'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Map Only</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
              viewMode === 'list' ? 'bg-white text-[#17304F] shadow-xs' : 'text-slate-600'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List Only</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by title, address, or reference ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-[#E07B2E]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-[#17304F]"
          >
            <option value="ALL">All Categories</option>
            <option value="ROADS_INFRASTRUCTURE">Roads & Potholes</option>
            <option value="WASTE_MANAGEMENT">Waste & Sanitation</option>
            <option value="WATER_SUPPLY">Water Supply</option>
            <option value="STREET_LIGHTING">Street Lighting</option>
            <option value="TRAFFIC_TRANSPORT">Traffic & Transit</option>
            <option value="ENVIRONMENT_POLLUTION">Environment</option>
            <option value="PUBLIC_HEALTH">Public Health</option>
            <option value="SAFETY_GOVERNANCE">Safety & Governance</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-[#17304F]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {(viewMode === 'both' || viewMode === 'map') && (
          <div className={viewMode === 'map' ? 'lg:col-span-12' : 'lg:col-span-7'}>
            <div className="sticky top-20">
              <CivicMap
                complaints={filtered}
                offices={offices}
                height={viewMode === 'map' ? '600px' : '520px'}
              />
            </div>
          </div>
        )}

        {(viewMode === 'both' || viewMode === 'list') && (
          <div className={viewMode === 'list' ? 'lg:col-span-12' : 'lg:col-span-5'}>
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-[#17304F] uppercase tracking-wider">
                Showing {filtered.length} Public Complaints
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                No matching community grievances found.
              </div>
            ) : (
              <div
                className={`space-y-3.5 ${
                  viewMode === 'list' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0' : ''
                }`}
              >
                {filtered.map((item) => (
                  <ComplaintCard key={item.id} complaint={item} onSupport={handleSupport} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
