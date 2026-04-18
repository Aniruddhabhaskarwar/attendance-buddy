import React, { useMemo, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Users,
  Pencil,
  Trash2,
  Phone,
  UserCircle2,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const StudentsPage: React.FC = () => {
  const { students, classes, batches, addStudent, updateStudent, deleteStudent } = useData();
  const [searchParams] = useSearchParams();

  const initialClassFromUrl = searchParams.get('class') || 'all';

  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState(initialClassFromUrl);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    roll_number: '',
    class_id: '',
    batch_id: '',
    parent_name: '',
    parent_whatsapp: '',
    secondary_parent_whatsapp: '',
  });

  const [editStudentId, setEditStudentId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    roll_number: '',
    class_id: '',
    batch_id: '',
    parent_name: '',
    parent_whatsapp: '',
    secondary_parent_whatsapp: '',
  });

  const filteredBatchesForCreate = useMemo(() => {
    if (!form.class_id) return [];
    return batches.filter((b) => b.class_id === form.class_id && b.active);
  }, [batches, form.class_id]);

  const filteredBatchesForEdit = useMemo(() => {
    if (!editForm.class_id) return [];
    return batches.filter((b) => b.class_id === editForm.class_id && b.active);
  }, [batches, editForm.class_id]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.full_name.toLowerCase().includes(search.toLowerCase()) ||
        student.roll_number.toLowerCase().includes(search.toLowerCase()) ||
        (student.parent_name || '').toLowerCase().includes(search.toLowerCase());

      const matchesClass =
        selectedClass === 'all' ? true : student.class_id === selectedClass;

      return matchesSearch && matchesClass;
    });
  }, [students, search, selectedClass]);

  const activeCount = filteredStudents.filter((s) => s.active).length;

  const resetForm = () => {
    setForm({
      full_name: '',
      roll_number: '',
      class_id: '',
      batch_id: '',
      parent_name: '',
      parent_whatsapp: '',
      secondary_parent_whatsapp: '',
    });
  };

  const handleAddStudent = async () => {
    if (!form.full_name.trim() || !form.roll_number.trim() || !form.class_id || !form.batch_id) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await addStudent({
        full_name: form.full_name.trim(),
        roll_number: form.roll_number.trim(),
        class_id: form.class_id,
        batch_id: form.batch_id,
        parent_name: form.parent_name.trim() || null,
        parent_whatsapp: form.parent_whatsapp.trim() || null,
        secondary_parent_whatsapp: form.secondary_parent_whatsapp.trim() || null,
        active: true,
      });

      toast.success('Student added successfully');
      resetForm();
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add student');
    }
  };

  const openEditDialog = (student: any) => {
    setEditStudentId(student.id);
    setEditForm({
      full_name: student.full_name || '',
      roll_number: student.roll_number || '',
      class_id: student.class_id || '',
      batch_id: student.batch_id || '',
      parent_name: student.parent_name || '',
      parent_whatsapp: student.parent_whatsapp || '',
      secondary_parent_whatsapp: student.secondary_parent_whatsapp || '',
    });
  };

  const handleEditStudent = async () => {
    if (!editStudentId) return;

    if (
      !editForm.full_name.trim() ||
      !editForm.roll_number.trim() ||
      !editForm.class_id ||
      !editForm.batch_id
    ) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await updateStudent(editStudentId, {
        full_name: editForm.full_name.trim(),
        roll_number: editForm.roll_number.trim(),
        class_id: editForm.class_id,
        batch_id: editForm.batch_id,
        parent_name: editForm.parent_name.trim() || null,
        parent_whatsapp: editForm.parent_whatsapp.trim() || null,
        secondary_parent_whatsapp: editForm.secondary_parent_whatsapp.trim() || null,
      });

      toast.success('Student updated successfully');
      setEditStudentId(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update student');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await deleteStudent(id);
      toast.success('Student deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete student');
    }
  };

  const getClassName = (classId: string) =>
    classes.find((c) => c.id === classId)?.name || 'Unknown Class';

  const getBatchName = (batchId: string) =>
    batches.find((b) => b.id === batchId)?.name || 'Unknown Batch';

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col gap-1"
        >
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground">
            Add, edit and manage student records across classes and batches.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">
              Visible Students
            </p>
            <p className="text-2xl font-bold">{filteredStudents.length}</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">
              Active Students
            </p>
            <p className="text-2xl font-bold text-primary">{activeCount}</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">
              Classes
            </p>
            <p className="text-2xl font-bold">{classes.length}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
        >
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex flex-col md:flex-row gap-3 md:items-center flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9 h-11 rounded-xl"
                  placeholder="Search by student, roll no, parent..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="w-full md:w-56">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 rounded-xl font-semibold">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Student
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-lg rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Add Student</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={form.full_name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, full_name: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Roll Number *</Label>
                    <Input
                      value={form.roll_number}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, roll_number: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Class *</Label>
                    <Select
                      value={form.class_id}
                      onValueChange={(value) =>
                        setForm((f) => ({ ...f, class_id: value, batch_id: '' }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Batch *</Label>
                    <Select
                      value={form.batch_id}
                      onValueChange={(value) =>
                        setForm((f) => ({ ...f, batch_id: value }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredBatchesForCreate.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Parent Name</Label>
                    <Input
                      value={form.parent_name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, parent_name: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Parent WhatsApp</Label>
                    <Input
                      value={form.parent_whatsapp}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, parent_whatsapp: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Secondary Parent WhatsApp</Label>
                    <Input
                      value={form.secondary_parent_whatsapp}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          secondary_parent_whatsapp: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button onClick={handleAddStudent} className="w-full rounded-xl">
                  Save Student
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="space-y-3"
        >
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: index * 0.02 }}
                className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <UserCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <p className="font-semibold text-sm truncate">{student.full_name}</p>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Roll #{student.roll_number}</span>
                      <span>{getClassName(student.class_id)}</span>
                      <span>{getBatchName(student.batch_id)}</span>
                    </div>

                    {(student.parent_name || student.parent_whatsapp) && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-2 text-muted-foreground">
                        {student.parent_name && <span>{student.parent_name}</span>}
                        {student.parent_whatsapp && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {student.parent_whatsapp}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => openEditDialog(student)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="rounded-xl">
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete student?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. The student record will be removed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="rounded-xl"
                            onClick={() => handleDeleteStudent(student.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-card p-10 text-center">
              <Users className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">No students found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try changing the filters or add your first student.
              </p>
            </div>
          )}
        </motion.div>

        <Dialog
          open={!!editStudentId}
          onOpenChange={(open) => {
            if (!open) setEditStudentId(null);
          }}
        >
          <DialogContent className="max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Label>Full Name *</Label>
                <Input
                  value={editForm.full_name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, full_name: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Roll Number *</Label>
                <Input
                  value={editForm.roll_number}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, roll_number: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Class *</Label>
                <Select
                  value={editForm.class_id}
                  onValueChange={(value) =>
                    setEditForm((f) => ({ ...f, class_id: value, batch_id: '' }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Batch *</Label>
                <Select
                  value={editForm.batch_id}
                  onValueChange={(value) =>
                    setEditForm((f) => ({ ...f, batch_id: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBatchesForEdit.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Parent Name</Label>
                <Input
                  value={editForm.parent_name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, parent_name: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Parent WhatsApp</Label>
                <Input
                  value={editForm.parent_whatsapp}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, parent_whatsapp: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Secondary Parent WhatsApp</Label>
                <Input
                  value={editForm.secondary_parent_whatsapp}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      secondary_parent_whatsapp: e.target.value,
                    }))
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <Button onClick={handleEditStudent} className="w-full rounded-xl">
              Save Changes
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default StudentsPage;