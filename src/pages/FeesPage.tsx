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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { IndianRupee } from 'lucide-react';

const FeesPage: React.FC = () => {
  const {
    students,
    fees,
    addFee,
    updateFee,
    deleteFee,
    getFeesByStudent,
  } = useData();

  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    total_amount: '',
    paid_amount: '',
    due_date: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({
      total_amount: '',
      paid_amount: '',
      due_date: '',
      notes: '',
    });
  };

  const handleAddFee = async () => {
    if (!selectedStudent) return;

    if (!form.total_amount || !form.due_date) {
      toast.error('Amount and due date required');
      return;
    }

    try {
      await addFee({
        student_id: selectedStudent.id,
        total_amount: parseFloat(form.total_amount),
        paid_amount: parseFloat(form.paid_amount || '0'),
        due_date: form.due_date,
        status:
          parseFloat(form.paid_amount || '0') >= parseFloat(form.total_amount)
            ? 'paid'
            : 'unpaid',
        payment_date: null,
        notes: form.notes,
      });

      toast.success('Fee added');
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add fee');
    }
  };

  const handleMarkPaid = async (fee: any) => {
    try {
      await updateFee(fee.id, {
        paid_amount: fee.total_amount,
        status: 'paid',
        payment_date: new Date().toISOString().split('T')[0],
      });

      toast.success('Marked as paid');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update fee');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFee(id);
      toast.success('Fee deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete fee');
    }
  };

  return (
    <AppLayout>
      <h1 className="text-xl font-bold mb-4">Fees Management</h1>

      <div className="space-y-3">
        {students.map((student) => {
          const studentFees = getFeesByStudent(student.id);

          return (
            <div
              key={student.id}
              className="border rounded-xl p-4 bg-card"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{student.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Roll #{student.roll_number}
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedStudent(student);
                    setDialogOpen(true);
                  }}
                >
                  Add Fee
                </Button>
              </div>

              <div className="mt-3 space-y-2">
                {studentFees.map((fee) => {
                  const due = fee.total_amount - fee.paid_amount;

                  return (
                    <div
                      key={fee.id}
                      className="flex justify-between items-center border rounded-lg p-3"
                    >
                      <div>
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <IndianRupee className="h-3 w-3" />
                          {fee.total_amount}
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Due: {fee.due_date}
                        </p>

                        <p
                          className={`text-xs font-medium ${
                            fee.status === 'paid'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {fee.status === 'paid'
                            ? 'Paid'
                            : `₹${due} pending`}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {fee.status !== 'paid' && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkPaid(fee)}
                          >
                            Mark Paid
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(fee.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {studentFees.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No fees found
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Fee</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Total Amount *</Label>
              <Input
                type="number"
                value={form.total_amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, total_amount: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Paid Amount</Label>
              <Input
                type="number"
                value={form.paid_amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, paid_amount: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, due_date: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>

            <Button onClick={handleAddFee} className="w-full">
              Save Fee
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default FeesPage;