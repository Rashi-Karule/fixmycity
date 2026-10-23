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
  switchDemoRole: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Default to citizen user for instant friction-free exploration
  const [user, setUser] = useState<UserProfile | null>(INITIAL_PROFILES[0]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('fixmycity_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        setUser(INITIAL_PROFILES[0]); // Default demo citizen
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
    // Validates 10-digit Indian mobile and prototype OTP (123456 or any 6 digits for testing)
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number' };
    }
    if (otp !== '123456' && otp.length !== 6) {
      return { success: false, error: 'Invalid OTP. For prototype demo, use OTP 123456' };
    }

    const citizenProfile: UserProfile = {
      id: `u-citizen-${cleanPhone.slice(-6)}`,
      name: `Citizen (${cleanPhone.slice(-4)})`,
      phone: `+91 ${cleanPhone.slice(-10)}`,
      role: 'CITIZEN',
      created_at: new Date().toISOString(),
    };

    saveUser(citizenProfile);
    return { success: true };
  };

  const loginEmployee = async (employeeId: string, password: string) => {
    const trimmedId = (employeeId || '').trim().toUpperCase();
    if (!trimmedId) return { success: false, error: 'Employee ID is required' };

    // Matches seeded PWD officer or demo pattern
    if (password !== 'Officer@123' && password !== 'demo123') {
      return { success: false, error: 'Invalid password. Prototype password is: Officer@123' };
    }

    const empProfile: UserProfile = INITIAL_PROFILES.find((p) => p.role === 'EMPLOYEE') || {
      id: 'u-employee-demo',
      name: 'Er. Sunita Kulkarni (PWD Officer)',
      email: 'officer.pwd@punemunicipal.demo.in',
      role: 'EMPLOYEE',
      department_id: 'd1000000-0000-0000-0000-000000000001',
      department_name: 'Public Works & Roads Infrastructure Dept',
      employee_id: trimmedId,
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
      id: 'u-admin-demo',
      name: 'Dr. Rajeshwar Rao, IAS (Municipal Commissioner)',
      email: 'commissioner@punemunicipal.demo.in',
      role: 'ADMIN',
      employee_id: trimmedId,
      created_at: new Date().toISOString(),
    };

    saveUser(adminProfile);
    return { success: true };
  };

  const switchDemoRole = (role: UserRole) => {
    const match = INITIAL_PROFILES.find((p) => p.role === role);
    if (match) {
      saveUser(match);
    }
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
        switchDemoRole,
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
