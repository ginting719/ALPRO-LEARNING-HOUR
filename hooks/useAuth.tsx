import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import type { Profile } from '../types';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    // Fetches the initial session and sets up listeners.
    const syncUserSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      
      if(loadingInitial) {
        setLoadingInitial(false);
      }
    };

    // Run once on initial load
    syncUserSession();

    // Listens for auth state changes (e.g., login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        const newUser = newSession?.user ?? null;
        setUser(newUser);

        if (newUser) {
           supabase
            .from('profiles')
            .select('*')
            .eq('id', newUser.id)
            .single()
            .then(({ data: userProfile }) => {
                 setProfile(userProfile);
            });
        } else {
          setProfile(null);
        }
      }
    );
    
    // When the tab becomes visible again, re-sync the session to prevent staleness.
    // This explicitly updates React state, forcing a re-render with fresh auth data.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncUserSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription?.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    profile,
    loading: loadingInitial,
    signOut,
  };

  return <AuthContext.Provider value={value}>{!loadingInitial && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
