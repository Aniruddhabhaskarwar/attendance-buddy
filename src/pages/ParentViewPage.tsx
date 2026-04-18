import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getPublicClassStudentsByToken,
  getStudentAttendanceByToken,
} from '@/lib/dataApi';

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
    ? 'bg-green-100 text-green-700 border-green-200'
    : 'bg-red-100 text-red-700 border-red-200';
};

const getPercentageClass = (percentage: number) => {
  if (percentage >= 90) return 'text-green-600';
  if (percentage >= 75) return 'text-yellow-600';
  return 'text-red-600';
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
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <h2 className="text-lg font-semibold">Loading parent portal...</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please wait while we fetch the attendance details.
          </p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <h2 className="text-lg font-semibold">Unable to open portal</h2>
          <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-5">
          <h1 className="text-xl font-bold">Parent Attendance Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View student attendance details for {classData?.name}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">{classData?.name}</h2>
              <p className="text-sm text-muted-foreground">
                Total students available: {students.length}
              </p>
            </div>

            <div className="rounded-xl bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
              Tap on a student card to view attendance summary and history
            </div>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
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
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => {
                      void toggleStudent(student.id);
                    }}
                    className="w-full px-4 py-4 text-left transition hover:bg-muted/40"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-base font-semibold">
                          {student.full_name}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
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
                          <div className="text-xs text-muted-foreground">
                            Attendance
                          </div>
                        </div>

                        <div className="text-lg text-muted-foreground">
                          {isOpen ? '▾' : '▸'}
                        </div>
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-border">
                      {isStudentLoading && !studentData ? (
                        <div className="px-4 py-5 text-sm text-muted-foreground">
                          Loading attendance details...
                        </div>
                      ) : (
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="rounded-xl border border-border p-4 text-center">
                              <div className="text-lg font-bold">{present}</div>
                              <div className="text-xs text-muted-foreground">
                                Present
                              </div>
                            </div>

                            <div className="rounded-xl border border-border p-4 text-center">
                              <div className="text-lg font-bold">{absent}</div>
                              <div className="text-xs text-muted-foreground">
                                Absent
                              </div>
                            </div>

                            <div className="rounded-xl border border-border p-4 text-center">
                              <div className="text-lg font-bold">{total}</div>
                              <div className="text-xs text-muted-foreground">
                                Total Days
                              </div>
                            </div>

                            <div className="rounded-xl border border-border p-4 text-center">
                              <div
                                className={`text-lg font-bold ${getPercentageClass(
                                  percentage
                                )}`}
                              >
                                {percentage}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Attendance %
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-border overflow-hidden">
                            <div className="border-b border-border bg-muted/40 px-4 py-3">
                              <h3 className="text-sm font-semibold">
                                Attendance History
                              </h3>
                            </div>

                            {records.length > 0 ? (
                              <div className="divide-y divide-border">
                                {records.map((record) => (
                                  <div
                                    key={record.id}
                                    className="flex items-center justify-between px-4 py-3 text-sm"
                                  >
                                    <span>{formatDate(record.attendance_date)}</span>

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
                              <div className="px-4 py-5 text-sm text-muted-foreground">
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