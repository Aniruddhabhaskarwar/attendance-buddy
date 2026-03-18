import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ClassItem, Batch, Student, AttendanceRecord, AttendanceStatus, FeeRecord } from '@/lib/types';
import {
  fetchClasses,
  fetchBatches,
  fetchStudents,
  fetchAttendance,
  fetchFees,
  insertClass,
  updateClassRow,
  deleteClassRow,
  insertBatch,
  insertStudent,
  updateStudentRow,
  deleteStudentRow,
  upsertAttendance,
  insertFee,
  updateFeeRow,
  getStudentByToken as fetchStudentByToken,
} from '@/lib/dataApi';
import { useAuth } from '@/contexts/AuthContext';

interface DataContextType {
  classes: ClassItem[];
  batches: Batch[];
  students: Student[];
  attendance: AttendanceRecord[];
  fees: FeeRecord[];
  classTokens: Record<string, string>;
  addClass: (name: string) => Promise<void>;
  updateClass: (id: string, name: string) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  addBatch: (classId: string, name: string) => Promise<void>;
  addStudent: (student: Omit<Student, 'id' | 'parent_access_token' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  saveAttendance: (records: { studentId: string; status: AttendanceStatus; date: string }[]) => Promise<void>;
  getStudentsByBatch: (batchId: string) => Student[];
  getStudentsByClass: (classId: string) => Student[];
  getAttendanceByStudent: (studentId: string) => AttendanceRecord[];
  getStudentByToken: (token: string) => Promise<Student | undefined>;
  getClassByToken: (token: string) => string | undefined;
  importStudentsCSV: (data: Array<Record<string, string>>) => Promise<void>;
  regenerateParentToken: (studentId: string) => Promise<string>;
  getFeesByStudent: (studentId: string) => FeeRecord[];
  addFee: (fee: Omit<FeeRecord, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateFee: (id: string, updates: Partial<FeeRecord>) => Promise<void>;
  reloadAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [classTokens, setClassTokens] = useState<Record<string, string>>({});

  const generateToken = () =>
    crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

  const reloadAll = useCallback(async () => {
    const [classesRes, batchesRes, studentsRes, attendanceRes, feesRes] = await Promise.all([
      fetchClasses(),
      fetchBatches(),
      fetchStudents(),
      fetchAttendance(),
      fetchFees(),
    ]);

    setClasses((classesRes.data || []) as ClassItem[]);
    setBatches((batchesRes.data || []) as Batch[]);
    setStudents((studentsRes.data || []) as Student[]);
    setAttendance((attendanceRes.data || []) as AttendanceRecord[]);
    setFees((feesRes.data || []) as FeeRecord[]);

    if (classesRes.error) console.error('fetchClasses error:', classesRes.error);
    if (batchesRes.error) console.error('fetchBatches error:', batchesRes.error);
    if (studentsRes.error) console.error('fetchStudents error:', studentsRes.error);
    if (attendanceRes.error) console.error('fetchAttendance error:', attendanceRes.error);
    if (feesRes.error) console.error('fetchFees error:', feesRes.error);
  }, []);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  useEffect(() => {
    if (classes.length > 0) {
      const tokenMap: Record<string, string> = {};
      classes.forEach((cls) => {
        tokenMap[cls.id] = `class-${cls.id}`;
      });
      setClassTokens(tokenMap);
    } else {
      setClassTokens({});
    }
  }, [classes]);

  const addClass = useCallback(async (name: string) => {
    const { data, error } = await insertClass(name);
    if (error) {
      console.error('addClass error:', error);
      return;
    }

    if (data) {
      const { error: batchError } = await insertBatch({
        class_id: data.id,
        name: 'Morning',
        teacher_id: null,
        active: true,
      });

      if (batchError) {
        console.error('default batch creation error:', batchError);
      }
    }

    await reloadAll();
  }, [reloadAll]);

  const updateClass = useCallback(async (id: string, name: string) => {
    const { error } = await updateClassRow(id, name);
    if (error) {
      console.error('updateClass error:', error);
      return;
    }
    await reloadAll();
  }, [reloadAll]);

  const deleteClass = useCallback(async (id: string) => {
    const { error } = await deleteClassRow(id);
    if (error) {
      console.error('deleteClass error:', error);
      return;
    }
    await reloadAll();
  }, [reloadAll]);

  const addBatch = useCallback(async (classId: string, name: string) => {
    const { error } = await insertBatch({
      class_id: classId,
      name,
      teacher_id: null,
      active: true,
    });

    if (error) {
      console.error('addBatch error:', error);
      return;
    }

    await reloadAll();
  }, [reloadAll]);

  const addStudent = useCallback(async (student: Omit<Student, 'id' | 'parent_access_token' | 'created_at' | 'updated_at'>) => {
    const payload = {
      ...student,
      parent_access_token: generateToken(),
    };

    const { error } = await insertStudent(payload);
    if (error) {
      console.error('addStudent error:', error);
      return;
    }

    await reloadAll();
  }, [reloadAll]);

  const updateStudent = useCallback(async (id: string, updates: Partial<Student>) => {
    const { error } = await updateStudentRow(id, updates);
    if (error) {
      console.error('updateStudent error:', error);
      return;
    }

    await reloadAll();
  }, [reloadAll]);

  const deleteStudent = useCallback(async (id: string) => {
    const { error } = await deleteStudentRow(id);
    if (error) {
      console.error('deleteStudent error:', error);
      return;
    }

    await reloadAll();
  }, [reloadAll]);

  const saveAttendance = useCallback(async (records: { studentId: string; status: AttendanceStatus; date: string }[]) => {
    if (!user?.id) {
      console.error('saveAttendance error: no logged in user');
      return;
    }

    const { error } = await upsertAttendance(
      records.map((r) => ({
        studentId: r.studentId,
        status: r.status,
        date: r.date,
        markedBy: user.id,
      }))
    );

    if (error) {
      console.error('saveAttendance error:', error);
      return;
    }

    await reloadAll();
  }, [reloadAll, user]);

  const getStudentsByBatch = useCallback(
    (batchId: string) => students.filter((s) => s.batch_id === batchId && s.active),
    [students]
  );

  const getStudentsByClass = useCallback(
    (classId: string) => students.filter((s) => s.class_id === classId && s.active),
    [students]
  );

  const getAttendanceByStudent = useCallback(
    (studentId: string) =>
      attendance
        .filter((a) => a.student_id === studentId)
        .sort((a, b) => b.attendance_date.localeCompare(a.attendance_date)),
    [attendance]
  );

  const getStudentByToken = useCallback(async (token: string) => {
    const { data, error } = await fetchStudentByToken(token);
    if (error) {
      console.error('getStudentByToken error:', error);
      return undefined;
    }
    return data as Student | undefined;
  }, []);

  const getClassByToken = useCallback((token: string) => {
    return Object.entries(classTokens).find(([, t]) => t === token)?.[0];
  }, [classTokens]);

  const importStudentsCSV = useCallback(async (data: Array<Record<string, string>>) => {
    for (const row of data) {
      const classItem = classes.find((c) => c.name === row.class_name);
      const batch = batches.find((b) => b.class_id === classItem?.id);

      if (!row.full_name || !classItem?.id || !batch?.id) continue;

      const payload = {
        full_name: row.full_name || '',
        roll_number: row.roll_number || '',
        class_id: classItem.id,
        batch_id: batch.id,
        parent_name: row.parent_name || '',
        parent_whatsapp: row.parent_whatsapp || '',
        secondary_parent_whatsapp: row.secondary_parent_whatsapp || null,
        active: true,
        parent_access_token: generateToken(),
      };

      const { error } = await insertStudent(payload);
      if (error) {
        console.error('importStudentsCSV row error:', error, row);
      }
    }

    await reloadAll();
  }, [classes, batches, reloadAll]);

  const regenerateParentToken = useCallback(async (studentId: string) => {
    const newToken = generateToken();

    const { error } = await updateStudentRow(studentId, {
      parent_access_token: newToken,
    });

    if (error) {
      console.error('regenerateParentToken error:', error);
      return '';
    }

    await reloadAll();
    return newToken;
  }, [reloadAll]);

  const getFeesByStudent = useCallback(
    (studentId: string) => fees.filter((f) => f.student_id === studentId),
    [fees]
  );

  const addFee = useCallback(async (fee: Omit<FeeRecord, 'id' | 'created_at' | 'updated_at'>) => {
    const { error } = await insertFee(fee);
    if (error) {
      console.error('addFee error:', error);
      return;
    }

    await reloadAll();
  }, [reloadAll]);

  const updateFee = useCallback(async (id: string, updates: Partial<FeeRecord>) => {
    const { error } = await updateFeeRow(id, updates);
    if (error) {
      console.error('updateFee error:', error);
      return;
    }

    await reloadAll();
  }, [reloadAll]);

  return (
    <DataContext.Provider
      value={{
        classes,
        batches,
        students,
        attendance,
        fees,
        classTokens,
        addClass,
        updateClass,
        deleteClass,
        addBatch,
        addStudent,
        updateStudent,
        deleteStudent,
        saveAttendance,
        getStudentsByBatch,
        getStudentsByClass,
        getAttendanceByStudent,
        getStudentByToken,
        getClassByToken,
        importStudentsCSV,
        regenerateParentToken,
        getFeesByStudent,
        addFee,
        updateFee,
        reloadAll,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};