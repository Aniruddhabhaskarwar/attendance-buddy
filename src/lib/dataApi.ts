import { supabase } from '@/lib/supabase';

type AttendanceStatus = 'P' | 'A';

export type BatchInsert = {
  organization_id: string;
  class_id: string;
  name: string;
  teacher_id?: string | null;
  active?: boolean;
};

export type StudentInsert = {
  organization_id: string;
  full_name: string;
  roll_number: string;
  class_id: string;
  batch_id: string;
  parent_name?: string | null;
  parent_whatsapp?: string | null;
  secondary_parent_whatsapp?: string | null;
  active?: boolean;
  parent_access_token?: string;
};

export type AttendanceUpsertInput = {
  studentId: string;
  status: AttendanceStatus;
  date: string;
  markedBy: string;
};

export type FeeInsert = {
  student_id: string;
  total_amount: number;
  paid_amount: number;
  due_date: string;
  status: 'paid' | 'unpaid';
  payment_date?: string | null;
  notes?: string | null;
};

export type OrganizationInsert = {
  name: string;
  slug: string;
  owner_user_id: string;
};

export type OrganizationUserInsert = {
  organization_id: string;
  user_id: string;
  role: 'admin' | 'teacher';
};

// ========== Public parent view ==========
export async function getPublicClassDataByToken(token: string) {
  return await supabase.rpc('get_class_data_by_token', {
    input_token: token,
  });
}

export async function getPublicClassStudentsByToken(token: string) {
  return await supabase.rpc('get_class_students_by_token', {
    input_token: token,
  });
}

export async function getStudentAttendanceByToken(token: string, studentId: string) {
  return await supabase.rpc('get_student_attendance_by_token', {
    input_token: token,
    input_student_id: studentId,
  });
}

// ========== Organization / membership ==========
export async function fetchUserOrganization(userId: string) {
  return await supabase
    .from('organization_users')
    .select(`
      id,
      organization_id,
      user_id,
      role,
      created_at,
      organizations (
        id,
        name,
        slug,
        owner_user_id,
        created_at
      )
    `)
    .eq('user_id', userId)
    .single();
}

/**
 * Keep these only if you still need manual org/member creation somewhere.
 * Signup itself should rely on your auth trigger now.
 */
export async function createOrganization(org: OrganizationInsert) {
  return await supabase
    .from('organizations')
    .insert([org])
    .select()
    .single();
}

export async function createOrganizationUser(payload: OrganizationUserInsert) {
  return await supabase
    .from('organization_users')
    .insert([payload])
    .select()
    .single();
}

// ========== Class links ==========
export async function fetchClassLinks(orgId: string) {
  return await supabase
    .from('class_links')
    .select('*')
    .eq('organization_id', orgId);
}

export async function createClassLink(orgId: string, classId: string) {
  return await supabase
    .from('class_links')
    .insert([
      {
        organization_id: orgId,
        class_id: classId,
      },
    ])
    .select()
    .single();
}

export async function deleteClassLink(orgId: string, id: string) {
  return await supabase
    .from('class_links')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId);
}

// ========== Classes ==========
export async function fetchClasses(orgId: string) {
  return await supabase
    .from('classes')
    .select('*')
    .eq('organization_id', orgId)
    .order('name');
}

export async function insertClass(orgId: string, name: string) {
  return await supabase
    .from('classes')
    .insert([
      {
        organization_id: orgId,
        name,
      },
    ])
    .select()
    .single();
}

export async function updateClassRow(orgId: string, id: string, name: string) {
  return await supabase
    .from('classes')
    .update({ name })
    .eq('id', id)
    .eq('organization_id', orgId);
}

export async function deleteClassRow(orgId: string, id: string) {
  return await supabase
    .from('classes')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId);
}

// ========== Batches ==========
export async function fetchBatches(orgId: string) {
  return await supabase
    .from('batches')
    .select('*')
    .eq('organization_id', orgId)
    .eq('active', true)
    .order('created_at');
}

