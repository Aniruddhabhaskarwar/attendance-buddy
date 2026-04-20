import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getPublicClassStudentsByToken,
  getStudentAttendanceByToken,
} from '@/lib/dataApi';
import { Users, ChevronDown, ChevronRight, CalendarDays } from 'lucide-react';
import { ThemeToggle } from "../components/ThemeToggle";

type AttendanceStatus = 'P' | 'A';

type ClassItem = {
  id: string;
  name: string;
  organization_id: string;
  created_at: string;
};

type Student = {
  id: string;
  full_name: string;
  roll_number: string;
  class_id: string;
  batch_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type AttendanceRecord = {
  id: string;
  student_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  created_at: string;
  updated_at: string;
};

type StudentAttendanceSummary = {
  present: number;
  absent: number;
  total: number;
  percentage: number;
};

type StudentAttendancePayload = {
  summary: StudentAttendanceSummary;
  attendance: AttendanceRecord[];
};

const formatDate = (date: string) => {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getAttendanceBadgeClass = (status: AttendanceStatus) => {
  return status === 'P'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30';
};

const getPercentageClass = (percentage: number) => {
  if (percentage >= 90) return 'text-emerald-600 dark:text-emerald-400';
  if (percentage >= 75) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
};

export default function ParentViewPage() {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<ClassItem | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [openStudentId, setOpenStudentId] = useState<string | null>(null);
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, StudentAttendancePayload>
  >({});
  const [loadingStudentId, setLoadingStudentId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        if (!token) {
          if (mounted) {
            setErrorMsg('Invalid or missing link.');
            setLoading(false);
          }
          return;
        }

        const cleanToken = token.replace(/^class-/, '').trim();
        const { data, error } = await getPublicClassStudentsByToken(cleanToken);

        if (!mounted) return;

        if (error) {
          setErrorMsg(error.message || 'Failed to load class data.');
          setLoading(false);
          return;
        }

        const payload = data as { class?: ClassItem; students?: Student[] } | null;

        if (!payload?.class) {
          setErrorMsg('This parent link is invalid or has expired.');
          setLoading(false);
          return;
        }

        setClassData(payload.class);
        setStudents(payload.students || []);
        setLoading(false);
      } catch (err: any) {
        if (mounted) {
          setErrorMsg(err?.message || 'Something went wrong while loading the page.');
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [token]);

  const toggleStudent = async (studentId: string) => {
    const nextOpen = openStudentId === studentId ? null : studentId;
    setOpenStudentId(nextOpen);

    if (!token || nextOpen !== studentId || attendanceMap[studentId]) {
      return;
    }

    try {
      setLoadingStudentId(studentId);

      const cleanToken = token.replace(/^class-/, '').trim();
      const { data, error } = await getStudentAttendanceByToken(
        cleanToken,
        studentId
      );

      if (error) {
        console.error('Attendance fetch error:', error);
        return;
      }

      const payload = data as StudentAttendancePayload | null;
      if (!payload) return;

      setAttendanceMap((prev) => ({
        ...prev,
        [studentId]: payload,
      }));
    } catch (err) {
      console.error('Attendance fetch crash:', err);
    } finally {
      setLoadingStudentId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Loading parent portal...</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Please wait while we fetch the attendance details.
          </p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Unable to open portal</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {errorMsg}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto max-w-4xl px-4 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                <span className="text-primary">Class</span>
                <span className="text-foreground">Track</span>
              </p>
              <h1 className="mt-1 text-2xl font-bold">Parent Attendance Portal</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                View student attendance details for {classData?.name}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">{classData?.name}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Tap on a student card to view attendance summary and full history.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total Students
                </p>
                <p className="mt-1 text-lg font-semibold">{students.length}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Portal Access
                </p>
                <p className="mt-1 text-lg font-semibold">Active</p>
              </div>
            </div>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            No students found for this class.
          </div>
        ) : (
          <div className="space-y-4">
            {students.map((student) => {
              const studentData = attendanceMap[student.id];
              const summary = studentData?.summary;
              const records = studentData?.attendance || [];
              const present = summary?.present || 0;
              const absent = summary?.absent || 0;
              const total = summary?.total || 0;
              const percentage = summary?.percentage || 0;
              const isOpen = openStudentId === student.id;
              const isStudentLoading = loadingStudentId === student.id;

              return (
                <div
                  key={student.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <button
                    type="button"
                    onClick={() => {
                      void toggleStudent(student.id);
                    }}
                    className="w-full px-4 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-base font-semibold truncate">
                          {student.full_name}
                        </div>
                        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Roll No: {student.roll_number || '--'}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div
                            className={`text-lg font-bold ${getPercentageClass(
                              percentage
                            )}`}
                          >
                            {studentData ? `${percentage}%` : '--'}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Attendance
                          </div>
                        </div>

                        <div className="text-slate-400 dark:text-slate-500">
                          {isOpen ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-200 dark:border-slate-800">
                      {isStudentLoading && !studentData ? (
                        <div className="px-4 py-5 text-sm text-slate-500 dark:text-slate-400">
                          Loading attendance details...
                        </div>
                      ) : (
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-950">
                              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                {present}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                Present
                              </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-950">
                              <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                                {absent}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                Absent
                              </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-950">
                              <div className="text-lg font-bold">{total}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                Total Days
                              </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-950">
                              <div
                                className={`text-lg font-bold ${getPercentageClass(
                                  percentage
                                )}`}
                              >
                                {percentage}%
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                Attendance %
                              </div>
                            </div>
                          </div>

                          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                              <CalendarDays className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                              <h3 className="text-sm font-semibold">
                                Attendance History
                              </h3>
                            </div>

                            {records.length > 0 ? (
                              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                                {records.map((record) => (
                                  <div
                                    key={record.id}
                                    className="flex items-center justify-between px-4 py-3 text-sm bg-white dark:bg-slate-900"
                                  >
                                    <span className="text-slate-700 dark:text-slate-200">
                                      {formatDate(record.attendance_date)}
                                    </span>

                                    <span
                                      className={`rounded-full border px-3 py-1 text-xs font-medium ${getAttendanceBadgeClass(
                                        record.status
                                      )}`}
                                    >
                                      {record.status === 'P' ? 'Present' : 'Absent'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="px-4 py-5 text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
                                No attendance records available yet.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}