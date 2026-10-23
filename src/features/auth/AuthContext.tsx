'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '@/types';
import { INITIAL_PROFILES } from '@/lib/db/mockData';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  loginCitizen: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  loginEmployee: (employeeId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAdmin: (adminId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('fixmycity_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        // Default to demo citizen session for ease of presentation, or null
        setUser(INITIAL_PROFILES[0]);
      }
    } catch {
      setUser(INITIAL_PROFILES[0]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveUser = (u: UserProfile | null) => {
    setUser(u);
    try {
      if (u) {
        localStorage.setItem('fixmycity_user', JSON.stringify(u));
      } else {
        localStorage.removeItem('fixmycity_user');
      }
    } catch {
      // storage unavailable
    }
  };

  const loginCitizen = async (phone: string, otp: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number' };
    }
    if (otp !== '123456' && otp.length !== 6) {
      return { success: false, error: 'Invalid OTP. For prototype demo, use OTP 123456' };
    }

    const citizenProfile: UserProfile = {
      id: `u-citizen-${cleanPhone.slice(-6)}`,
      name: `Aarav Sharma`,
      phone: `+91 ${cleanPhone.slice(-10)}`,
      role: 'CITIZEN',
      identity_verified: true,
      identity_verification_status: 'VERIFIED_MOBILE_OTP',
      identity_verification_method: 'MOBILE_OTP',
      identity_verified_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    saveUser(citizenProfile);
    return { success: true };
  };

  const loginEmployee = async (employeeId: string, password: string) => {
    const trimmedId = (employeeId || '').trim().toUpperCase();
    if (!trimmedId) return { success: false, error: 'Employee ID is required' };

    // Matches seeded PWD officer or demo credentials
    if (password !== 'Officer@123' && password !== 'demo123') {
      return { success: false, error: 'Invalid password. Prototype password is: Officer@123' };
    }

    const empProfile: UserProfile = INITIAL_PROFILES.find((p) => p.role === 'EMPLOYEE') || {
      id: 'u2000000-0000-0000-0000-000000000002',
      name: 'Duty Engineer (Roads Division)',
      email: 'officer.pwd@civic.sample.in',
      role: 'EMPLOYEE',
      department_id: 'd1000000-0000-0000-0000-000000000001',
      department_name: 'Public Works & Roads Infrastructure Dept',
      employee_id: trimmedId,
      identity_verified: true,
      identity_verification_status: 'VERIFIED_MOBILE_OTP',
      identity_verification_method: 'MOBILE_OTP',
      identity_verified_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    saveUser(empProfile);
    return { success: true };
  };

  const loginAdmin = async (adminId: string, password: string) => {
    const trimmedId = (adminId || '').trim().toUpperCase();
    if (!trimmedId) return { success: false, error: 'Admin ID is required' };

    if (password !== 'Admin@123' && password !== 'demo123') {
      return { success: false, error: 'Invalid password. Prototype password is: Admin@123' };
    }

    const adminProfile: UserProfile = INITIAL_PROFILES.find((p) => p.role === 'ADMIN') || {
      id: 'u3000000-0000-0000-0000-000000000003',
      name: 'Municipal Executive Administrator',
      email: 'admin.oversight@civic.sample.in',
      role: 'ADMIN',
      employee_id: trimmedId,
      identity_verified: true,
      identity_verification_status: 'VERIFIED_MOBILE_OTP',
      identity_verification_method: 'MOBILE_OTP',
      identity_verified_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    saveUser(adminProfile);
    return { success: true };
  };

  const logout = () => {
    saveUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginCitizen,
        loginEmployee,
        loginAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
