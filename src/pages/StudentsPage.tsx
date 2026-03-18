import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Upload, Link as LinkIcon, Mic, MicOff, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const StudentsPage: React.FC = () => {
  const { students, classes, batches, addStudent, updateStudent, deleteStudent, importStudentsCSV, classTokens } = useData();
  const [searchParams] = useSearchParams();
  const [filterClass, setFilterClass] = useState(searchParams.get('class') || 'all');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [form, setForm] = useState({
    full_name: '', roll_number: '', class_id: '',
    parent_name: '', parent_whatsapp: '', secondary_parent_whatsapp: '',
  });

  useEffect(() => {
    if (editStudent) {
      const s = students.find(st => st.id === editStudent);
      if (s) {
        setForm({
          full_name: s.full_name, roll_number: s.roll_number, class_id: s.class_id,
          parent_name: s.parent_name, parent_whatsapp: s.parent_whatsapp,
          secondary_parent_whatsapp: s.secondary_parent_whatsapp || '',
        });
      }
    }
  }, [editStudent, students]);

  useEffect(() => {
    const cls = searchParams.get('class');
    if (cls) setFilterClass(cls);
  }, [searchParams]);

  const filtered = useMemo(() => {
    return students.filter(s => {
      if (filterClass !== 'all' && s.class_id !== filterClass) return false;
      if (search && !s.full_name.toLowerCase().includes(search.toLowerCase()) && !s.roll_number.includes(search)) return false;
      return true;
    });
  }, [students, filterClass, search]);

  const getBatchId = (classId: string) => batches.find(b => b.class_id === classId)?.id || '';

  const handleAdd = () => {
    if (!form.full_name || !form.roll_number || !form.class_id) { toast.error('Please fill required fields'); return; }
    addStudent({ ...form, batch_id: getBatchId(form.class_id), active: true, secondary_parent_whatsapp: form.secondary_parent_whatsapp || null });
    setForm({ full_name: '', roll_number: '', class_id: '', parent_name: '', parent_whatsapp: '', secondary_parent_whatsapp: '' });
    setDialogOpen(false);
    toast.success('Student added');
  };

  const handleEdit = () => {
    if (!editStudent || !form.full_name || !form.roll_number || !form.class_id) { toast.error('Please fill required fields'); return; }
    updateStudent(editStudent, {
      full_name: form.full_name, roll_number: form.roll_number, class_id: form.class_id,
      batch_id: getBatchId(form.class_id), parent_name: form.parent_name,
      parent_whatsapp: form.parent_whatsapp, secondary_parent_whatsapp: form.secondary_parent_whatsapp || null,
    });
    setEditStudent(null);
    setForm({ full_name: '', roll_number: '', class_id: '', parent_name: '', parent_whatsapp: '', secondary_parent_whatsapp: '' });
    toast.success('Student updated');
  };

  const handleDelete = (id: string) => {
    deleteStudent(id);
    toast.success('Student deleted');
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { toast.error('CSV is empty'); return; }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = values[i] || ''; });
        return row;
      });
      importStudentsCSV(data);
      toast.success(`Imported ${data.length} students`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const copyClassLink = (classId: string) => {
    const token = classTokens[classId];
    if (!token) { toast.error('No link for this class'); return; }
    const url = `${window.location.origin}/parent/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Class attendance link copied!');
  };

  const toggleVoiceInput = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error('Voice input not supported'); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setForm(f => ({ ...f, full_name: f.full_name ? f.full_name + ' ' + transcript : transcript }));
      toast.success(`Heard: "${transcript}"`);
    };
    recognition.onerror = () => { setIsListening(false); toast.error('Voice input failed'); };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Students</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" /> CSV
          </Button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Add Student</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Full Name *</Label>
                  <div className="flex gap-2">
                    <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Type or use mic" className="flex-1" />
                    <Button type="button" variant={isListening ? 'destructive' : 'outline'} size="icon" onClick={toggleVoiceInput}>
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div><Label>Roll Number *</Label><Input value={form.roll_number} onChange={e => setForm(f => ({ ...f, roll_number: e.target.value }))} /></div>
                <div>
                  <Label>Class *</Label>
                  <Select value={form.class_id} onValueChange={v => setForm(f => ({ ...f, class_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Parent Name</Label><Input value={form.parent_name} onChange={e => setForm(f => ({ ...f, parent_name: e.target.value }))} /></div>
                <div><Label>Parent WhatsApp</Label><Input value={form.parent_whatsapp} onChange={e => setForm(f => ({ ...f, parent_whatsapp: e.target.value }))} /></div>
                <div><Label>Secondary WhatsApp</Label><Input value={form.secondary_parent_whatsapp} onChange={e => setForm(f => ({ ...f, secondary_parent_whatsapp: e.target.value }))} /></div>
                <Button onClick={handleAdd} className="w-full">Add Student</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <Input placeholder="Search name or roll..." value={search} onChange={e => setSearch(e.target.value)} className="h-10" />
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {classes.map(c => (
          <Button key={c.id} variant="outline" size="sm" onClick={() => copyClassLink(c.id)}>
            <LinkIcon className="h-3 w-3 mr-1" /> {c.name} Link
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(student => {
          const cls = classes.find(c => c.id === student.class_id);
          return (
            <div key={student.id} className={`rounded-xl border border-border bg-card p-4 ${!student.active ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1 cursor-pointer hover:text-primary transition-colors" onClick={() => setEditStudent(student.id)}>
                  <p className="font-medium text-sm">{student.full_name}</p>
                  <p className="text-xs text-muted-foreground">Roll #{student.roll_number} · {cls?.name}</p>
                  {student.parent_name && <p className="text-xs text-muted-foreground mt-1">Parent: {student.parent_name}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { updateStudent(student.id, { active: !student.active }); toast.success(student.active ? 'Deactivated' : 'Activated'); }}>
                    {student.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {student.full_name}?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently remove the student and all their attendance and fee records.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(student.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No students found</p>}
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={!!editStudent} onOpenChange={open => { if (!open) { setEditStudent(null); setForm({ full_name: '', roll_number: '', class_id: '', parent_name: '', parent_whatsapp: '', secondary_parent_whatsapp: '' }); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Full Name *</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
            <div><Label>Roll Number *</Label><Input value={form.roll_number} onChange={e => setForm(f => ({ ...f, roll_number: e.target.value }))} /></div>
            <div>
              <Label>Class *</Label>
              <Select value={form.class_id} onValueChange={v => setForm(f => ({ ...f, class_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Parent Name</Label><Input value={form.parent_name} onChange={e => setForm(f => ({ ...f, parent_name: e.target.value }))} /></div>
            <div><Label>Parent WhatsApp</Label><Input value={form.parent_whatsapp} onChange={e => setForm(f => ({ ...f, parent_whatsapp: e.target.value }))} /></div>
            <div><Label>Secondary WhatsApp</Label><Input value={form.secondary_parent_whatsapp} onChange={e => setForm(f => ({ ...f, secondary_parent_whatsapp: e.target.value }))} /></div>
            <Button onClick={handleEdit} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default StudentsPage;
