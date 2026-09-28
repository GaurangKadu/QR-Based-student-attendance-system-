import React from 'react';
import { User } from '../../types';
import { X, CheckCircle2, XCircle, Users } from 'lucide-react';

interface ClassStudentsListModalProps {
  className: string;
  title: string;
  type: 'total' | 'present' | 'absent';
  students: User[];
  onClose: () => void;
}

export const ClassStudentsListModal: React.FC<ClassStudentsListModalProps> = ({
  className,
  title,
  type,
  students,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              {className}
            </span>
            <h2 className="font-black text-slate-900 dark:text-white text-base mt-1">{title} ({students.length})</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
          {students.length > 0 ? (
            students.map(student => (
              <div
                key={student.userId}
                className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white text-xs">{student.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Roll: #{student.rollNo || 'N/A'} • ID: {student.userId}</p>
                  </div>
                </div>

                <div>
                  {type === 'present' && (
                    <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Present
                    </span>
                  )}
                  {type === 'absent' && (
                    <span className="px-3 py-1 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Absent
                    </span>
                  )}
                  {type === 'total' && (
                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1">
                      <Users className="w-3 h-3" /> Enrolled
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold">
              No students found in this category.
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
