import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/storageService';
import { ClassItem, User } from '../../types';
import { ShieldCheck } from 'lucide-react';

export const AdminStatsCard: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);

  useEffect(() => {
    const loadData = () => {
      setClasses(StorageService.getClasses());
      setTeachers(StorageService.getTeachers());
      setStudents(StorageService.getStudents());
    };
    loadData();
    window.addEventListener('qr_attendance_updated', loadData);
    return () => window.removeEventListener('qr_attendance_updated', loadData);
  }, []);

  return (
    <div className="nm-dark-panel text-white rounded-xl p-4 shadow-xl border border-white/10 m-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg text-white">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <h3 className="text-xs font-bold tracking-tight">Admin Dashboard</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="nm-dark-inset p-2 rounded-lg border border-slate-800/60">
          <p className="text-[9px] text-slate-400">Classes</p>
          <p className="text-sm font-bold">{classes.length}</p>
        </div>
        <div className="nm-dark-inset p-2 rounded-lg border border-slate-800/60">
          <p className="text-[9px] text-slate-400">Teachers</p>
          <p className="text-sm font-bold">{teachers.length}</p>
        </div>
        <div className="nm-dark-inset p-2 rounded-lg border border-slate-800/60">
          <p className="text-[9px] text-slate-400">Students</p>
          <p className="text-sm font-bold">{students.length}</p>
        </div>
        <div className="nm-dark-inset p-2 rounded-lg border border-slate-800/60">
          <p className="text-[9px] text-slate-400">Geofences</p>
          <p className="text-sm font-bold">{classes.filter(c => c.geofenceActive).length}</p>
        </div>
      </div>
    </div>
  );
};
