'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Complaint, DepartmentOffice } from '@/types';

interface LeafletMapInnerProps {
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

export default function LeafletMapInner({
  complaints = [],
  offices = [],
  userLocation,
  selectedLocation,
  searchRadiusMeters,
  onLocationSelect,
  interactive = true,
  center = [20.5937, 78.9629], // Geographic center of India (Pan-India default)
  zoom = 5,
  height = '450px',
}: LeafletMapInnerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const initialCenter = selectedLocation
      ? [selectedLocation.lat, selectedLocation.lng] as [number, number]
      : userLocation
      ? [userLocation.lat, userLocation.lng] as [number, number]
      : center;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom,
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: interactive ? 'center' : false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    if (interactive && onLocationSelect) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // run once on mount

  // Render markers and layers whenever props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing dynamic layers
    const layerGroup = L.layerGroup().addTo(map);

    // Helper for pin styling
    const createPin = (color: string, label: string) => {
      return L.divIcon({
        className: 'custom-civic-pin',
        html: `
          <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.35); border: 2px solid white;">
            <div style="transform: rotate(45deg); font-size: 11px; font-weight: bold; color: white;">${label}</div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      });
    };

    // Render Complaints
    complaints.forEach((c) => {
      let color = '#d97706'; // pending amber
      let label = 'P';
      if (c.status === 'RESOLVED') {
        color = '#059669'; // resolved emerald
        label = '✓';
      } else if (c.status === 'IN_PROGRESS') {
        color = '#2563eb'; // blue
        label = '⚙';
      } else if (c.is_escalated) {
        color = '#dc2626'; // red
        label = '!';
      }

      const marker = L.marker([c.latitude, c.longitude], {
        icon: createPin(color, label),
      });

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; font-size: 13px; line-height: 1.4; max-width: 240px; padding: 4px;">
          <div style="font-size: 11px; font-weight: 700; color: #E07B2E; text-transform: uppercase;">${c.tracking_id}</div>
          <div style="font-weight: 600; color: #17304F; margin: 2px 0 4px;">${c.title}</div>
          <div style="font-size: 11px; color: #64748B; margin-bottom: 6px;">${c.address}</div>
          <div style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; background: ${color}20; color: ${color};">
            ${c.status}
          </div>
          <div style="margin-top: 8px;">
            <a href="/track?id=${c.tracking_id}" style="color: #17304F; text-decoration: underline; font-weight: 600; font-size: 11px;">View Complaint →</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml).addTo(layerGroup);
    });

    // Render Department Offices
    offices.forEach((off) => {
      const officeIcon = L.divIcon({
        className: 'office-pin',
        html: `
          <div style="background-color: #17304F; width: 30px; height: 30px; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(23,48,79,0.4); border: 2px solid #E07B2E;">
            <span style="font-size: 14px;">🏛️</span>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker([off.latitude, off.longitude], { icon: officeIcon });
      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; font-size: 12px; max-width: 220px;">
          <div style="font-weight: 700; color: #17304F;">${off.office_name}</div>
          <div style="color: #64748B; font-size: 11px;">${off.address}</div>
          <div style="color: #17304F; font-size: 11px; margin-top: 4px;"><strong>Helpline:</strong> ${off.phone}</div>
        </div>
      `;
      marker.bindPopup(popupHtml).addTo(layerGroup);
    });

    // Selected Pin (e.g. while reporting issue)
    if (selectedLocation) {
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.remove();
      }
      const selIcon = L.divIcon({
        className: 'selected-pin',
        html: `
          <div style="background-color: #E07B2E; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(224,123,46,0.6); border: 3px solid white;">
            <div style="transform: rotate(45deg); font-size: 13px; font-weight: bold; color: white;">📍</div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      selectedMarkerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng], {
        icon: selIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      // Render search radius circle if provided
      if (searchRadiusMeters) {
        if (circleRef.current) circleRef.current.remove();
        circleRef.current = L.circle([selectedLocation.lat, selectedLocation.lng], {
          radius: searchRadiusMeters,
          color: '#E07B2E',
          fillColor: '#E07B2E',
          fillOpacity: 0.12,
          weight: 2,
          dashArray: '4, 6',
        }).addTo(map);
      }
    }

    return () => {
      layerGroup.remove();
      if (circleRef.current) circleRef.current.remove();
    };
  }, [complaints, offices, selectedLocation, searchRadiusMeters]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: '100%', borderRadius: '8px', zIndex: 10 }}
      className="border border-[#E2E8F0] shadow-xs"
    />
  );
}
