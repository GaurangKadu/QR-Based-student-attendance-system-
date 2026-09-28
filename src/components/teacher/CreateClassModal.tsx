import React, { useState } from 'react';
import { StorageService } from '../../services/storageService';
import { X, BookOpen, Layers, MapPin, Users, Plus } from 'lucide-react';

interface CreateClassModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({ onClose, onSuccess }) => {
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [year, setYear] = useState('2nd Year');
  const [semester, setSemester] = useState('Semester IV');
  const [division, setDivision] = useState('A');
  const [totalStudents, setTotalStudents] = useState('60');
  const [radius, setRadius] = useState('50');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className || !subject) return;

    const classId = `CLASS_${Date.now()}`;
    StorageService.addClass({
      classId,
      className,
      classroomName: className,
      subject,
      year,
      semester,
      division,
      totalStudents: parseInt(totalStudents) || 60,
      radius: parseInt(radius) || 50,
      latitude: 18.5204,
      longitude: 73.8567,
    });

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 dark:text-white text-base tracking-tight">Create New Classroom</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add a new class and assign subject & geofence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Class Name / Title</label>
            <input
              type="text"
              required
              placeholder="e.g. SE IT - Div C"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subject Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Artificial Intelligence"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="Final Year">Final Year</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Semester I">Semester I</option>
                <option value="Semester II">Semester II</option>
                <option value="Semester III">Semester III</option>
                <option value="Semester IV">Semester IV</option>
                <option value="Semester V">Semester V</option>
                <option value="Semester VI">Semester VI</option>
                <option value="Semester VII">Semester VII</option>
                <option value="Semester VIII">Semester VIII</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Division</label>
              <input
                type="text"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Capacity</label>
              <input
                type="number"
                value={totalStudents}
                onChange={(e) => setTotalStudents(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Radius (m)</label>
              <input
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Class
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
