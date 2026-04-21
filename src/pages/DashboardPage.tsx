import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { AppLayout } from '@/components/AppLayout';
import {
  Users,
  BookOpen,
  ClipboardCheck,
  UserX,
  TrendingUp,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';

function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }

    startTime.current = null;

    const step = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;

      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));

      if (progress < 1) {
        raf.current = requestAnimationFrame(step);
      }
    };

    raf.current = requestAnimationFrame(step);

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);

  return count;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  tintClass,
  to,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  colorClass: string;
  tintClass: string;
  to: string;
}) {
  const count = useCountUp(value, 1000);

  return (
    <motion.div variants={fadeUp} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
      <Link
        to={to}
        className="group relative block overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/3 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <div className="relative">
          <div className="mb-3 flex items-start justify-between">
            <div className={`rounded-xl p-2.5 ${tintClass}`}>
              <Icon className={`h-4 w-4 ${colorClass}`} />
            </div>

            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <TrendingUp className="h-3 w-3 text-muted-foreground/40" />
              </motion.div>

              <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
          </div>

          <div className={`mb-1 text-3xl font-bold tracking-tight ${colorClass}`}>{count}</div>
          <p className="text-xs font-medium leading-none text-muted-foreground/80">{label}</p>
        </div>
      </Link>
    </motion.div>
  );
}

const DashboardPage: React.FC = () => {
  const { students, classes, attendance } = useData();
  const today = getLocalDateString();

  const activeStudents = students.filter((s) => s.active).length;
  const todayAttendance = attendance.filter((a) => a.attendance_date === today);
  const todayPresent = todayAttendance.filter((a) => a.status === 'P').length;
  const todayAbsent = todayAttendance.filter((a) => a.status === 'A').length;

  const stats = [
    {
      label: 'Active Students',
      value: activeStudents,
      icon: Users,
      colorClass: 'text-primary',
      tintClass: 'bg-primary/10',
      to: '/students',
    },
    {
      label: 'Classes',
      value: classes.length,
      icon: BookOpen,
      colorClass: 'text-foreground',
      tintClass: 'bg-secondary',
      to: '/classes',
    },
    {
      label: 'Present Today',
      value: todayPresent,
      icon: ClipboardCheck,
      colorClass: 'text-green-600 dark:text-green-400',
      tintClass: 'bg-green-500/10',
      to: '/history?status=present',
    },
    {
      label: 'Absent Today',
      value: todayAbsent,
      icon: UserX,
      colorClass: 'text-destructive',
      tintClass: 'bg-destructive/10',
      to: '/history?status=absent',
    },
  ];

  const quickActions = [
    {
      label: 'Mark Attendance',
      to: '/attendance',
      icon: ClipboardCheck,
      desc: "Take today's roll call",
    },
    {
      label: 'Manage Students',
      to: '/students',
      icon: Users,
      desc: 'Add, edit or view students',
    },
    {
      label: 'Classes & Batches',
      to: '/classes',
      icon: BookOpen,
      desc: 'Organise your classes',
    },
  ];

  const attendancePct =
    todayAttendance.length > 0 ? Math.round((todayPresent / todayAttendance.length) * 100) : null;

  return (
    <AppLayout>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={fadeUp}>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </motion.div>

        {attendancePct !== null && (
          <motion.div
            variants={fadeUp}
            className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/8 p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-primary/70">
                  Today&apos;s Rate
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-primary">{attendancePct}%</span>
                  <span className="text-sm text-muted-foreground">
                    {todayPresent}P / {todayAbsent}A
                  </span>
                </div>
              </div>

              <div className="relative h-16 w-16 shrink-0">
                <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="hsl(var(--primary) / 0.15)"
                    strokeWidth="6"
                  />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - attendancePct / 100) }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                  />
                </svg>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div variants={container} className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </motion.div>

        <motion.div variants={fadeUp}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quick Actions
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {quickActions.map((action) => (
              <motion.div
                key={action.to}
                variants={fadeUp}
                whileHover={{ y: -3, transition: { duration: 0.18 } }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={action.to}
                  className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-colors duration-200 hover:border-primary/40"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                  <div className="shrink-0 rounded-xl bg-primary/10 p-2.5 transition-colors group-hover:bg-primary/15">
                    <action.icon className="h-5 w-5 text-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-sm font-semibold leading-none">{action.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{action.desc}</p>
                  </div>

                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
};

export default DashboardPage;