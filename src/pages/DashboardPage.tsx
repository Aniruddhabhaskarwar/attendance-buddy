import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { AppLayout } from '@/components/AppLayout';
import { Users, BookOpen, ClipboardCheck, UserX } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { students, classes, attendance } = useData();
  const today = new Date().toISOString().split('T')[0];

  const activeStudents = students.filter(s => s.active).length;
  const todayAttendance = attendance.filter(a => a.attendance_date === today);
  const todayAbsent = todayAttendance.filter(a => a.status === 'A').length;

  const stats = [
    { label: 'Total Students', value: activeStudents, icon: Users, color: 'text-primary' },
    { label: 'Classes', value: classes.length, icon: BookOpen, color: 'text-foreground' },
    { label: 'Marked Today', value: todayAttendance.length, icon: ClipboardCheck, color: 'text-success' },
    { label: 'Absent Today', value: todayAbsent, icon: UserX, color: 'text-destructive' },
  ];

  const quickActions = [
    { label: 'Mark Attendance', to: '/attendance', icon: ClipboardCheck },
    { label: 'Manage Students', to: '/students', icon: Users },
    { label: 'Classes', to: '/classes', icon: BookOpen },
  ];

  return (
    <AppLayout>
      <h1 className="text-xl font-bold mb-4">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quickActions.map(action => (
          <Link
            key={action.to}
            to={action.to}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:bg-primary/5 transition-colors"
          >
            <div className="rounded-lg bg-primary/10 p-2.5">
              <action.icon className="h-5 w-5 text-primary" />
            </div>
            <span className="font-medium text-sm">{action.label}</span>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
