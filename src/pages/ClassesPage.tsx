import React, { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const ClassesPage: React.FC = () => {
  const { classes, students, addClass } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [className, setClassName] = useState('');

  const handleAdd = () => {
    if (!className.trim()) {
      toast.error('Enter class name');
      return;
    }
    addClass(className.trim());
    setClassName('');
    setDialogOpen(false);
    toast.success('Class added');
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Classes</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Class</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Add New Class</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Class Name *</Label>
                <Input value={className} onChange={e => setClassName(e.target.value)} placeholder="e.g. Class 11" />
              </div>
              <Button onClick={handleAdd} className="w-full">Add Class</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {classes.map(cls => {
          const clsStudents = students.filter(s => s.class_id === cls.id && s.active).length;
          return (
            <div key={cls.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{cls.name}</h3>
                <span className="text-xs text-muted-foreground">{clsStudents} students</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Morning Batch</p>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default ClassesPage;
