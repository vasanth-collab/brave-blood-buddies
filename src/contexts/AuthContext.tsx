import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, DonorProfile, UserRole, BloodGroup } from '@/types';

interface AuthContextType {
  user: User | DonorProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => boolean;
  register: (data: RegisterData) => boolean;
  logout: () => void;
  updateProfile: (updates: Partial<DonorProfile>) => void;
}

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | DonorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('bloodbank_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string): boolean => {
    const users: Record<string, { user: User | DonorProfile; password: string }> =
      JSON.parse(localStorage.getItem('bloodbank_users') || '{}');
    const entry = users[email];
    if (entry && entry.password === password) {
      setUser(entry.user);
      localStorage.setItem('bloodbank_user', JSON.stringify(entry.user));
      return true;
    }
    return false;
  };

  const register = (data: RegisterData): boolean => {
    const users: Record<string, { user: User | DonorProfile; password: string }> =
      JSON.parse(localStorage.getItem('bloodbank_users') || '{}');
    if (users[data.email]) return false;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    let newUser: User | DonorProfile;
    if (data.role === 'donor') {
      newUser = {
        id, name: data.name, email: data.email, phone: data.phone,
        bloodGroup: data.bloodGroup, location: data.location, pincode: data.pincode,
        role: 'donor', isVerified: false, createdAt: now,
        isAvailable: true, lastDonationDate: null, totalDonations: 0,
        totalResponses: 0, totalRequests: 0, reliabilityScore: 25,
        lastActiveDate: now,
      } as DonorProfile;
    } else {
      newUser = {
        id, name: data.name, email: data.email, phone: data.phone,
        bloodGroup: data.bloodGroup, location: data.location, pincode: data.pincode,
        role: 'requester', isVerified: false, createdAt: now,
      };
    }

    users[data.email] = { user: newUser, password: data.password };
    localStorage.setItem('bloodbank_users', JSON.stringify(users));
    setUser(newUser);
    localStorage.setItem('bloodbank_user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bloodbank_user');
  };

  const updateProfile = (updates: Partial<DonorProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('bloodbank_user', JSON.stringify(updated));
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
