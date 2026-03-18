import { supabase } from '@/lib/supabase';

export async function fetchClasses() {
  return await supabase.from('classes').select('*').order('name');
}

export async function fetchBatches() {
  return await supabase.from('batches').select('*').eq('active', true).order('created_at');
}

export async function fetchStudents() {
  return await supabase.from('students').select('*').order('full_name');
}

export async function fetchAttendance() {
  return await supabase.from('attendance').select('*').order('attendance_date', { ascending: false });
}

export async function fetchFees() {
  return await supabase.from('fees').select('*').order('due_date', { ascending: false });
}

export async function insertClass(name: string) {
  return await supabase.from('classes').insert([{ name }]).select().single();
}

export async function updateClassRow(id: string, name: string) {
  return await supabase.from('classes').update({ name }).eq('id', id);
}

export async function deleteClassRow(id: string) {
  return await supabase.from('classes').delete().eq('id', id);
}

export async function insertBatch(batch: any) {
  return await supabase.from('batches').insert([batch]).select().single();
}

export async function updateBatchRow(id: string, updates: any) {
  return await supabase.from('batches').update(updates).eq('id', id);
}

export async function deleteBatchRow(id: string) {
  return await supabase.from('batches').delete().eq('id', id);
}

export async function insertStudent(student: any) {
  return await supabase.from('students').insert([student]).select().single();
}

export async function updateStudentRow(id: string, updates: any) {
  return await supabase.from('students').update(updates).eq('id', id);
}

export async function deleteStudentRow(id: string) {
  return await supabase.from('students').delete().eq('id', id);
}

export async function upsertAttendance(records: { studentId: string; status: 'P' | 'A'; date: string; markedBy: string }[]) {
  const payload = records.map((r) => ({
    student_id: r.studentId,
    status: r.status,
    attendance_date: r.date,
    marked_by_user_id: r.markedBy,
  }));

  return await supabase
    .from('attendance')
    .upsert(payload, { onConflict: 'student_id,attendance_date' });
}

export async function insertFee(fee: any) {
  return await supabase.from('fees').insert([fee]).select().single();
}

export async function updateFeeRow(id: string, updates: any) {
  return await supabase.from('fees').update(updates).eq('id', id);
}

export async function deleteFeeRow(id: string) {
  return await supabase.from('fees').delete().eq('id', id);
}

export async function getStudentByToken(token: string) {
  return await supabase
    .from('students')
    .select('*')
    .eq('parent_access_token', token)
    .single();
}

export async function getAttendanceByStudentId(studentId: string) {
  return await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', studentId)
    .order('attendance_date', { ascending: false });
}