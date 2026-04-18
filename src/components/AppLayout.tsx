import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  BookOpen,
  ClipboardCheck,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  IndianRupee,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck },
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
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? 'border-border/60 bg-background/80 backdrop-blur-xl shadow-[0_1px_12px_rgba(0,0,0,0.06)]'
            : 'border-transparent bg-background/95 backdrop-blur-sm'
        }`}
      >
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileMenuOpen ? (
                  <motion.div
                    key="x"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <Link to="/dashboard" className="font-bold text-lg tracking-tight select-none">
              <span className="text-primary">Bhaskarwar&apos;s</span>
              <span className="hidden sm:inline text-foreground"> Coaching</span>
            </Link>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDark((d) => !d)}
              className="h-8 w-8 rounded-xl"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                {dark ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, scale: 0.5 }}
                    animate={{ rotate: 0, scale: 1 }}
                    exit={{ rotate: 90, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, scale: 0.5 }}
                    animate={{ rotate: 0, scale: 1 }}
                    exit={{ rotate: -90, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>

            <span className="text-sm text-muted-foreground hidden sm:block px-2 border-l border-border/60">
              {user?.full_name}
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 rounded-xl hover:text-destructive hover:bg-destructive/10"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden md:flex w-56 flex-col border-r border-border/60 min-h-[calc(100vh-3.5rem)] bg-card/50 p-3 gap-0.5 sticky top-14 self-start">
          {navItems.map((item) => {
            const active = location.pathname === item.to;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <item.icon className="h-4 w-4 relative z-10 shrink-0" />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </aside>

        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 md:hidden bg-foreground/20 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              />

              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                className="fixed top-14 left-0 z-50 w-64 bg-card border-r border-border/60 h-[calc(100vh-3.5rem)] p-3 flex flex-col gap-0.5 md:hidden"
              >
                {navItems.map((item, i) => {
                  const active = location.pathname === item.to;

                  return (
                    <motion.div
                      key={item.to}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                    >
                      <Link
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        }`}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 min-h-[calc(100vh-3.5rem)]">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="container py-4 md:py-6 max-w-5xl"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;