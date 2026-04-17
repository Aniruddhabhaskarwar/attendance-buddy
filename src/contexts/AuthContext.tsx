import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Organization } from '@/lib/types';
import { fetchUserOrganization } from '@/lib/dataApi';

type Role = 'admin' | 'teacher';

interface AppUser {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  organization_id?: string | null;
  created_at?: string;
}

interface AuthContextType {
  user: AppUser | null;
  organization: Organization | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapUser = (authUser: any): AppUser => ({
  id: authUser.id,
  full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
  email: authUser.email || '',
  role: 'teacher',
  organization_id: null,
  created_at: authUser.created_at,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserOrg = useCallback(async (authUser: any) => {
    const mapped = mapUser(authUser);

    // set user immediately so UI can move forward
    setUser(mapped);

    try {
      const { data: orgUser, error } = await fetchUserOrganization(authUser.id);

      if (!error && orgUser) {
        const updatedUser: AppUser = {
          ...mapped,
          organization_id: orgUser.organization_id,
          role: (orgUser.role || 'teacher') as Role,
        };

        const org = Array.isArray((orgUser as any).organizations)
          ? (orgUser as any).organizations[0]
          : (orgUser as any).organizations;

        setUser(updatedUser);
        setOrganization((org || null) as Organization | null);
        return updatedUser;
      }

      if (error) {
        console.error('fetchUserOrganization error:', error);
      }

      setOrganization(null);
      return mapped;
    } catch (err) {
      console.error('loadUserOrg unexpected error:', err);
      setOrganization(null);
      return mapped;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setIsLoading(true);

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('getSession error:', error);
        }

        if (!mounted) return;

        if (session?.user) {
          await loadUserOrg(session.user);
        } else {
          setUser(null);
          setOrganization(null);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        if (mounted) {
          setUser(null);
          setOrganization(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        // fire and forget, do not block auth state handling
        void loadUserOrg(session.user);
      } else {
        setUser(null);
        setOrganization(null);
      }

      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserOrg]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error || !data.user) {
          console.error('login error:', error);
          return false;
        }

        // immediately set minimal user so route navigation can happen
        setUser(mapUser(data.user));

        // load org in background
        void loadUserOrg(data.user);

        return true;
      } catch (err) {
        console.error('Unexpected login error:', err);
        return false;
      }
    },
    [loadUserOrg]
  );

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('logout error:', err);
    } finally {
      setUser(null);
      setOrganization(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, organization, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};