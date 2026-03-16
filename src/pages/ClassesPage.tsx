import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useData } from '@/contexts/DataContext';

const ClassesPage: React.FC = () => {
  const { classes, students } = useData();

  return (
    <AppLayout>
      <h1 className="text-xl font-bold mb-4">Classes</h1>

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
