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
  PlusCircle,
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

const formatCurrency = (value: number) =>
  `₹${Number(value || 0).toLocaleString('en-IN')}`;

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

const getStatusStyles = (fee: FeeType | null) => {
  if (!fee) {
    return 'bg-muted text-muted-foreground border border-border';
  }

  if (fee.status === 'paid') {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20';
  }

  if (isOverdue(fee.due_date, fee.status)) {
    return 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20';
  }

  return 'bg-muted text-muted-foreground border border-border';
};

const getStatusLabel = (fee: FeeType | null) => {
  if (!fee) return 'Not Set';
  if (fee.status === 'paid') return 'Paid';
  if (isOverdue(fee.due_date, fee.status)) return 'Due';
  return 'Upcoming';
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
  const [selectedFee, setSelectedFee] = useState<FeeType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'setFee' | 'addPayment'>('setFee');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    total_amount: '',
    payment_amount: '',
    due_date: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({
      total_amount: '',
      payment_amount: '',
      due_date: '',
      notes: '',
    });
  };

  const openSetFeeDialog = (student: StudentType) => {
    setSelectedStudent(student);
    setSelectedFee(null);
    setDialogMode('setFee');
    resetForm();
    setDialogOpen(true);
  };

  const openAddPaymentDialog = (student: StudentType, fee: FeeType) => {
    setSelectedStudent(student);
    setSelectedFee(fee);
    setDialogMode('addPayment');
    setForm({
      total_amount: '',
      payment_amount: '',
      due_date: '',
      notes: '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedStudent) return;

    try {
      if (dialogMode === 'setFee') {
        const existingFees = getFeesByStudent(selectedStudent.id) as FeeType[];
        const existingFee = existingFees[0] || null;

        if (existingFee) {
          toast.error('Fee already exists for this student');
          return;
        }

        if (!form.total_amount || !form.due_date) {
          toast.error('Total amount and due date are required');
          return;
        }

        const totalAmount = parseFloat(form.total_amount);

        await addFee({
          student_id: selectedStudent.id,
          total_amount: totalAmount,
          paid_amount: 0,
          due_date: form.due_date,
          status: 'unpaid',
          payment_date: null,
          notes: form.notes,
        });

        toast.success('Fee set successfully');
      } else {
        if (!selectedFee) {
          toast.error('No fee found for this student');
          return;
        }

        if (!form.payment_amount) {
          toast.error('Enter payment amount');
          return;
        }

        const paymentAmount = parseFloat(form.payment_amount);

        if (paymentAmount <= 0) {
          toast.error('Payment amount must be greater than 0');
          return;
        }

        const newPaidAmount = Math.min(
          selectedFee.total_amount,
          selectedFee.paid_amount + paymentAmount
        );

        await updateFee(selectedFee.id, {
          paid_amount: newPaidAmount,
          status: newPaidAmount >= selectedFee.total_amount ? 'paid' : 'unpaid',
          payment_date: new Date().toISOString().split('T')[0],
          notes: form.notes || selectedFee.notes,
        });

        toast.success('Payment added successfully');
      }

      setDialogOpen(false);
      setSelectedStudent(null);
      setSelectedFee(null);
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save changes');
    }
  };

  const handleDelete = async (feeId: string) => {
    try {
      await deleteFee(feeId);
      toast.success('Fee deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete fee');
    }
  };

  const stats = useMemo(() => {
    const studentFeeRecords = students
      .map((student) => {
        const studentFees = getFeesByStudent(student.id) as FeeType[];
        return studentFees.length > 0 ? studentFees[0] : null;
      })
      .filter(Boolean) as FeeType[];

    const totalAssigned = studentFeeRecords.reduce(
      (sum, fee) => sum + Number(fee.total_amount || 0),
      0
    );

    const totalCollected = studentFeeRecords.reduce(
      (sum, fee) => sum + Number(fee.paid_amount || 0),
      0
    );

    const totalPending = Math.max(0, totalAssigned - totalCollected);

    const paidCount = studentFeeRecords.filter((fee) => fee.status === 'paid').length;

    const overdueCount = studentFeeRecords.filter(
      (fee) => fee.status !== 'paid' && isOverdue(fee.due_date, fee.status)
    ).length;

    return {
      totalAssigned,
      totalCollected,
      totalPending,
      paidCount,
      overdueCount,
    };
  }, [students, getFeesByStudent]);

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
                Manage one master fee per student and record installment payments cleanly.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student name or roll no"
                className="rounded-xl pl-9"
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
              <IndianRupee className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(stats.totalCollected)}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Pending Amount</p>
              <IndianRupee className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-700 dark:text-slate-200">
              {formatCurrency(stats.totalPending)}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Overdue Records</p>
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-2xl font-bold text-rose-600 dark:text-rose-400">
              {stats.overdueCount}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {filteredStudents.map((student: StudentType) => {
            const studentFees = getFeesByStudent(student.id) as FeeType[];
            const fee = studentFees.length > 0 ? studentFees[0] : null;

            const totalAmount = fee ? Number(fee.total_amount || 0) : 0;
            const paidAmount = fee ? Number(fee.paid_amount || 0) : 0;
            const dueAmount = Math.max(0, totalAmount - paidAmount);

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

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium tracking-wide ${getStatusStyles(
                          fee
                        )}`}
                      >
                        {getStatusLabel(fee)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-sm">
                      <span className="rounded-xl border border-border px-3 py-2">
                        Total: <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                      </span>
                      <span className="rounded-xl border border-border px-3 py-2">
                        Paid:{' '}
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(paidAmount)}
                        </span>
                      </span>
                      <span className="rounded-xl border border-border px-3 py-2">
                        Remaining:{' '}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {formatCurrency(dueAmount)}
                        </span>
                      </span>
                    </div>
                  </div>

                  {fee ? (
                    <Button
                      className="rounded-xl bg-slate-900 text-white transition-all duration-200 hover:bg-slate-800 shadow-sm"
                      onClick={() => openAddPaymentDialog(student, fee)}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Payment
                    </Button>
                  ) : (
                    <Button
                      className="rounded-xl bg-slate-900 text-white transition-all duration-200 hover:bg-slate-800 shadow-sm"
                      onClick={() => openSetFeeDialog(student)}
                    >
                      Set Fee
                    </Button>
                  )}
                </div>

                <div className="mt-4">
                  {fee ? (
                    <div className="rounded-2xl border border-border bg-background/60 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-xl border border-border bg-card p-3">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Wallet className="h-3.5 w-3.5" />
                                Total Fee
                              </div>
                              <p className="mt-1 text-sm font-semibold">
                                {formatCurrency(fee.total_amount)}
                              </p>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-3">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Paid Till Date
                              </div>
                              <p className="mt-1 text-sm font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(fee.paid_amount)}
                              </p>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-3">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Remaining
                              </div>
                              <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                {formatCurrency(dueAmount)}
                              </p>
                            </div>

                            <div className="rounded-xl border border-border bg-card p-3">
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
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-background/40 p-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        No fee has been set for this student yet.
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
            setSelectedFee(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {dialogMode === 'setFee' ? 'Set Fee' : 'Add Payment'}
              {selectedStudent ? (
                <span className="block pt-1 text-sm font-normal text-muted-foreground">
                  {selectedStudent.full_name} • Roll #{selectedStudent.roll_number}
                </span>
              ) : null}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {dialogMode === 'setFee' ? (
              <>
                <div>
                  <Label>Total Amount *</Label>
                  <Input
                    type="number"
                    value={form.total_amount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, total_amount: e.target.value }))
                    }
                    placeholder="Enter total fee amount"
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
              </>
            ) : (
              <>
                <div>
                  <Label>Payment Amount *</Label>
                  <Input
                    type="number"
                    value={form.payment_amount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, payment_amount: e.target.value }))
                    }
                    placeholder="Enter installment amount"
                    className="mt-1 rounded-xl"
                  />
                </div>

                {selectedFee && (
                  <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Fee</span>
                      <span className="font-medium">
                        {formatCurrency(selectedFee.total_amount)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-muted-foreground">Already Paid</span>
                      <span className="font-medium">
                        {formatCurrency(selectedFee.paid_amount)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-muted-foreground">Remaining</span>
                      <span className="font-medium">
                        {formatCurrency(
                          Math.max(
                            0,
                            Number(selectedFee.total_amount) - Number(selectedFee.paid_amount)
                          )
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

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

            <Button onClick={handleSave} className="w-full rounded-xl">
              {dialogMode === 'setFee' ? 'Save Fee' : 'Save Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default FeesPage;