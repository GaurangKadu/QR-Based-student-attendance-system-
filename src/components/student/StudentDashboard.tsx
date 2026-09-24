import React, { useState } from 'react';
import { User } from '../../types';
import { StorageService } from '../../services/storageService';
import { QRCodeGenerator } from '../QRCodeGenerator';
import {
  QrCode,
  Calendar,
  CheckCircle2,
  XCircle,
  BookOpen,
  Clock
} from 'lucide-react';

interface StudentDashboardProps {
  student: User;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ student }) => {
  const studentStats = StorageService.getStudentStats(student.userId);
  const studentClass = StorageService.getClassById(student.classId || '');

  const [activeTab, setActiveTab] = useState<'qr' | 'history'>('qr');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg border-2 border-blue-400/40 shrink-0">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider">
                  STUDENT PORTAL
                </span>
                <span className="text-xs text-slate-300 font-semibold">{studentClass?.className}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">{student.name}</h1>
              <p className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-2 font-mono">
                <span>Roll No: {student.rollNo || 'N/A'}</span>
                <span>•</span>
                <span>ID: {student.userId}</span>
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-center shrink-0">
            <p className="text-[10px] font-bold text-slate-300 uppercase">Attendance Rate</p>
            <p className={`text-2xl sm:text-3xl font-extrabold mt-0.5 ${studentStats.percentage >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {studentStats.percentage}%
            </p>
            <p className="text-[10px] text-slate-300 mt-0.5">
              {studentStats.percentage >= 75 ? '✓ Meets 75% Requirement' : '⚠ Below 75% Threshold'}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Sessions</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{studentStats.totalSessions}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Conducted lectures</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lectures Attended</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{studentStats.presentCount}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Scanned present</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lectures Missed</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">{studentStats.absentCount}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Recorded absent</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('qr')}
          className={`px-4 py-2.5 min-h-[40px] rounded-xl text-xs font-extrabold flex items-center gap-2 transition shrink-0 ${
            activeTab === 'qr'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4" /> Digital QR Attendance Pass
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 min-h-[40px] rounded-xl text-xs font-extrabold flex items-center gap-2 transition shrink-0 ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" /> Attendance History Log
        </button>
      </div>

      {/* Tab 1: QR Pass Display */}
      {activeTab === 'qr' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-lg mx-auto transition-colors">
          <div className="text-center mb-4">
            <h2 className="font-extrabold text-slate-900 dark:text-white text-lg">Digital Attendance QR Pass</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Display this QR code on your mobile phone screen during class for camera scanning by the professor.
            </p>
          </div>

          <QRCodeGenerator student={student} showCard={true} size={220} />
        </div>
      )}

      {/* Tab 2: Attendance History */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Attendance History Log
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{studentStats.records.length} Recorded Sessions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Time Recorded</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {studentStats.records.length > 0 ? (
                  studentStats.records.map(rec => {
                    const session = StorageService.getSessions().find(s => s.sessionId === rec.sessionId);
                    return (
                      <tr key={rec.attendanceId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{rec.date}</td>
                        <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{session?.subject || 'Class Lecture'}</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 font-mono">{rec.time}</td>
                        <td className="p-4 text-right">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                              rec.status === 'PRESENT'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      No attendance records found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
