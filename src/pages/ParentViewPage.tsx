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

export default function ParentViewPage() {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<ClassItem | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [openStudentId, setOpenStudentId] = useState<string | null>(null);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, StudentAttendancePayload>>({});
  const [loadingStudentId, setLoadingStudentId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        if (!token) {
          if (mounted) {
            setErrorMsg('Missing token');
            setLoading(false);
          }
          return;
        }

        const cleanToken = token.replace(/^class-/, '').trim();
        console.log('Parent token:', cleanToken);

        const { data, error } = await getPublicClassStudentsByToken(cleanToken);

        console.log('Parent class/students data:', data);
        console.log('Parent class/students error:', error);

        if (!mounted) return;

        if (error) {
          setErrorMsg(error.message || 'Failed to load data');
          setLoading(false);
          return;
        }

        const payload = data as { class?: ClassItem; students?: Student[] } | null;

        if (!payload?.class) {
          setErrorMsg('Invalid Link');
          setLoading(false);
          return;
        }

        setClassData(payload.class);
        setStudents(payload.students || []);
        setLoading(false);
      } catch (err: any) {
        console.error('Parent page load crash:', err);
        if (mounted) {
          setErrorMsg(err?.message || 'Unexpected error');
          setLoading(false);
        }
      }
    };

    load();

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
      const { data, error } = await getStudentAttendanceByToken(cleanToken, studentId);

      console.log('Student attendance data:', data);
      console.log('Student attendance error:', error);

      if (error) {
        console.error('attendance fetch error:', error);
        return;
      }

      const payload = data as StudentAttendancePayload | null;
      if (!payload) return;

      setAttendanceMap((prev) => ({
        ...prev,
        [studentId]: payload,
      }));
    } catch (err) {
      console.error('attendance fetch crash:', err);
    } finally {
      setLoadingStudentId(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm">Loading...</div>;
  }

  if (errorMsg) {
    return <div className="p-6 text-sm">{errorMsg}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card p-4">
        <h1 className="font-bold text-lg">Attendance Portal</h1>
        <p className="text-sm text-muted-foreground">{classData?.name}</p>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-3">
        {students.map((student) => {
          const studentData = attendanceMap[student.id];
          const records = studentData?.attendance || [];
          const present = studentData?.summary?.present || 0;
          const absent = studentData?.summary?.absent || 0;
          const pct = studentData?.summary?.percentage || 0;
          const isOpen = openStudentId === student.id;
          const isStudentLoading = loadingStudentId === student.id;

          return (
            <div key={student.id} className="border rounded-lg overflow-hidden bg-card">
              <button
                type="button"
                onClick={() => {
                  void toggleStudent(student.id);
                }}
                className="w-full flex justify-between items-center px-4 py-4 text-left"
              >
                <div>
                  <div className="font-semibold">{student.full_name}</div>
                  <div className="text-xs text-muted-foreground">Roll #{student.roll_number}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold">{studentData ? `${pct}%` : '--'}</span>
                  <span>{isOpen ? '▾' : '▸'}</span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t">
                  {isStudentLoading && !studentData ? (
                    <div className="px-4 py-4 text-sm text-muted-foreground">
                      Loading attendance...
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 text-center">
                        <div className="p-3">
                          <div className="font-bold">{present}</div>
                          <div className="text-xs text-muted-foreground">Present</div>
                        </div>
                        <div className="p-3">
                          <div className="font-bold">{absent}</div>
                          <div className="text-xs text-muted-foreground">Absent</div>
                        </div>
                        <div className="p-3">
                          <div className="font-bold">{pct}%</div>
                          <div className="text-xs text-muted-foreground">Attendance</div>
                        </div>
                      </div>

                      {records.length > 0 ? (
                        <div>
                          {records.map((r) => (
                            <div
                              key={r.id}
                              className="flex justify-between px-4 py-2 border-t text-sm"
                            >
                              <span>
                                {new Date(r.attendance_date + 'T00:00:00').toLocaleDateString('en-IN')}
                              </span>
                              <span>{r.status === 'P' ? 'Present' : 'Absent'}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-4 text-sm text-muted-foreground">
                          No attendance records yet
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {students.length === 0 && (
          <div className="px-4 py-4 text-sm text-muted-foreground">
            No students found for this class.
          </div>
        )}
      </div>
    </div>
  );
}