export async function insertBatch(batch: BatchInsert) {
  return await supabase
    .from('batches')
    .insert([
      {
        organization_id: batch.organization_id,
        class_id: batch.class_id,
        name: batch.name,
        teacher_id: batch.teacher_id ?? null,
        active: batch.active ?? true,
      },
    ])
    .select()
    .single();
}

export async function updateBatchRow(
  orgId: string,
  id: string,
  updates: Partial<BatchInsert>
) {
  return await supabase
    .from('batches')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', orgId);
}

export async function deleteBatchRow(orgId: string, id: string) {
  return await supabase
    .from('batches')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId);
}

// ========== Students ==========
export async function fetchStudents(orgId: string) {
  return await supabase
    .from('students')
    .select('*')
    .eq('organization_id', orgId)
    .order('full_name');
}

export async function insertStudent(student: StudentInsert) {
  return await supabase
    .from('students')
    .insert([
      {
        organization_id: student.organization_id,
        full_name: student.full_name,
        roll_number: student.roll_number,
        class_id: student.class_id,
        batch_id: student.batch_id,
        parent_name: student.parent_name ?? null,
        parent_whatsapp: student.parent_whatsapp ?? null,
        secondary_parent_whatsapp: student.secondary_parent_whatsapp ?? null,
        active: student.active ?? true,
        parent_access_token: student.parent_access_token,
      },
    ])
    .select()
    .single();
}

export async function updateStudentRow(
  orgId: string,
  id: string,
  updates: Partial<StudentInsert>
) {
  return await supabase
    .from('students')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', orgId);
}

export async function deleteStudentRow(orgId: string, id: string) {
  return await supabase
    .from('students')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId);
}

// ========== Attendance ==========
export async function fetchAttendance(orgId: string) {
  return await supabase
    .from('attendance')
    .select('*')
    .eq('organization_id', orgId)
    .order('attendance_date', { ascending: false });
}

export async function upsertAttendance(
  orgId: string,
  records: AttendanceUpsertInput[]
) {
  const payload = records.map((r) => ({
    organization_id: orgId,
    student_id: r.studentId,
    status: r.status,
    attendance_date: r.date,
    marked_by_user_id: r.markedBy,
  }));

  return await supabase
    .from('attendance')
    .upsert(payload, { onConflict: 'student_id,attendance_date' });
}

export async function getAttendanceByStudentId(orgId: string, studentId: string) {
  return await supabase
    .from('attendance')
    .select('*')
    .eq('organization_id', orgId)
    .eq('student_id', studentId)
    .order('attendance_date', { ascending: false });
}

export async function deleteAttendanceRow(orgId: string, id: string) {
  return await supabase
    .from('attendance')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId);
}

// ========== Fees ==========
export async function fetchFees(orgId: string) {
  return await supabase
    .from('fees')
    .select('*')
    .eq('organization_id', orgId)
    .order('due_date', { ascending: false });
}

export async function insertFee(orgId: string, fee: FeeInsert) {
  return await supabase
    .from('fees')
    .insert([
      {
        organization_id: orgId,
        student_id: fee.student_id,
        total_amount: fee.total_amount,
        paid_amount: fee.paid_amount,
        due_date: fee.due_date,
        status: fee.status,
        payment_date: fee.payment_date ?? null,
        notes: fee.notes ?? '',
      },
    ])
    .select()
    .single();
}

export async function updateFeeRow(
  orgId: string,
  id: string,
  updates: Partial<FeeInsert>
) {
  return await supabase
    .from('fees')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', orgId);
}

export async function deleteFeeRow(orgId: string, id: string) {
  return await supabase
    .from('fees')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId);
}

// ========== Legacy helper ==========
export async function getStudentByToken(token: string) {
  return await supabase
    .from('students')
    .select('*')
    .eq('parent_access_token', token)
    .single();
}