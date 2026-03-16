import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useData } from '@/contexts/DataContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const HistoryPage: React.FC = () => {
  const { classes, students, attendance } = useData();
  const [filterClass, setFilterClass] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  const records = useMemo(() => {
    return attendance
      .filter(a => {
        if (filterDate && a.attendance_date !== filterDate) return false;
        const student = students.find(s => s.id === a.student_id);
        if (!student) return false;
        if (filterClass !== 'all' && student.class_id !== filterClass) return false;
        return true;
      })
      .map(a => ({
        ...a,
        student: students.find(s => s.id === a.student_id)!,
      }))
      .sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));
  }, [attendance, students, filterClass, filterDate]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof records>();
    records.forEach(r => {
      const existing = map.get(r.attendance_date) || [];
      existing.push(r);
      map.set(r.attendance_date, existing);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [records]);

  return (
    <AppLayout>
      <h1 className="text-xl font-bold mb-4">Attendance History</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
        />
      </div>

      <div className="space-y-4">
        {grouped.map(([date, recs]) => {
          const present = recs.filter(r => r.status === 'P').length;
          const absent = recs.filter(r => r.status === 'A').length;
          return (
            <div key={date} className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="font-semibold text-sm">{new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <div className="flex gap-3 text-xs">
                  <span className="text-success font-medium">{present}P</span>
                  <span className="text-destructive font-medium">{absent}A</span>
                </div>
              </div>
              <div className="divide-y divide-border">
                {recs.map(r => (
                  <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <span className="text-sm font-medium">{r.student.full_name}</span>
                      <span className="text-xs text-muted-foreground ml-2">#{r.student.roll_number}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${r.status === 'P' ? 'status-present-light' : 'status-absent-light'}`}>
                      {r.status === 'P' ? 'Present' : 'Absent'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {grouped.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No attendance records found</p>
        )}
      </div>
    </AppLayout>
  );
};

export default HistoryPage;
