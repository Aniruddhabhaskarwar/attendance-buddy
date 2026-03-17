import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Users, BookOpen, ClipboardCheck, History, LayoutDashboard, LogOut, Menu, X, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/attendance', label: 'Mark Attendance', icon: ClipboardCheck },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/classes', label: 'Classes', icon: BookOpen },
  { to: '/fees', label: 'Fees', icon: IndianRupee },
  { to: '/history', label: 'History', icon: History },
];

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 -ml-2 rounded-md hover:bg-secondary" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/dashboard" className="font-bold text-lg tracking-tight">
              <span className="text-primary">Bhaskarwar's</span> <span className="hidden sm:inline">Coaching</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.full_name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden md:flex w-56 flex-col border-r border-border min-h-[calc(100vh-3.5rem)] bg-card p-3 gap-1">
          {navItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-foreground/20" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed top-14 left-0 w-64 bg-card border-r border-border h-[calc(100vh-3.5rem)] p-3 flex flex-col gap-1 animate-slide-up">
              {navItems.map(item => {
                const active = location.pathname === item.to;
                return (
                  <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <main className="flex-1 min-h-[calc(100vh-3.5rem)]">
          <div className="container py-4 md:py-6 max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
