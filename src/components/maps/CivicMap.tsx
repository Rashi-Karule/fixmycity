'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Complaint, DepartmentOffice } from '@/types';

interface CivicMapProps {
  complaints?: Complaint[];
  offices?: DepartmentOffice[];
  userLocation?: { lat: number; lng: number } | null;
  selectedLocation?: { lat: number; lng: number } | null;
  searchRadiusMeters?: number;
  onLocationSelect?: (coords: { lat: number; lng: number }) => void;
  interactive?: boolean;
  center?: [number, number];
  zoom?: number;
  height?: string;
}

const LeafletMapInner = dynamic(() => import('./LeafletMapInner'), {
  ssr: false,
  loading: () => (
    <div
      style={{ height: '400px' }}
      className="w-full flex flex-col items-center justify-center bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-[#64748B]"
    >
      <div className="w-8 h-8 border-3 border-[#17304F] border-t-transparent rounded-full animate-spin mb-3" />
      <span className="text-sm font-medium">Loading Civic GIS Map & OpenStreetMap Tiles...</span>
    </div>
  ),
});

export default function CivicMap(props: CivicMapProps) {
  return <LeafletMapInner {...props} />;
}
