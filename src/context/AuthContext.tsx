import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  age: number | null;
  address: string | null;
  contact: string | null;
  email: string;
  status: string;
  avatar_url: string | null;
  created_at: string;
}

export type UserRole = 'admin' | 'resident';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  userRole: UserRole | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  registerResident: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    age: number;
    address: string;
    contact: string;
  }) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfileAndRole = useCallback(async (userId: string) => {
    const [profileRes, roleRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase.from('user_roles').select('role').eq('user_id', userId).single(),
    ]);
    if (profileRes.data) setProfile(profileRes.data as unknown as Profile);
    if (roleRes.data) setUserRole(roleRes.data.role as UserRole);
  }, []);

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        setTimeout(() => fetchProfileAndRole(session.user.id), 0);
        // Log login event
        if (event === 'SIGNED_IN') {
          supabase.from('activity_logs').insert({ user_id: session.user.id, action: 'login' }).then();
        }
      } else {
        setProfile(null);
        setUserRole(null);
      }
      setIsLoading(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfileAndRole(session.user.id).then(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileAndRole]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  };

  const logout = async () => {
    if (session?.user) {
      await supabase.from('activity_logs').insert({ user_id: session.user.id, action: 'logout' });
    }
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setUserRole(null);
  };

  const registerResident = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    age: number;
    address: string;
    contact: string;
  }) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          middle_name: data.middleName || null,
          age: data.age,
          address: data.address,
          contact: data.contact,
        },
      },
    });
    return { error: error?.message || null };
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfileAndRole(session.user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user || null,
      profile,
      userRole,
      isAdmin: userRole === 'admin',
      isLoading,
      login,
      logout,
      registerResident,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
