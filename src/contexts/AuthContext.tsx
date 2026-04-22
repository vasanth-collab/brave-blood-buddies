// =============================================
// AUTH CONTEXT — wraps Supabase auth (Lovable Cloud)
// =============================================

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User as SupaUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile, DonorDetails, BloodGroup } from '@/types';
import { approxCoordsForLocation } from '@/types';

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  bloodGroup: BloodGroup;
  location: string;
  pincode: string;
}

interface AuthContextType {
  session: Session | null;
  authUser: SupaUser | null;
  profile: Profile | null;
  donorDetails: DonorDetails | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (data: RegisterData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<SupaUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [donorDetails, setDonorDetails] = useState<DonorDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profile + donor details for the current user
  const loadProfile = async (userId: string) => {
    const [{ data: prof }, { data: det }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('donor_details').select('*').eq('user_id', userId).maybeSingle(),
    ]);
    setProfile(prof as Profile | null);
    setDonorDetails(det as DonorDetails | null);
  };

  useEffect(() => {
    // 1. Subscribe to auth changes FIRST (best practice)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthUser(newSession?.user ?? null);
      if (newSession?.user) {
        // Defer to avoid deadlocks inside the callback
        setTimeout(() => loadProfile(newSession.user.id), 0);
      } else {
        setProfile(null);
        setDonorDetails(null);
      }
    });

    // 2. Then check for existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthUser(s?.user ?? null);
      if (s?.user) loadProfile(s.user.id).finally(() => setIsLoading(false));
      else setIsLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (data: RegisterData) => {
    const coords = approxCoordsForLocation(data.location, data.pincode);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          name: data.name,
          phone: data.phone,
          blood_group: data.bloodGroup,
          location: data.location,
          pincode: data.pincode,
        },
      },
    });
    if (error) return { error: error.message };

    // After signup, the DB trigger creates profile/donor_details. Patch coords if known.
    if (coords) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ latitude: coords[0], longitude: coords[1] }).eq('id', user.id);
      }
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (authUser) await loadProfile(authUser.id);
  };

  return (
    <AuthContext.Provider value={{ session, authUser, profile, donorDetails, isLoading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
