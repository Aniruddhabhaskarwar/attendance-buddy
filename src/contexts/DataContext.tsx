import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchStudents,
  fetchClasses,
  fetchBatches,
  fetchAttendance,
  fetchFees,
  fetchClassLinks,
  insertClass,
  updateClassRow,
  deleteClassRow,
  insertBatch,
  insertStudent,
  updateStudentRow,
  deleteStudentRow,
  upsertAttendance,
  getStudentByToken,
  createClassLink,
  insertFee,
  updateFeeRow,
  deleteFeeRow,
} from '@/lib/dataApi';
import {
  AttendanceStatus,
  AttendanceRecord,
  Batch,
  ClassItem,
  ClassLink,
  FeeRecord,
  Student,
} from '@/lib/types';

interface AddStudentInput {
  full_name: string;
  roll_number: string;
  class_id: string;
  batch_id: string;
  parent_name?: string | null;
  parent_whatsapp?: string | null;
  secondary_parent_whatsapp?: string | null;
  active?: boolean;
}

interface AddFeeInput {
  student_id: string;
  total_amount: number;
  paid_amount: number;
  due_date: string;
  status: 'paid' | 'unpaid';
  payment_date?: string | null;
  notes?: string | null;
}

interface SaveAttendanceInput {
  studentId: string;
  status: AttendanceStatus;
  date: string;
}

interface DataContextType {
  classes: ClassItem[];
  classLinks: ClassLink[];
  batches: Batch[];
  students: Student[];
  attendance: AttendanceRecord[];
  fees: FeeRecord[];
  deleteFee: (id: string) => Promise<void>;

  addClass: (name: string) => Promise<void>;
  updateClass: (id: string, name: string) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;

  addBatch: (classId: string, name: string) => Promise<void>;

  addStudent: (student: AddStudentInput) => Promise<void>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;

  saveAttendance: (records: SaveAttendanceInput[]) => Promise<void>;

  getStudentsByBatch: (batchId: string) => Student[];
  getStudentsByClass: (classId: string) => Student[];
  getAttendanceByStudent: (studentId: string) => AttendanceRecord[];

  getStudentByToken: (token: string) => Promise<Student | undefined>;
  getClassTokenByClassId: (classId: string) => string | undefined;
  getClassByToken: (token: string) => string | undefined;

  importStudentsCSV: (rows: Array<Record<string, string>>) => Promise<void>;
  regenerateParentToken: (studentId: string) => Promise<string>;

  getFeesByStudent: (studentId: string) => FeeRecord[];
  addFee: (fee: AddFeeInput) => Promise<void>;
  updateFee: (id: string, updates: Partial<FeeRecord>) => Promise<void>;

  reloadAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const generateToken = () =>
  Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, organization } = useAuth();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classLinks, setClassLinks] = useState<ClassLink[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);

  const reloadAll = useCallback(async () => {
    const orgId = organization?.id;
    if (!orgId) return;

    const [
      classesRes,
      batchesRes,
      studentsRes,
      attendanceRes,
      feesRes,
      classLinksRes,
    ] = await Promise.all([
      fetchClasses(orgId),
      fetchBatches(orgId),
      fetchStudents(orgId),
      fetchAttendance(orgId),
      fetchFees(orgId),
      fetchClassLinks(orgId),
    ]);

    setClasses((classesRes.data || []) as ClassItem[]);
    setBatches((batchesRes.data || []) as Batch[]);
    setStudents((studentsRes.data || []) as Student[]);
    setAttendance((attendanceRes.data || []) as AttendanceRecord[]);
    setFees((feesRes.data || []) as FeeRecord[]);
    setClassLinks((classLinksRes.data || []) as ClassLink[]);

    if (classesRes.error) console.error('fetchClasses error:', classesRes.error);
    if (batchesRes.error) console.error('fetchBatches error:', batchesRes.error);
    if (studentsRes.error) console.error('fetchStudents error:', studentsRes.error);
    if (attendanceRes.error) console.error('fetchAttendance error:', attendanceRes.error);
    if (feesRes.error) console.error('fetchFees error:', feesRes.error);
    if (classLinksRes.error) console.error('fetchClassLinks error:', classLinksRes.error);
  }, [organization?.id]);

  useEffect(() => {
    if (organization?.id) {
      void reloadAll();
    } else {
      setClasses([]);
      setClassLinks([]);
      setBatches([]);
      setStudents([]);
      setAttendance([]);
      setFees([]);
    }
  }, [organization?.id, reloadAll]);

  const addClass = useCallback(
    async (name: string) => {
      const orgId = organization?.id;
      if (!orgId) return;

      const { data, error } = await insertClass(orgId, name);
      if (error || !data) {
        console.error('addClass error:', error);
        return;
      }

      const { error: batchError } = await insertBatch({
        organization_id: orgId,
        class_id: data.id,
        name: 'Morning',
        teacher_id: null,
        active: true,
      });

      if (batchError) {
        console.error('default batch creation error:', batchError);
      }

      const { error: linkError } = await createClassLink(orgId, data.id);
      if (linkError) {
        console.error('class link creation error:', linkError);
      }

      await reloadAll();
    },
    [organization?.id, reloadAll]
  );

  const updateClass = useCallback(
    async (id: string, name: string) => {
      const orgId = organization?.id;
      if (!orgId) return;

      const { error } = await updateClassRow(orgId, id, name);
      if (error) {
        console.error('updateClass error:', error);
        return;
      }

      await reloadAll();
    },
    [organization?.id, reloadAll]
  );

  const deleteClass = useCallback(
    async (id: string) => {
      const orgId = organization?.id;
      if (!orgId) return;

      const { error } = await deleteClassRow(orgId, id);
      if (error) {
        console.error('deleteClass error:', error);
        return;
      }

      await reloadAll();
    },
    [organization?.id, reloadAll]
  );

  const addBatch = useCallback(
    async (classId: string, name: string) => {
      const orgId = organization?.id;
      if (!orgId) return;

      const { error } = await insertBatch({
        organization_id: orgId,
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
    },
    [organization?.id, reloadAll]
  );

  const addStudent = useCallback(
    async (student: AddStudentInput) => {
      const orgId = organization?.id;
      if (!orgId) return;

      const payload = {
        organization_id: orgId,
        ...student,
        parent_access_token: generateToken(),
      };

      const { error } = await insertStudent(payload);
      if (error) {
        console.error('addStudent error:', error);
        return;
      }

      await reloadAll();
    },
    [organization?.id, reloadAll]
  );

  const updateStudent = useCallback(
    async (id: string, updates: Partial<Student>) => {
      const orgId = organization?.id;
      if (!orgId) return;

      const { error } = await updateStudentRow(orgId, id, updates);
      if (error) {
        console.error('updateStudent error:', error);
        return;
      }

      await reloadAll();
    },
    [organization?.id, reloadAll]
  );

  const deleteStudent = useCallback(
    async (id: string) => {
      const orgId = organization?.id;
      if (!orgId) return;

      const { error } = await deleteStudentRow(orgId, id);
      if (error) {
        console.error('deleteStudent error:', error);
        return;
      }

      await reloadAll();
    },
    [organization?.id, reloadAll]
  );

  const saveAttendance = useCallback(
    async (records: SaveAttendanceInput[]) => {
      const orgId = organization?.id;
      if (!user?.id || !orgId) {
        console.error('saveAttendance error: no logged in user or org');
        return;
      }

      const { error } = await upsertAttendance(
        orgId,
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
    },
    [organization?.id, reloadAll, user?.id]
  );

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
    const { data, error } = await getStudentByToken(token);
    if (error) {
      console.error('getStudentByToken error:', error);
      return undefined;
    }
    return data as Student | undefined;
  }, []);

  const getClassTokenByClassId = useCallback(
    (classId: string) => classLinks.find((cl) => cl.class_id === classId)?.token,
    [classLinks]
  );

  const getClassByToken = useCallback(
    (token: string) => classLinks.find((cl) => cl.token === token)?.class_id,
    [classLinks]
  );

  const importStudentsCSV = useCallback(
    async (rows: Array<Record<string, string>>) => {
      const orgId = organization?.id;
      if (!orgId) return;

      for (const row of rows) {
        const classItem = classes.find((c) => c.name === row.class_name);
        const batch = batches.find((b) => b.class_id === classItem?.id);

        if (!row.full_name || !classItem?.id || !batch?.id) continue;

        const payload = {
          organization_id: orgId,
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
    },
    [organization?.id, classes, batches, reloadAll]
  );

  const regenerateParentToken = useCallback(
    async (studentId: string) => {
      const orgId = organization?.id;
      if (!orgId) return '';

      const newToken = generateToken();

      const { error } = await updateStudentRow(orgId, studentId, {
        parent_access_token: newToken,
      });

      if (error) {
        console.error('regenerateParentToken error:', error);
        return '';
      }

      await reloadAll();
      return newToken;
    },
    [organization?.id, reloadAll]
  );

  const getFeesByStudent = useCallback(
    (studentId: string) => fees.filter((f) => f.student_id === studentId),
    [fees]
  );

  const addFee = useCallback(
    async (fee: AddFeeInput) => {
      const orgId = organization?.id;
      if (!orgId) return;

      const { error } = await insertFee(orgId, fee);
      if (error) {
        console.error('addFee error:', error);
        return;
      }

      await reloadAll();
    },
    [organization?.id, reloadAll]
  );

  const updateFee = useCallback(
    async (id: string, updates: Partial<FeeRecord>) => {
      const orgId = organization?.id;
      if (!orgId) return;

      const { error } = await updateFeeRow(orgId, id, updates);
      if (error) {
        console.error('updateFee error:', error);
        return;
      }

      await reloadAll();
    },
    [organization?.id, reloadAll]
  );

  const deleteFee = useCallback(
  async (id: string) => {
    const orgId = organization?.id;
    if (!orgId) return;

    const { error } = await deleteFeeRow(orgId, id);

    if (error) {
      console.error('deleteFee error:', error);
      return;
    }

    await reloadAll();
  },
  [organization?.id, reloadAll]
);

  return (
    <DataContext.Provider
      value={{
        classes,
        deleteFee,
        classLinks,
        batches,
        students,
        attendance,
        fees,
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
        getClassTokenByClassId,
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