import React, { useState } from 'react';
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
import { Plus, Users, IndianRupee, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const ClassesPage: React.FC = () => {
  const {
    classes,
    students,
    addFee,
    getStudentsByClass,
    addClass,
    updateClass,
    deleteClass,
  } = useData();

  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [className, setClassName] = useState('');
  const [batchFeeDialog, setBatchFeeDialog] = useState<string | null>(null);
  const [batchFeeForm, setBatchFeeForm] = useState({
    total_amount: '',
    due_date: '',
    notes: '',
  });
  const [editClassId, setEditClassId] = useState<string | null>(null);
  const [editClassName, setEditClassName] = useState('');

  const handleAdd = async () => {
    if (!className.trim()) {
      toast.error('Enter class name');
      return;
    }

    await addClass(className.trim());
    setClassName('');
    setDialogOpen(false);
    toast.success('Class added');
  };

  const handleEditClass = async () => {
    if (!editClassId || !editClassName.trim()) {
      toast.error('Enter class name');
      return;
    }

    await updateClass(editClassId, editClassName.trim());
    setEditClassId(null);
    setEditClassName('');
    toast.success('Class updated');
  };

  const handleDeleteClass = async (id: string) => {
    await deleteClass(id);
    toast.success('Class deleted');
  };

  const handleBatchFee = async () => {
    if (!batchFeeDialog || !batchFeeForm.total_amount || !batchFeeForm.due_date) {
      toast.error('Fill required fields');
      return;
    }

    const classStudents = getStudentsByClass(batchFeeDialog);

    if (classStudents.length === 0) {
      toast.error('No students in this class');
      return;
    }

    const total = parseFloat(batchFeeForm.total_amount);

    for (const student of classStudents) {
      await addFee({
        student_id: student.id,
        total_amount: total,
        paid_amount: 0,
        due_date: batchFeeForm.due_date,
        status: 'unpaid',
        payment_date: null,
        notes: batchFeeForm.notes,
      });
    }

    toast.success(`Fee added for ${classStudents.length} students`);
    setBatchFeeDialog(null);
    setBatchFeeForm({ total_amount: '', due_date: '', notes: '' });
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Classes</h1>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Class
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add New Class</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label>Class Name *</Label>
                <Input
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g. Class 11"
                />
              </div>

              <Button onClick={handleAdd} className="w-full">
                Add Class
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {classes.map((cls) => {
          const clsStudents = students.filter(
            (s) => s.class_id === cls.id && s.active
          ).length;

          return (
            <div
              key={cls.id}
              className="rounded-xl border border-border bg-card p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
              onClick={() => navigate(`/students?class=${cls.id}`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">{cls.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Users className="h-3 w-3" />
                    <span>{clsStudents} students</span>
                  </div>
                </div>

                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditClassId(cls.id);
                      setEditClassName(cls.name);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {cls.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will also remove all students and their data in this
                          class. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteClass(cls.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBatchFeeDialog(cls.id)}
                  >
                    <IndianRupee className="h-3 w-3 mr-1" />
                    Batch Fee
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog
        open={!!editClassId}
        onOpenChange={(open) => {
          if (!open) setEditClassId(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Class Name *</Label>
              <Input
                value={editClassName}
                onChange={(e) => setEditClassName(e.target.value)}
              />
            </div>

            <Button onClick={handleEditClass} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!batchFeeDialog}
        onOpenChange={(open) => !open && setBatchFeeDialog(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Fee for Whole Batch</DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground">
            This will create a fee record for every student in{' '}
            {classes.find((c) => c.id === batchFeeDialog)?.name}.
          </p>

          <div className="space-y-3">
            <div>
              <Label>Amount (₹) *</Label>
              <Input
                type="number"
                value={batchFeeForm.total_amount}
                onChange={(e) =>
                  setBatchFeeForm((f) => ({ ...f, total_amount: e.target.value }))
                }
                placeholder="5000"
              />
            </div>

            <div>
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={batchFeeForm.due_date}
                onChange={(e) =>
                  setBatchFeeForm((f) => ({ ...f, due_date: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                value={batchFeeForm.notes}
                onChange={(e) =>
                  setBatchFeeForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="March tuition fee"
              />
            </div>

            <Button onClick={handleBatchFee} className="w-full">
              Apply to All Students
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ClassesPage;