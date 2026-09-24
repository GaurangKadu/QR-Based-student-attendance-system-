import React from 'react';
import { User, AttendanceRecord } from '../../types';
import { StorageService } from '../../services/storageService';
import {
  X,
  User as UserIcon,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  GraduationCap,
  TrendingUp,
  Mail,
  ShieldCheck
} from 'lucide-react';

interface StudentHistoryModalProps {
  student: User;
  onClose: () => void;
}

export const StudentHistoryModal: React.FC<StudentHistoryModalProps> = ({ student, onClose }) => {
  const attendance = StorageService.getAttendanceForStudent(student.userId);
  const studentClass = StorageService.getClassById(student.classId || '');

  const totalSessions = attendance.length;
  const presentCount = attendance.filter((a: AttendanceRecord) => a.status === 'PRESENT').length;
  const absentCount = totalSessions - presentCount;
  const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 transition-colors my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-black flex items-center justify-center text-base shrink-0">
              {student.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                {student.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Roll #{student.rollNo || 'N/A'} • {studentClass?.className || 'Class Room'} • ID: <span className="font-mono">{student.userId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 shrink-0">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/50 text-center">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Roll No</p>
            <p className="text-base font-black text-blue-700 dark:text-blue-300 mt-0.5">#{student.rollNo || '-'}</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 text-center">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Present Days</p>
            <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{presentCount}</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/50 text-center">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Absent Days</p>
            <p className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5">{absentCount}</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 text-center">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Attendance %</p>
            <p className={`text-base font-black mt-0.5 ${percentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {percentage}%
            </p>
          </div>
        </div>

        {/* History Table */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" /> Complete Attendance Log ({attendance.length})
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              QR Verified
            </span>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="p-3 pl-4">Date</th>
                  <th className="p-3">Session & Time</th>
                  <th className="p-3">Class</th>
                  <th className="p-3 pr-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {attendance.length > 0 ? (
                  attendance.map((record: AttendanceRecord) => {
                    const isPresent = record.status === 'PRESENT';
                    return (
                      <tr key={record.attendanceId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-3 pl-4 font-bold text-slate-800 dark:text-slate-200">
                          {record.date}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{record.time || '10:00 AM'}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {studentClass?.subject || 'Engineering'}
                        </td>
                        <td className="p-3 pr-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              isPresent
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {isPresent ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PRESENT
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-rose-600" /> ABSENT
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">
                      No attendance records found yet for this student.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0 mt-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 min-h-[40px] bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition cursor-pointer"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};
