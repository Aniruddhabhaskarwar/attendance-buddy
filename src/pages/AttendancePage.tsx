import React, { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useData } from '@/contexts/DataContext';
import { AttendanceStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Check, X, IndianRupee } from 'lucide-react';

const AttendancePage: React.FC = () => {
  const {
    classes,
    batches,
    getStudentsByBatch,
    saveAttendance,
    attendance,
    getFeesByStudent,
  } = useData();

  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);

  const selectedBatch = useMemo(() => {
    return batches.find((b) => b.class_id === selectedClass && b.active)?.id || '';
  }, [batches, selectedClass]);

  const students = useMemo(() => {
    if (!selectedBatch) return [];
    return getStudentsByBatch(selectedBatch);
  }, [selectedBatch, getStudentsByBatch]);

  useEffect(() => {
    if (!selectedBatch || students.length === 0) {
      setStatuses({});
      return;
    }

    const initial: Record<string, AttendanceStatus> = {};
    students.forEach((student) => {
      const existing = attendance.find(
        (a) => a.student_id === student.id && a.attendance_date === date
      );
      initial[student.id] = existing?.status || 'P';
    });

    setStatuses(initial);
  }, [selectedBatch, students, attendance, date]);

  const handleSave = async () => {
    if (!selectedClass || !selectedBatch || students.length === 0) {
      toast.error('Please select a class with students');
      return;
    }

    try {
      setSaving(true);

      const records = students.map((student) => ({
        studentId: student.id,
        status: statuses[student.id] || 'P',
        date,
      }));

      await saveAttendance(records);

      const present = records.filter((r) => r.status === 'P').length;
      const absent = records.filter((r) => r.status === 'A').length;

      toast.success(`Attendance saved! ${present}P / ${absent}A`);
    } catch (error) {
      console.error('Attendance save error:', error);
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setStatuses({});
  };

  const presentCount = Object.values(statuses).filter((s) => s === 'P').length;
  const absentCount = Object.values(statuses).filter((s) => s === 'A').length;

  const getStudentFeeStatus = (studentId: string) => {
    const studentFees = getFeesByStudent(studentId);
    if (studentFees.length === 0) return null;

    const latest = [...studentFees].sort((a, b) =>
      b.due_date.localeCompare(a.due_date)
    )[0];

    return latest;
  };

  return (
    <AppLayout>
      <h1 className="text-xl font-bold mb-4">Mark Attendance</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <Select value={selectedClass} onValueChange={handleClassChange}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select Class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setStatuses({});
          }}
          className="h-12 rounded-lg border border-input bg-background px-3 text-sm"
        />
      </div>

      {students.length > 0 && (
        <div className="flex items-center gap-4 text-sm mb-3 px-1">
          <span className="text-muted-foreground">{students.length} students</span>
          <span className="text-success font-medium">{presentCount} P</span>
          <span className="text-destructive font-medium">{absentCount} A</span>
        </div>
      )}

      <div className="space-y-2 pb-24">
        {students.map((student) => {
          const status = statuses[student.id] || 'P';
          const isAbsent = status === 'A';
          const fee = getStudentFeeStatus(student.id);
          const feeUnpaid = fee && fee.status === 'unpaid';
          const feeDue = fee ? fee.total_amount - fee.paid_amount : 0;

          return (
            <div
              key={student.id}
              className={`flex items-center justify-between rounded-xl border p-4 transition-colors ${
                isAbsent
                  ? 'border-destructive/30 bg-destructive/5'
                  : 'border-border bg-card'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{student.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  Roll #{student.roll_number}
                </p>

                {fee && (
                  <div
                    className={`flex items-center gap-1 mt-1 text-xs font-medium ${
                      feeUnpaid ? 'text-destructive' : 'text-success'
                    }`}
                  >
                    <IndianRupee className="h-3 w-3" />
                    {feeUnpaid ? `₹${feeDue} due` : 'Fee Paid'}
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-3">
                <button
                  type="button"
                  onClick={() =>
                    setStatuses((prev) => ({ ...prev, [student.id]: 'P' }))
                  }
                  className={`h-11 w-11 rounded-lg font-bold text-sm flex items-center justify-center transition-all ${
                    status === 'P'
                      ? 'bg-success text-success-foreground shadow-sm'
                      : 'bg-secondary text-muted-foreground hover:bg-success/20'
                  }`}
                >
                  <Check className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setStatuses((prev) => ({ ...prev, [student.id]: 'A' }))
                  }
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

        {selectedClass && students.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No students found in this class
          </p>
        )}
      </div>

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