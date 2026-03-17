export type UserRole = 'admin' | 'teacher';
export type AttendanceStatus = 'P' | 'A';
export type FeeStatus = 'paid' | 'unpaid';

export interface AppUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface ClassItem {
  id: string;
  name: string;
  created_at: string;
}

export interface Batch {
  id: string;
  class_id: string;
  name: string;
  teacher_id: string | null;
  active: boolean;
  created_at: string;
}

export interface Student {
  id: string;
  full_name: string;
  roll_number: string;
  class_id: string;
  batch_id: string;
  parent_name: string;
  parent_whatsapp: string;
  secondary_parent_whatsapp: string | null;
  active: boolean;
  parent_access_token: string;
  created_at: string;
  updated_at: string;
}

export interface FeeRecord {
  id: string;
  student_id: string;
  total_amount: number;
  paid_amount: number;
  due_date: string;
  status: FeeStatus;
  payment_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  marked_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface StudentAttendanceRow {
  student: Student;
  status: AttendanceStatus;
}
