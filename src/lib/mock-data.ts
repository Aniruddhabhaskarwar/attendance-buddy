import { ClassItem, Batch, Student, AttendanceRecord, AppUser } from './types';

export const mockUser: AppUser = {
  id: 'user-1',
  full_name: 'Admin User',
  email: 'admin@bhaskarwar.com',
  role: 'admin',
  created_at: new Date().toISOString(),
};

export const mockClasses: ClassItem[] = [
  { id: 'class-8', name: 'Class 8', created_at: new Date().toISOString() },
  { id: 'class-9', name: 'Class 9', created_at: new Date().toISOString() },
  { id: 'class-10', name: 'Class 10', created_at: new Date().toISOString() },
];

export const mockBatches: Batch[] = [
  { id: 'batch-8', class_id: 'class-8', name: 'Morning', teacher_id: null, active: true, created_at: new Date().toISOString() },
  { id: 'batch-9', class_id: 'class-9', name: 'Morning', teacher_id: null, active: true, created_at: new Date().toISOString() },
  { id: 'batch-10', class_id: 'class-10', name: 'Morning', teacher_id: null, active: true, created_at: new Date().toISOString() },
];

const generateToken = () => crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

export const mockStudents: Student[] = [
  { id: 's1', full_name: 'Aarav Sharma', roll_number: '101', class_id: 'class-8', batch_id: 'batch-8', parent_name: 'Rajesh Sharma', parent_whatsapp: '9876543210', secondary_parent_whatsapp: null, active: true, parent_access_token: generateToken(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's2', full_name: 'Priya Patel', roll_number: '102', class_id: 'class-8', batch_id: 'batch-8', parent_name: 'Suresh Patel', parent_whatsapp: '9876543211', secondary_parent_whatsapp: null, active: true, parent_access_token: generateToken(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's3', full_name: 'Rohan Gupta', roll_number: '103', class_id: 'class-9', batch_id: 'batch-9', parent_name: 'Vikram Gupta', parent_whatsapp: '9876543212', secondary_parent_whatsapp: '9876543213', active: true, parent_access_token: generateToken(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's4', full_name: 'Ananya Singh', roll_number: '104', class_id: 'class-9', batch_id: 'batch-9', parent_name: 'Amit Singh', parent_whatsapp: '9876543214', secondary_parent_whatsapp: null, active: true, parent_access_token: generateToken(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's5', full_name: 'Kabir Verma', roll_number: '105', class_id: 'class-10', batch_id: 'batch-10', parent_name: 'Deepak Verma', parent_whatsapp: '9876543215', secondary_parent_whatsapp: null, active: true, parent_access_token: generateToken(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's6', full_name: 'Diya Joshi', roll_number: '201', class_id: 'class-10', batch_id: 'batch-10', parent_name: 'Ramesh Joshi', parent_whatsapp: '9876543216', secondary_parent_whatsapp: null, active: true, parent_access_token: generateToken(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

export const mockAttendance: AttendanceRecord[] = [
  { id: 'a1', student_id: 's1', attendance_date: yesterday, status: 'P', marked_by_user_id: 'user-1', created_at: yesterday, updated_at: yesterday },
  { id: 'a2', student_id: 's2', attendance_date: yesterday, status: 'P', marked_by_user_id: 'user-1', created_at: yesterday, updated_at: yesterday },
  { id: 'a3', student_id: 's3', attendance_date: yesterday, status: 'A', marked_by_user_id: 'user-1', created_at: yesterday, updated_at: yesterday },
  { id: 'a4', student_id: 's4', attendance_date: yesterday, status: 'P', marked_by_user_id: 'user-1', created_at: yesterday, updated_at: yesterday },
];
