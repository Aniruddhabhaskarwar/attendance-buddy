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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  IndianRupee,
  Search,
  Wallet,
  CircleDollarSign,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  FileText,
  Trash2,
} from 'lucide-react';

type StudentType = {
  id: string;
  full_name: string;
  roll_number: string;
  active?: boolean;
};

type FeeType = {
  id: string;
  student_id: string;
  total_amount: number;
  paid_amount: number;
  due_date: string;
  status: 'paid' | 'unpaid';
  payment_date: string | null;
  notes?: string;
};

const formatCurrency = (value: number) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const formatDate = (date: string) => {
  if (!date) return '--';
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const isOverdue = (dueDate: string, status: string) => {
  if (status === 'paid') return false;
  const today = new Date();
  const due = new Date(`${dueDate}T00:00:00`);
  today.setHours(0, 0, 0, 0);
  return due < today;
};

const getStatusStyles = (fee: FeeType) => {
  if (fee.status === 'paid') {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  }

  if (isOverdue(fee.due_date, fee.status)) {
    return 'bg-rose-50 text-rose-600 border border-rose-200';
  }

  return 'bg-muted text-muted-foreground border border-border';
};

const getStatusLabel = (fee: FeeType) => {
  if (fee.status === 'paid') return 'Paid';
  if (isOverdue(fee.due_date, fee.status)) return 'Overdue';
  return 'Pending';
};

const FeesPage: React.FC = () => {
  const {
    students,
    fees,
    addFee,
    updateFee,
    deleteFee,
    getFeesByStudent,
  } = useData();

  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');

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
      toast.error('Amount and due date are required');
      return;
    }

    try {
      const totalAmount = parseFloat(form.total_amount);
      const paidAmount = parseFloat(form.paid_amount || '0');

      await addFee({
        student_id: selectedStudent.id,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        due_date: form.due_date,
        status: paidAmount >= totalAmount ? 'paid' : 'unpaid',
        payment_date: paidAmount >= totalAmount ? new Date().toISOString().split('T')[0] : null,
        notes: form.notes,
      });

      toast.success('Fee added successfully');
      setDialogOpen(false);
      resetForm();
      setSelectedStudent(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add fee');
    }
  };

  const handleMarkPaid = async (fee: FeeType) => {
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

  const stats = useMemo(() => {
    const totalAssigned = fees.reduce((sum: number, fee: FeeType) => sum + Number(fee.total_amount || 0), 0);
    const totalCollected = fees.reduce((sum: number, fee: FeeType) => sum + Number(fee.paid_amount || 0), 0);
    const totalPending = Math.max(0, totalAssigned - totalCollected);
    const paidCount = fees.filter((fee: FeeType) => fee.status === 'paid').length;
    const overdueCount = fees.filter(
      (fee: FeeType) => fee.status !== 'paid' && isOverdue(fee.due_date, fee.status)
    ).length;

    return {
      totalAssigned,
      totalCollected,
      totalPending,
      paidCount,
      overdueCount,
    };
  }, [fees]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students
      .filter((student: StudentType) => {
        if (!query) return true;
        return (
          student.full_name?.toLowerCase().includes(query) ||
          student.roll_number?.toLowerCase().includes(query)
        );
      })
      .sort((a: StudentType, b: StudentType) =>
        (a.roll_number || '').localeCompare(b.roll_number || '', undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      );
  }, [students, search]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Finance Dashboard</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">Fees Management</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Track assigned fees, pending collections, and student-wise payment status in one place.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student name or roll no"
                className="pl-9 rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Assigned</p>
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-2xl font-bold">{formatCurrency(stats.totalAssigned)}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Collected</p>
              <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalCollected)}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Pending Amount</p>
              <IndianRupee className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-700">
              {formatCurrency(stats.totalPending)}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Overdue Records</p>
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-2xl font-bold text-rose-600">{stats.overdueCount}</p>
          </div>
        </div>

        <div className="space-y-4">
          {filteredStudents.map((student: StudentType) => {
            const studentFees = getFeesByStudent(student.id) as FeeType[];

            const studentAssigned = studentFees.reduce(
              (sum, fee) => sum + Number(fee.total_amount || 0),
              0
            );

            const studentPaid = studentFees.reduce(
              (sum, fee) => sum + Number(fee.paid_amount || 0),
              0
            );

            const studentPending = Math.max(0, studentAssigned - studentPaid);
            const studentOverdue = studentFees.filter(
              (fee) => fee.status !== 'paid' && isOverdue(fee.due_date, fee.status)
            ).length;

            return (
              <div
                key={student.id}
                className="rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold">{student.full_name}</h2>
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                        Roll #{student.roll_number}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-sm">
                      <span className="rounded-xl border border-border px-3 py-2">
                        Assigned: <span className="font-semibold">{formatCurrency(studentAssigned)}</span>
                      </span>
                      <span className="rounded-xl border border-border px-3 py-2">
                        Paid: <span className="font-semibold text-green-600">{formatCurrency(studentPaid)}</span>
                      </span>
                      <span className="rounded-xl border border-border px-3 py-2">
                        Pending: <span className="font-semibold text-slate-700">{formatCurrency(studentPending)}</span>
                      </span>
                      <span className="rounded-xl border border-border px-3 py-2">
                        Overdue: <span className="font-semibold text-rose-700">{studentOverdue}</span>
                      </span>
                    </div>
                  </div>

                  <Button
                    className="rounded-xl px-4 py-2 
                    bg-[#C6A85A] text-black 
                    hover:bg-[#B8963F] 
                    transition-all duration-200 shadow-sm"
                    onClick={() => {
                      setSelectedStudent(student);
                      setDialogOpen(true);
                    }}
                  >
                    Add Fee
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {studentFees.length > 0 ? (
                    studentFees.map((fee) => {
                      const due = Math.max(0, Number(fee.total_amount || 0) - Number(fee.paid_amount || 0));

                      return (
                        <div
                          key={fee.id}
                          className="rounded-2xl border border-border bg-background/60 p-4"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 text-base font-semibold">
                                  <IndianRupee className="h-4 w-4" />
                                  <span>{Number(fee.total_amount || 0).toLocaleString('en-IN')}</span>
                                </div>

                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyles(
                                    fee
                                  )}`}
                                >
                                  {getStatusLabel(fee)}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-xl bg-card p-3 border border-border">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Wallet className="h-3.5 w-3.5" />
                                    Total Amount
                                  </div>
                                  <p className="mt-1 text-sm font-semibold">
                                    {formatCurrency(fee.total_amount)}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-card p-3 border border-border">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Paid Amount
                                  </div>
                                  <p className="mt-1 text-sm font-semibold text-green-600">
                                    {formatCurrency(fee.paid_amount)}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-card p-3 border border-border">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Pending
                                  </div>
                                  <p className="mt-1 text-sm font-semibold text-slate-700">
                                    {formatCurrency(due)}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-card p-3 border border-border">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    Due Date
                                  </div>
                                  <p className="mt-1 text-sm font-semibold">
                                    {formatDate(fee.due_date)}
                                  </p>
                                </div>
                              </div>

                              {fee.notes ? (
                                <div className="rounded-xl border border-dashed border-border bg-card p-3">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <FileText className="h-3.5 w-3.5" />
                                    Notes
                                  </div>
                                  <p className="mt-1 text-sm">{fee.notes}</p>
                                </div>
                              ) : null}
                            </div>

                            <div className="flex flex-wrap gap-2 lg:justify-end">
                              {fee.status !== 'paid' && (
                                <Button
                                  size="sm"
                                  className="rounded-xl"
                                  onClick={() => handleMarkPaid(fee)}
                                >
                                  Mark Paid
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="destructive"
                                className="rounded-xl"
                                onClick={() => handleDelete(fee.id)}
                              >
                                <Trash2 className="mr-1 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-background/40 p-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        No fee records found for this student.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredStudents.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-sm">
              <p className="text-base font-medium">No students found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try searching with a different student name or roll number.
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedStudent(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Add Fee
              {selectedStudent ? (
                <span className="block pt-1 text-sm font-normal text-muted-foreground">
                  {selectedStudent.full_name} • Roll #{selectedStudent.roll_number}
                </span>
              ) : null}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Total Amount *</Label>
              <Input
                type="number"
                value={form.total_amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, total_amount: e.target.value }))
                }
                placeholder="Enter total amount"
                className="mt-1 rounded-xl"
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
                placeholder="Enter amount already paid"
                className="mt-1 rounded-xl"
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
                className="mt-1 rounded-xl"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Optional notes"
                className="mt-1 rounded-xl"
              />
            </div>

            <Button onClick={handleAddFee} className="w-full rounded-xl">
              Save Fee
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default FeesPage;