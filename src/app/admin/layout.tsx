'use client';

import React, { useState } from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminHeader from '@/components/layout/AdminHeader';
import { RoleGuard } from '@/features/auth/RoleGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <RoleGuard allowedRoles={['ADMIN']} portalName="Municipal Executive Command Center">
      <div className="min-h-screen bg-[#F8FAFC]">
        {/* Persistent Desktop Sidebar and Responsive Mobile Drawer */}
        <AdminSidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />

        {/* Main Application Area (Pushed on desktop by the persistent 64-width sidebar) */}
        <div className="md:pl-64 flex flex-col min-h-screen">
          <AdminHeader onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
