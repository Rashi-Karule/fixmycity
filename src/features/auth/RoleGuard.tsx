'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from './AuthContext';
import { UserRole } from '@/types';
import { ShieldAlert, ArrowRight, LogIn } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  portalName: string;
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, portalName, children }: RoleGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3 p-6 text-[#17304F]">
        <div className="w-8 h-8 border-3 border-[#17304F] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Verifying session permissions...</span>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 shadow-md p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#17304F] font-heading">
            Authentication Required
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Please log in with your authorized credentials to access the <strong>{portalName}</strong>.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-[#E07B2E] hover:bg-[#c9671d] text-white text-xs font-bold transition-colors shadow-xs"
            >
              <span>Go to Login Screen</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Logged in, but unauthorized role
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-red-200 shadow-md p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#17304F] font-heading">
            Access Denied: Role Unauthorized
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your current active role is <strong className="text-slate-800">{user.role}</strong>. You do not hold clearance for the <strong>{portalName}</strong>.
          </p>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-left text-xs space-y-1">
            <div><strong>Active User:</strong> {user.name}</div>
            <div><strong>Role:</strong> {user.role}</div>
            {user.department_name && <div><strong>Assigned Department:</strong> {user.department_name}</div>}
          </div>
          <div className="pt-2 flex flex-col gap-2">
            {user.role === 'CITIZEN' && (
              <Link
                href="/citizen/dashboard"
                className="py-2.5 px-4 rounded-lg bg-[#17304F] hover:bg-[#244670] text-white text-xs font-bold transition-colors"
              >
                Return to Citizen Portal
              </Link>
            )}
            {user.role === 'EMPLOYEE' && (
              <Link
                href="/employee/dashboard"
                className="py-2.5 px-4 rounded-lg bg-[#17304F] hover:bg-[#244670] text-white text-xs font-bold transition-colors"
              >
                Return to Employee Portal
              </Link>
            )}
            {user.role === 'ADMIN' && (
              <Link
                href="/admin/dashboard"
                className="py-2.5 px-4 rounded-lg bg-[#17304F] hover:bg-[#244670] text-white text-xs font-bold transition-colors"
              >
                Return to Admin Command Center
              </Link>
            )}
            <Link
              href="/login"
              className="py-2 text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Sign In with Different Credentials
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
