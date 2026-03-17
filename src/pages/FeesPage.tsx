import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useData } from '@/contexts/DataContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { IndianRupee, Plus } from 'lucide-react';

const FeesPage: React.FC = () => {
  const { classes, students, fees, getFeesByStudent, addFee, updateFee } = useData();
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [form, setForm] = useState({ total_amount: '', paid_amount: '', due_date: '', notes: '' });

  const filtered = useMemo(() => {
    return students.filter(s => {
      if (!s.active) return false;
      if (filterClass !== 'all' && s.class_id !== filterClass) return false;
      if (filterStatus !== 'all') {
        const studentFees = getFeesByStudent(s.id);
        const latest = studentFees.sort((a, b) => b.due_date.localeCompare(a.due_date))[0];
        if (filterStatus === 'paid' && (!latest || latest.status !== 'paid')) return false;
        if (filterStatus === 'unpaid' && (!latest || latest.status !== 'unpaid')) return false;
      }
      return true;
    });
  }, [students, filterClass, filterStatus, getFeesByStudent]);

  const handleAddFee = () => {
    if (!selectedStudentId || !form.total_amount || !form.due_date) {
      toast.error('Fill required fields');
      return;
    }
    const total = parseFloat(form.total_amount);
    const paid = parseFloat(form.paid_amount) || 0;
    addFee({
      student_id: selectedStudentId,
      total_amount: total,
      paid_amount: paid,
      due_date: form.due_date,
      status: paid >= total ? 'paid' : 'unpaid',
      payment_date: paid >= total ? new Date().toISOString().split('T')[0] : null,
      notes: form.notes,
    });
    setForm({ total_amount: '', paid_amount: '', due_date: '', notes: '' });
    setSelectedStudentId('');
    setDialogOpen(false);
    toast.success('Fee record added');
  };

  const markAsPaid = (feeId: string, totalAmount: number) => {
    updateFee(feeId, { paid_amount: totalAmount, status: 'paid', payment_date: new Date().toISOString().split('T')[0] });
    toast.success('Marked as paid');
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Fees</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Fee</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Fee Record</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Student *</Label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {students.filter(s => s.active).map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name} (Roll #{s.roll_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Total Amount (₹) *</Label>
                <Input type="number" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} placeholder="5000" />
              </div>
              <div>
                <Label>Paid Amount (₹)</Label>
                <Input type="number" value={form.paid_amount} onChange={e => setForm(f => ({ ...f, paid_amount: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <Label>Due Date *</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="March fee" />
              </div>
              <Button onClick={handleAddFee} className="w-full">Add Fee Record</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">To Be Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map(student => {
          const studentFees = getFeesByStudent(student.id);
          const latest = studentFees.sort((a, b) => b.due_date.localeCompare(a.due_date))[0];
          const cls = classes.find(c => c.id === student.class_id);

          return (
            <div key={student.id} className={`rounded-xl border p-4 ${latest?.status === 'unpaid' ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card'}`}>
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{student.full_name}</p>
                  <p className="text-xs text-muted-foreground">Roll #{student.roll_number} · {cls?.name}</p>
                  {latest ? (
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`flex items-center gap-1 text-xs font-medium ${latest.status === 'paid' ? 'text-success' : 'text-destructive'}`}>
                        <IndianRupee className="h-3 w-3" />
                        {latest.status === 'paid'
                          ? `₹${latest.total_amount} Paid`
                          : `₹${latest.total_amount - latest.paid_amount} Due (of ₹${latest.total_amount})`}
                      </span>
                      {latest.due_date && (
                        <span className="text-[10px] text-muted-foreground">
                          Due: {new Date(latest.due_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">No fee records</p>
                  )}
                </div>
                {latest?.status === 'unpaid' && (
                  <Button size="sm" variant="outline" onClick={() => markAsPaid(latest.id, latest.total_amount)}>
                    Mark Paid
                  </Button>
                )}
              </div>
              {studentFees.length > 1 && (
                <div className="mt-2 pt-2 border-t border-border space-y-1">
                  {studentFees.slice(1, 4).map(f => (
                    <div key={f.id} className="flex justify-between text-[11px] text-muted-foreground">
                      <span>{f.notes || 'Fee'}</span>
                      <span className={f.status === 'paid' ? 'text-success' : 'text-destructive'}>
                        {f.status === 'paid' ? `₹${f.total_amount} Paid` : `₹${f.total_amount - f.paid_amount} Due`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No students found</p>
        )}
      </div>
    </AppLayout>
  );
};

export default FeesPage;
