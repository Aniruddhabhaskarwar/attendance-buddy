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
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  colorClass: string;
  tintClass: string;
}) {
  const count = useCountUp(value, 1000);

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative rounded-2xl border border-border/60 bg-card p-5 overflow-hidden cursor-default select-none"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`rounded-xl p-2.5 ${tintClass}`}>
            <Icon className={`h-4 w-4 ${colorClass}`} />
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <TrendingUp className="h-3 w-3 text-muted-foreground/40" />
          </motion.div>
        </div>

        <div className={`text-3xl font-bold tracking-tight mb-1 ${colorClass}`}>{count}</div>
        <p className="text-xs font-medium text-muted-foreground/80 leading-none">{label}</p>
      </div>
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
    },
    {
      label: 'Classes',
      value: classes.length,
      icon: BookOpen,
      colorClass: 'text-foreground',
      tintClass: 'bg-secondary',
    },
    {
      label: 'Present Today',
      value: todayPresent,
      icon: ClipboardCheck,
      colorClass: 'text-green-600 dark:text-green-400',
      tintClass: 'bg-green-500/10',
    },
    {
      label: 'Absent Today',
      value: todayAbsent,
      icon: UserX,
      colorClass: 'text-destructive',
      tintClass: 'bg-destructive/10',
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
          <p className="text-sm text-muted-foreground mt-0.5">
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
            className="relative overflow-hidden rounded-2xl bg-primary/8 border border-primary/20 p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-primary/70 uppercase tracking-wider mb-0.5">
                  Today&apos;s Rate
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-primary">{attendancePct}%</span>
                  <span className="text-sm text-muted-foreground">
                    {todayPresent}P / {todayAbsent}A
                  </span>
                </div>
              </div>

              <div className="relative w-16 h-16 shrink-0">
                <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
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

        <motion.div variants={container} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </motion.div>

        <motion.div variants={fadeUp}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Actions
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <motion.div
                key={action.to}
                variants={fadeUp}
                whileHover={{ y: -3, transition: { duration: 0.18 } }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={action.to}
                  className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 hover:border-primary/40 transition-colors duration-200"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                  <div className="shrink-0 rounded-xl bg-primary/10 p-2.5 group-hover:bg-primary/15 transition-colors">
                    <action.icon className="h-5 w-5 text-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm leading-none mb-1">{action.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{action.desc}</p>
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
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