import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';

const ParentViewPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { getStudentByToken, getAttendanceByStudent, classes, batches } = useData();

  const student = useMemo(() => token ? getStudentByToken(token) : undefined, [token, getStudentByToken]);
  const records = useMemo(() => student ? getAttendanceByStudent(student.id) : [], [student, getAttendanceByStudent]);

  const stats = useMemo(() => {
    const present = records.filter(r => r.status === 'P').length;
    const absent = records.filter(r => r.status === 'A').length;
    const total = present + absent;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, total, percentage };
  }, [records]);

  // Current month records
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthRecords = useMemo(() => records.filter(r => r.attendance_date.startsWith(currentMonth)), [records, currentMonth]);

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Invalid Link</h1>
          <p className="text-muted-foreground text-sm">This attendance link is not valid or has expired.</p>
        </div>
      </div>
    );
  }

  const cls = classes.find(c => c.id === student.class_id);
  const batch = batches.find(b => b.id === student.batch_id);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card p-4">
        <h1 className="font-bold text-lg">
          <span className="text-primary">Bhaskarwar's</span> Coaching
        </h1>
        <p className="text-xs text-muted-foreground">Attendance Portal</p>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Student info */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-bold text-lg">{student.full_name}</h2>
          <p className="text-sm text-muted-foreground">
            Roll #{student.roll_number} · {cls?.name} · {batch?.name}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-success">{stats.present}</p>
            <p className="text-xs text-muted-foreground">Present</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.absent}</p>
            <p className="text-xs text-muted-foreground">Absent</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className={`text-2xl font-bold ${stats.percentage >= 75 ? 'text-success' : 'text-destructive'}`}>
              {stats.percentage}%
            </p>
            <p className="text-xs text-muted-foreground">Attendance</p>
          </div>
        </div>

        {/* Current month */}
        <div className="rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-sm">
              {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </h3>
          </div>
          <div className="divide-y divide-border">
            {monthRecords.length > 0 ? monthRecords.map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm">
                  {new Date(r.attendance_date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded ${r.status === 'P' ? 'status-present-light' : 'status-absent-light'}`}>
                  {r.status === 'P' ? 'Present' : 'Absent'}
                </span>
              </div>
            )) : (
              <p className="text-center text-muted-foreground py-6 text-sm">No records this month</p>
            )}
          </div>
        </div>

        {/* Recent history */}
        {records.length > monthRecords.length && (
          <div className="rounded-xl border border-border bg-card">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-sm">Recent History</h3>
            </div>
            <div className="divide-y divide-border">
              {records.slice(0, 20).map(r => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm">
                    {new Date(r.attendance_date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded ${r.status === 'P' ? 'status-present-light' : 'status-absent-light'}`}>
                    {r.status === 'P' ? 'Present' : 'Absent'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentViewPage;
