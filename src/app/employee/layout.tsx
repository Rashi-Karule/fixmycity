'use client';

import React from 'react';
import EmployeeNav from '@/components/layout/EmployeeNav';
import Footer from '@/components/layout/Footer';
import { RoleGuard } from '@/features/auth/RoleGuard';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['EMPLOYEE']} portalName="Government Employee Workspace">
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <EmployeeNav />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </div>
    </RoleGuard>
  );
}
