// =============================================
// AUTH CONTEXT - Handles login, register, logout
// Uses localStorage to store user data (no backend needed)
// =============================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, DonorProfile, UserRole, BloodGroup } from '@/types';

// What the auth system provides to all components
interface AuthContextType {
  user: User | DonorProfile | null;  // current logged-in user (or null)
  isLoading: boolean;                // true while checking stored login
  login: (email: string, password: string) => boolean;
  register: (data: RegisterData) => boolean;
  logout: () => void;
  updateProfile: (updates: Partial<DonorProfile>) => void;
}

// Data needed to create a new account
interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  bloodGroup: BloodGroup;
  location: string;
  pincode: string;
  role: UserRole;
}

// Create the context (starts as undefined)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to use auth in any component: const { user, login } = useAuth();
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Wraps the entire app to provide auth everywhere
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | DonorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On app load, check if user was previously logged in
  useEffect(() => {
    const stored = localStorage.getItem('bloodbank_user');
    if (stored) setUser(JSON.parse(stored));
    setIsLoading(false);
  }, []);

  // Login: check email + password against stored users
  const login = (email: string, password: string): boolean => {
    const users = JSON.parse(localStorage.getItem('bloodbank_users') || '{}');
    const entry = users[email];
    if (entry && entry.password === password) {
      setUser(entry.user);
      localStorage.setItem('bloodbank_user', JSON.stringify(entry.user));
      return true;
    }
    return false;
  };

  // Register: create a new user and save to localStorage
  const register = (data: RegisterData): boolean => {
    const users = JSON.parse(localStorage.getItem('bloodbank_users') || '{}');
    if (users[data.email]) return false; // email already taken

    const now = new Date().toISOString();
    const newUser: User | DonorProfile = data.role === 'donor'
      ? {
          id: crypto.randomUUID(), ...data,
          role: 'donor' as const, isVerified: false, createdAt: now,
          isAvailable: true, lastDonationDate: null, totalDonations: 0,
          totalResponses: 0, totalRequests: 0, reliabilityScore: 25,
          lastActiveDate: now,
        }
      : {
          id: crypto.randomUUID(), ...data,
          role: 'requester' as const, isVerified: false, createdAt: now,
        };

    users[data.email] = { user: newUser, password: data.password };
    localStorage.setItem('bloodbank_users', JSON.stringify(users));
    setUser(newUser);
    localStorage.setItem('bloodbank_user', JSON.stringify(newUser));
    return true;
  };

  // Logout: clear current user
  const logout = () => {
    setUser(null);
    localStorage.removeItem('bloodbank_user');
  };

  // Update profile: merge new data into existing user
  const updateProfile = (updates: Partial<DonorProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('bloodbank_user', JSON.stringify(updated));

    // Also update in the users list
    const users = JSON.parse(localStorage.getItem('bloodbank_users') || '{}');
    if (users[user.email]) {
      users[user.email].user = updated;
      localStorage.setItem('bloodbank_users', JSON.stringify(users));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
