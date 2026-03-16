import React, { createContext, useContext, useState, useCallback } from 'react';
import { ClassItem, Batch, Student, AttendanceRecord, AttendanceStatus } from '@/lib/types';
import { mockClasses, mockBatches, mockStudents, mockAttendance } from '@/lib/mock-data';

interface DataContextType {
  classes: ClassItem[];
  batches: Batch[];
  students: Student[];
  attendance: AttendanceRecord[];
  addClass: (name: string) => void;
  addBatch: (classId: string, name: string) => void;
  addStudent: (student: Omit<Student, 'id' | 'parent_access_token' | 'created_at' | 'updated_at'>) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  saveAttendance: (records: { studentId: string; status: AttendanceStatus; date: string }[]) => void;
  getStudentsByBatch: (batchId: string) => Student[];
  getAttendanceByStudent: (studentId: string) => AttendanceRecord[];
  getStudentByToken: (token: string) => Student | undefined;
  importStudentsCSV: (data: Array<Record<string, string>>) => void;
  regenerateParentToken: (studentId: string) => string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [classes, setClasses] = useState<ClassItem[]>(mockClasses);
  const [batches, setBatches] = useState<Batch[]>(mockBatches);
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(mockAttendance);

  const generateToken = () => crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

  const addClass = useCallback((name: string) => {
    setClasses(prev => [...prev, { id: crypto.randomUUID(), name, created_at: new Date().toISOString() }]);
  }, []);

  const addBatch = useCallback((classId: string, name: string) => {
    setBatches(prev => [...prev, { id: crypto.randomUUID(), class_id: classId, name, teacher_id: null, active: true, created_at: new Date().toISOString() }]);
  }, []);

  const addStudent = useCallback((student: Omit<Student, 'id' | 'parent_access_token' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    setStudents(prev => [...prev, { ...student, id: crypto.randomUUID(), parent_access_token: generateToken(), created_at: now, updated_at: now }]);
  }, []);

  const updateStudent = useCallback((id: string, updates: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s));
  }, []);

  const saveAttendance = useCallback((records: { studentId: string; status: AttendanceStatus; date: string }[]) => {
    setAttendance(prev => {
      const updated = [...prev];
      records.forEach(({ studentId, status, date }) => {
        const existing = updated.findIndex(a => a.student_id === studentId && a.attendance_date === date);
        const now = new Date().toISOString();
        if (existing >= 0) {
          updated[existing] = { ...updated[existing], status, updated_at: now };
        } else {
          updated.push({ id: crypto.randomUUID(), student_id: studentId, attendance_date: date, status, marked_by_user_id: 'user-1', created_at: now, updated_at: now });
        }
      });
      return updated;
    });
  }, []);

  const getStudentsByBatch = useCallback((batchId: string) => {
    return students.filter(s => s.batch_id === batchId && s.active);
  }, [students]);

  const getAttendanceByStudent = useCallback((studentId: string) => {
    return attendance.filter(a => a.student_id === studentId).sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));
  }, [attendance]);

  const getStudentByToken = useCallback((token: string) => {
    return students.find(s => s.parent_access_token === token);
  }, [students]);

  const importStudentsCSV = useCallback((data: Array<Record<string, string>>) => {
    const now = new Date().toISOString();
    const newStudents: Student[] = data.map(row => {
      const classItem = classes.find(c => c.name === row.class_name);
      const batch = batches.find(b => b.name === row.batch_name && b.class_id === classItem?.id);
      return {
        id: crypto.randomUUID(),
        full_name: row.full_name || '',
        roll_number: row.roll_number || '',
        class_id: classItem?.id || '',
        batch_id: batch?.id || '',
        parent_name: row.parent_name || '',
        parent_whatsapp: row.parent_whatsapp || '',
        secondary_parent_whatsapp: row.secondary_parent_whatsapp || null,
        active: true,
        parent_access_token: generateToken(),
        created_at: now,
        updated_at: now,
      };
    }).filter(s => s.full_name && s.class_id && s.batch_id);
    setStudents(prev => [...prev, ...newStudents]);
  }, [classes, batches]);

  const regenerateParentToken = useCallback((studentId: string) => {
    const newToken = generateToken();
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, parent_access_token: newToken, updated_at: new Date().toISOString() } : s));
    return newToken;
  }, []);

  return (
    <DataContext.Provider value={{ classes, batches, students, attendance, addClass, addBatch, addStudent, updateStudent, saveAttendance, getStudentsByBatch, getAttendanceByStudent, getStudentByToken, importStudentsCSV, regenerateParentToken }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
