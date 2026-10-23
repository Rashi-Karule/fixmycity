'use client';

import React from 'react';
import CitizenNav from '@/components/layout/CitizenNav';
import Footer from '@/components/layout/Footer';
import { RoleGuard } from '@/features/auth/RoleGuard';

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['CITIZEN']} portalName="Citizen Grievance Portal">
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <CitizenNav />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </div>
    </RoleGuard>
  );
}
