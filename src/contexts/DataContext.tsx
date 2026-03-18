import React, { createContext, useContext, useState, useCallback } from 'react';
import { ClassItem, Batch, Student, AttendanceRecord, AttendanceStatus, FeeRecord, FeeStatus } from '@/lib/types';
import { mockClasses, mockBatches, mockStudents, mockAttendance, mockFees, classTokens } from '@/lib/mock-data';

interface DataContextType {
  classes: ClassItem[];
  batches: Batch[];
  students: Student[];
  attendance: AttendanceRecord[];
  fees: FeeRecord[];
  classTokens: Record<string, string>;
  addClass: (name: string) => void;
  addBatch: (classId: string, name: string) => void;
  addStudent: (student: Omit<Student, 'id' | 'parent_access_token' | 'created_at' | 'updated_at'>) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  saveAttendance: (records: { studentId: string; status: AttendanceStatus; date: string }[]) => void;
  getStudentsByBatch: (batchId: string) => Student[];
  getStudentsByClass: (classId: string) => Student[];
  getAttendanceByStudent: (studentId: string) => AttendanceRecord[];
  getStudentByToken: (token: string) => Student | undefined;
  getClassByToken: (token: string) => string | undefined;
  importStudentsCSV: (data: Array<Record<string, string>>) => void;
  regenerateParentToken: (studentId: string) => string;
  getFeesByStudent: (studentId: string) => FeeRecord[];
  addFee: (fee: Omit<FeeRecord, 'id' | 'created_at' | 'updated_at'>) => void;
  updateFee: (id: string, updates: Partial<FeeRecord>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [classes] = useState<ClassItem[]>(mockClasses);
  const [batches] = useState<Batch[]>(mockBatches);
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(mockAttendance);
  const [fees, setFees] = useState<FeeRecord[]>(mockFees);

  const generateToken = () => crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

  const addClass = useCallback((name: string) => {
    const now = new Date().toISOString();
    const newClass: ClassItem = { id: crypto.randomUUID(), name, created_at: now };
    setClasses(prev => [...prev, newClass]);
    // Also create a default batch for the new class
    const newBatch: Batch = { id: crypto.randomUUID(), class_id: newClass.id, name: 'Morning', teacher_id: null, active: true, created_at: now };
    setBatches(prev => [...prev, newBatch]);
  }, []);
  const addBatch = useCallback(() => {}, []);

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

  const getStudentsByBatch = useCallback((batchId: string) => students.filter(s => s.batch_id === batchId && s.active), [students]);
  const getStudentsByClass = useCallback((classId: string) => students.filter(s => s.class_id === classId && s.active), [students]);

  const getAttendanceByStudent = useCallback((studentId: string) => {
    return attendance.filter(a => a.student_id === studentId).sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));
  }, [attendance]);

  const getStudentByToken = useCallback((token: string) => students.find(s => s.parent_access_token === token), [students]);

  const getClassByToken = useCallback((token: string) => {
    return Object.entries(classTokens).find(([, t]) => t === token)?.[0];
  }, []);

  const importStudentsCSV = useCallback((data: Array<Record<string, string>>) => {
    const now = new Date().toISOString();
    const newStudents: Student[] = data.map(row => {
      const classItem = classes.find(c => c.name === row.class_name);
      const batch = batches.find(b => b.class_id === classItem?.id);
      return {
        id: crypto.randomUUID(), full_name: row.full_name || '', roll_number: row.roll_number || '',
        class_id: classItem?.id || '', batch_id: batch?.id || '', parent_name: row.parent_name || '',
        parent_whatsapp: row.parent_whatsapp || '', secondary_parent_whatsapp: row.secondary_parent_whatsapp || null,
        active: true, parent_access_token: generateToken(), created_at: now, updated_at: now,
      };
    }).filter(s => s.full_name && s.class_id && s.batch_id);
    setStudents(prev => [...prev, ...newStudents]);
  }, [classes, batches]);

  const regenerateParentToken = useCallback((studentId: string) => {
    const newToken = generateToken();
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, parent_access_token: newToken, updated_at: new Date().toISOString() } : s));
    return newToken;
  }, []);

  const getFeesByStudent = useCallback((studentId: string) => fees.filter(f => f.student_id === studentId), [fees]);

  const addFee = useCallback((fee: Omit<FeeRecord, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    setFees(prev => [...prev, { ...fee, id: crypto.randomUUID(), created_at: now, updated_at: now }]);
  }, []);

  const updateFee = useCallback((id: string, updates: Partial<FeeRecord>) => {
    setFees(prev => prev.map(f => f.id === id ? { ...f, ...updates, updated_at: new Date().toISOString() } : f));
  }, []);

  return (
    <DataContext.Provider value={{ classes, batches, students, attendance, fees, classTokens, addClass, addBatch, addStudent, updateStudent, saveAttendance, getStudentsByBatch, getStudentsByClass, getAttendanceByStudent, getStudentByToken, getClassByToken, importStudentsCSV, regenerateParentToken, getFeesByStudent, addFee, updateFee }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
