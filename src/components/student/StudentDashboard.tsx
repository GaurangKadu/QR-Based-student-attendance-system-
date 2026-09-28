import React, { useState } from 'react';
import { User } from '../../types';
import { StorageService } from '../../services/storageService';
import { StudentQRScannerModal } from './StudentQRScannerModal';
import {
  CheckCircle2,
  XCircle,
  BookOpen,
  History,
  ChevronRight
} from 'lucide-react';

interface StudentDashboardProps {
  student: User;
  externalScannerOpen?: boolean;
  onCloseExternalScanner?: () => void;
  onOpenHistoryDashboard?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  externalScannerOpen = false,
  onCloseExternalScanner,
  onOpenHistoryDashboard,
}) => {
  const [studentStats, setStudentStats] = useState(StorageService.getStudentStats(student.userId));
  const studentClass = StorageService.getClassById(student.classId || '');

  const [showStudentScanner, setShowStudentScanner] = useState<boolean>(false);
  const [scannerInitialTab] = useState<'camera' | 'type_code'>('camera');

  const refreshStudentStats = () => {
    setStudentStats(StorageService.getStudentStats(student.userId));
  };

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
            <p className={`text-2xl sm:text-3xl font-extrabold mt-0.5 ${studentStats.totalSessions === 0 ? 'text-slate-300' : studentStats.percentage >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {studentStats.totalSessions === 0 ? '0%' : `${studentStats.percentage}%`}
            </p>
            <p className="text-[10px] text-slate-300 mt-0.5">
              {studentStats.totalSessions === 0 ? 'No lectures conducted yet' : studentStats.percentage >= 75 ? '✓ Meets 75% Requirement' : '⚠ Below 75% Threshold'}
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
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Scanned / entered present</p>
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

      {/* Attendance History Shortcut Card */}
      {onOpenHistoryDashboard && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                Detailed Attendance History & Filter Log
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                View your complete session records, filter by subject or date, and export CSV reports.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenHistoryDashboard}
            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
          >
            <span>Open History Dashboard</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {(showStudentScanner || externalScannerOpen) && (
        <StudentQRScannerModal
          student={student}
          initialTab={scannerInitialTab}
          onClose={() => {
            setShowStudentScanner(false);
            if (onCloseExternalScanner) onCloseExternalScanner();
          }}
          onScanSuccess={refreshStudentStats}
        />
      )}
    </div>
  );
};
