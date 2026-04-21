import React, { useEffect, useMemo, useState } from 'react';
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
import { Check, X, IndianRupee, ClipboardCheck, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSearchParams } from "react-router-dom";

function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const AttendancePage: React.FC = () => {
  const {
    classes,
    batches,
    attendance,
    getStudentsByBatch,
    saveAttendance,
    getFeesByStudent,
  } = useData();

  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(getLocalDateString());
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

      toast.success(`Attendance saved! ${present} present, ${absent} absent`);
    } catch (error) {
      console.error('Attendance save error:', error);
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

const [searchParams] = useSearchParams();
const status = searchParams.get("status");

const filteredAttendance = attendance.filter((a) => {
  if (status === "present") return a.status === "P";
  if (status === "absent") return a.status === "A";
  return true;
});

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
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col gap-1"
        >
          <h1 className="text-2xl font-bold tracking-tight">Mark Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Track daily attendance class-wise with a quick present/absent flow.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <ClipboardCheck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Selected Date
                </p>
                <p className="text-sm font-semibold">{date}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-xl bg-green-500/10 p-2.5">
                <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Present
                </p>
                <p className="text-sm font-semibold">{presentCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-xl bg-destructive/10 p-2.5">
                <X className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Absent
                </p>
                <p className="text-sm font-semibold">{absentCount}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Select Class
              </label>
              <Select value={selectedClass} onValueChange={handleClassChange}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Attendance Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setStatuses({});
                }}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="space-y-3 pb-24"
        >
          {students.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-sm text-muted-foreground">
                {students.length} student{students.length > 1 ? 's' : ''} in this batch
              </p>
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="text-green-600 dark:text-green-400">
                  {presentCount} Present
                </span>
                <span className="text-destructive">{absentCount} Absent</span>
              </div>
            </div>
          )}

          {students.map((student, index) => {
            const status = statuses[student.id] || 'P';
            const isAbsent = status === 'A';
            const fee = getStudentFeeStatus(student.id);
            const feeUnpaid = fee && fee.status === 'unpaid';
            const feeDue = fee ? fee.total_amount - fee.paid_amount : 0;

            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: index * 0.03 }}
                className={`flex items-center justify-between rounded-2xl border p-4 transition-all shadow-sm ${
                  isAbsent
                    ? 'border-destructive/30 bg-destructive/5'
                    : 'border-border/60 bg-card'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{student.full_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Roll #{student.roll_number}
                  </p>

                  {fee && (
                    <div
                      className={`flex items-center gap-1 mt-2 text-xs font-medium ${
                        feeUnpaid ? 'text-destructive' : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      <IndianRupee className="h-3 w-3" />
                      {feeUnpaid ? `₹${feeDue} pending` : 'Fee paid'}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    type="button"
                    onClick={() =>
                      setStatuses((prev) => ({ ...prev, [student.id]: 'P' }))
                    }
                    className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all ${
                      status === 'P'
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'bg-secondary text-muted-foreground hover:bg-green-500/15'
                    }`}
                  >
                    <Check className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setStatuses((prev) => ({ ...prev, [student.id]: 'A' }))
                    }
                    className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all ${
                      status === 'A'
                        ? 'bg-destructive text-white shadow-sm'
                        : 'bg-secondary text-muted-foreground hover:bg-destructive/15'
                    }`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            );
          })}

          {selectedClass && students.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border/70 bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No students found in this class.
              </p>
            </div>
          )}

          {!selectedClass && (
            <div className="rounded-2xl border border-dashed border-border/70 bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Select a class to start marking attendance.
              </p>
            </div>
          )}
        </motion.div>

        {students.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-border/60 md:left-56">
            <div className="container max-w-5xl">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 rounded-xl font-semibold text-base"
              >
                {saving
                  ? 'Saving...'
                  : `Save Attendance (${presentCount} Present / ${absentCount} Absent)`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AttendancePage;