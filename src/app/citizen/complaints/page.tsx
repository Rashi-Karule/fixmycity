'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CivicMap from '@/components/maps/CivicMap';
import { ComplaintCard } from '@/components/complaints/ComplaintCard';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/features/auth/AuthContext';
import { Complaint, DepartmentOffice, CivicCategory, ComplaintStatus } from '@/types';
import { Filter, Map, List, Search } from 'lucide-react';

export default function CommunityFeedPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [offices, setOffices] = useState<DepartmentOffice[]>([]);
  const [viewMode, setViewMode] = useState<'both' | 'map' | 'list'>('both');

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadComplaints = () => {
    fetch('/api/complaints')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setComplaints(data.data);
        }
      });
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOffices(data.offices);
        }
      });
  };

  useEffect(() => {
    loadComplaints();
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

  // Filter logic
  const filtered = complaints.filter((c) => {
    if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && c.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchTrack = c.tracking_id.toLowerCase().includes(q);
      const matchAddr = c.address.toLowerCase().includes(q);
      if (!matchTitle && !matchTrack && !matchAddr) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Header & View Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17304F] font-heading">
              {t('nav.communityIssues', 'Community Grievances & GIS Feed')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Live municipal tickets reported by citizens across Pune Corporation wards.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-200 p-1 rounded-lg">
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

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by title, location or reference ID..."
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
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-[#17304F] focus:outline-hidden focus:border-[#E07B2E]"
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
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-[#17304F] focus:outline-hidden focus:border-[#E07B2E]"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map Section */}
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

          {/* Cards List Section */}
          {(viewMode === 'both' || viewMode === 'list') && (
            <div className={viewMode === 'list' ? 'lg:col-span-12' : 'lg:col-span-5'}>
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-[#17304F] uppercase tracking-wider">
                  Showing {filtered.length} Public Complaints
                </span>
                <span className="text-[11px] text-slate-400">Pune Municipal Area</span>
              </div>

              {filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
                  <div className="text-sm font-bold text-slate-700">No matching grievances found</div>
                  <p className="text-xs text-slate-500">
                    Try adjusting your filters or search keywords.
                  </p>
                </div>
              ) : (
                <div
                  className={`space-y-3.5 ${
                    viewMode === 'list' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0' : ''
                  }`}
                >
                  {filtered.map((complaint) => (
                    <ComplaintCard
                      key={complaint.id}
                      complaint={complaint}
                      onSupport={handleSupport}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
