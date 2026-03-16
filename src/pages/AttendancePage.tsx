import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useData } from '@/contexts/DataContext';
import { AttendanceStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

const AttendancePage: React.FC = () => {
  const { classes, batches, getStudentsByBatch, saveAttendance, attendance } = useData();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);

  const filteredBatches = useMemo(
    () => batches.filter(b => b.class_id === selectedClass && b.active),
    [batches, selectedClass]
  );

  const students = useMemo(() => {
    if (!selectedBatch) return [];
    const list = getStudentsByBatch(selectedBatch);
    // Initialize statuses - default to P, or use existing attendance
    const initial: Record<string, AttendanceStatus> = {};
    list.forEach(s => {
      const existing = attendance.find(a => a.student_id === s.id && a.attendance_date === date);
      initial[s.id] = existing?.status || 'P';
    });
    if (Object.keys(statuses).length === 0 || Object.keys(statuses)[0] !== list[0]?.id) {
      setStatuses(initial);
    }
    return list;
  }, [selectedBatch, getStudentsByBatch, attendance, date]);

  const toggleStatus = (studentId: string) => {
    setStatuses(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'P' ? 'A' : 'P',
    }));
  };

  const handleSave = () => {
    setSaving(true);
    const records = students.map(s => ({
      studentId: s.id,
      status: statuses[s.id] || 'P',
      date,
    }));
    saveAttendance(records);
    setSaving(false);

    const present = records.filter(r => r.status === 'P').length;
    const absent = records.filter(r => r.status === 'A').length;
    toast.success(`Attendance saved! ${present}P / ${absent}A`);
  };

  const handleClassChange = (val: string) => {
    setSelectedClass(val);
    setSelectedBatch('');
    setStatuses({});
  };

  const handleBatchChange = (val: string) => {
    setSelectedBatch(val);
    setStatuses({});
  };

  const presentCount = Object.values(statuses).filter(s => s === 'P').length;
  const absentCount = Object.values(statuses).filter(s => s === 'A').length;

  return (
    <AppLayout>
      <h1 className="text-xl font-bold mb-4">Mark Attendance</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Select value={selectedClass} onValueChange={handleClassChange}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select Class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedBatch} onValueChange={handleBatchChange} disabled={!selectedClass}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select Batch" />
          </SelectTrigger>
          <SelectContent>
            {filteredBatches.map(b => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <input
          type="date"
          value={date}
          onChange={e => { setDate(e.target.value); setStatuses({}); }}
          className="h-12 rounded-lg border border-input bg-background px-3 text-sm"
        />
      </div>

      {/* Summary bar */}
      {students.length > 0 && (
        <div className="flex items-center gap-4 text-sm mb-3 px-1">
          <span className="text-muted-foreground">{students.length} students</span>
          <span className="text-success font-medium">{presentCount} P</span>
          <span className="text-destructive font-medium">{absentCount} A</span>
        </div>
      )}

      {/* Student list */}
      <div className="space-y-2 pb-24">
        {students.map(student => {
          const status = statuses[student.id] || 'P';
          const isAbsent = status === 'A';
          return (
            <div
              key={student.id}
              className={`flex items-center justify-between rounded-xl border p-4 transition-colors ${
                isAbsent ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{student.full_name}</p>
                <p className="text-xs text-muted-foreground">Roll #{student.roll_number}</p>
              </div>
              <div className="flex gap-2 ml-3">
                <button
                  onClick={() => setStatuses(prev => ({ ...prev, [student.id]: 'P' }))}
                  className={`h-11 w-11 rounded-lg font-bold text-sm flex items-center justify-center transition-all ${
                    status === 'P'
                      ? 'bg-success text-success-foreground shadow-sm'
                      : 'bg-secondary text-muted-foreground hover:bg-success/20'
                  }`}
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setStatuses(prev => ({ ...prev, [student.id]: 'A' }))}
                  className={`h-11 w-11 rounded-lg font-bold text-sm flex items-center justify-center transition-all ${
                    status === 'A'
                      ? 'bg-destructive text-destructive-foreground shadow-sm'
                      : 'bg-secondary text-muted-foreground hover:bg-destructive/20'
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky save */}
      {students.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur border-t border-border md:left-56">
          <div className="container max-w-5xl">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 font-semibold text-base"
            >
              {saving ? 'Saving...' : `Save Attendance (${presentCount}P / ${absentCount}A)`}
            </Button>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default AttendancePage;
