import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';

const ParentViewPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { getClassByToken, getStudentsByClass, getAttendanceByStudent, classes } = useData();

  const classId = useMemo(() => token ? getClassByToken(token) : undefined, [token, getClassByToken]);
  const cls = useMemo(() => classes.find(c => c.id === classId), [classId, classes]);
  const students = useMemo(() => classId ? getStudentsByClass(classId) : [], [classId, getStudentsByClass]);

  const currentMonth = new Date().toISOString().slice(0, 7);

  if (!classId || !cls) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Invalid Link</h1>
          <p className="text-muted-foreground text-sm">This attendance link is not valid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card p-4">
        <h1 className="font-bold text-lg">
          <span className="text-primary">Bhaskarwar's</span> Coaching
        </h1>
        <p className="text-xs text-muted-foreground">Attendance — {cls.name}</p>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {students.map(student => {
          const records = getAttendanceByStudent(student.id);
          const present = records.filter(r => r.status === 'P').length;
          const absent = records.filter(r => r.status === 'A').length;
          const total = present + absent;
          const pct = total > 0 ? Math.round((present / total) * 100) : 0;
          const monthRecords = records.filter(r => r.attendance_date.startsWith(currentMonth));

          return (
            <div key={student.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="font-bold text-base">{student.full_name}</h2>
                <p className="text-xs text-muted-foreground">Roll #{student.roll_number}</p>
              </div>

              <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
                <div className="p-3 text-center">
                  <p className="text-lg font-bold text-success">{present}</p>
                  <p className="text-[10px] text-muted-foreground">Present</p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-lg font-bold text-destructive">{absent}</p>
                  <p className="text-[10px] text-muted-foreground">Absent</p>
                </div>
                <div className="p-3 text-center">
                  <p className={`text-lg font-bold ${pct >= 75 ? 'text-success' : 'text-destructive'}`}>{pct}%</p>
                  <p className="text-[10px] text-muted-foreground">Attendance</p>
                </div>
              </div>

              {monthRecords.length > 0 && (
                <div className="divide-y divide-border">
                  {monthRecords.slice(0, 5).map(r => (
                    <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-xs">
                        {new Date(r.attendance_date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${r.status === 'P' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                        {r.status === 'P' ? 'Present' : 'Absent'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {students.length === 0 && (
          <p className="text-center text-muted-foreground py-8 text-sm">No students in this class</p>
        )}
      </div>
    </div>
  );
};

export default ParentViewPage;
