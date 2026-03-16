import React, { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

const ClassesPage: React.FC = () => {
  const { classes, batches, addClass, addBatch, students } = useData();
  const [newClassName, setNewClassName] = useState('');
  const [newBatchName, setNewBatchName] = useState('');
  const [batchClassId, setBatchClassId] = useState('');

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    addClass(newClassName.trim());
    setNewClassName('');
    toast.success('Class added');
  };

  const handleAddBatch = () => {
    if (!newBatchName.trim() || !batchClassId) return;
    addBatch(batchClassId, newBatchName.trim());
    setNewBatchName('');
    toast.success('Batch added');
  };

  return (
    <AppLayout>
      <h1 className="text-xl font-bold mb-4">Classes & Batches</h1>

      {/* Add class */}
      <div className="rounded-xl border border-border bg-card p-4 mb-4">
        <h2 className="font-semibold text-sm mb-3">Add Class</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Class name (e.g., Class 10)"
            value={newClassName}
            onChange={e => setNewClassName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddClass()}
            className="h-10"
          />
          <Button onClick={handleAddClass} size="sm" className="h-10 px-4">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add batch */}
      <div className="rounded-xl border border-border bg-card p-4 mb-6">
        <h2 className="font-semibold text-sm mb-3">Add Batch</h2>
        <div className="flex gap-2">
          <Select value={batchClassId} onValueChange={setBatchClassId}>
            <SelectTrigger className="h-10 w-40"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Input
            placeholder="Batch name"
            value={newBatchName}
            onChange={e => setNewBatchName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddBatch()}
            className="h-10 flex-1"
          />
          <Button onClick={handleAddBatch} size="sm" className="h-10 px-4">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Class list */}
      <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">All Classes</h2>
      <div className="space-y-3">
        {classes.map(cls => {
          const clsBatches = batches.filter(b => b.class_id === cls.id);
          const clsStudents = students.filter(s => s.class_id === cls.id && s.active).length;
          return (
            <div key={cls.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{cls.name}</h3>
                <span className="text-xs text-muted-foreground">{clsStudents} students</span>
              </div>
              {clsBatches.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {clsBatches.map(b => {
                    const batchStudents = students.filter(s => s.batch_id === b.id && s.active).length;
                    return (
                      <span key={b.id} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium">
                        {b.name}
                        <span className="text-muted-foreground">({batchStudents})</span>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No batches yet</p>
              )}
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default ClassesPage;
