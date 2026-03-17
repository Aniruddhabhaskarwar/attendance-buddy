import React, { createContext, useContext, useState, useCallback } from 'react';
import { AppUser } from '@/lib/types';

const CREDENTIALS = {
  admin: { email: 'admin@bhaskarwar.com', password: 'admin123', user: { id: 'user-1', full_name: 'Admin', email: 'admin@bhaskarwar.com', role: 'admin' as const, created_at: new Date().toISOString() } },
  teacher: { email: 'teacher@bhaskarwar.com', password: 'teacher123', user: { id: 'user-2', full_name: 'Teacher', email: 'teacher@bhaskarwar.com', role: 'teacher' as const, created_at: new Date().toISOString() } },
};

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    const match = Object.values(CREDENTIALS).find(c => c.email === email && c.password === password);
    if (match) {
      setUser(match.user);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
