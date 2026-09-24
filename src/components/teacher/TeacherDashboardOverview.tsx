import React, { useState } from 'react';
import { StorageService } from '../../services/storageService';
import { AuthService } from '../../services/authService';
import { QRScannerModal } from '../QRScannerModal';
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Square,
  QrCode,
  CheckCircle2,
  Sparkles,
  GraduationCap
} from 'lucide-react';

interface TeacherDashboardOverviewProps {
  onNavigate: (tab: string) => void;
}

export const TeacherDashboardOverview: React.FC<TeacherDashboardOverviewProps> = () => {
  const [stats, setStats] = useState(StorageService.getDashboardStats());
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [showStartSessionModal, setShowStartSessionModal] = useState<boolean>(false);

  const classes = StorageService.getClasses();
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.classId || '');
  const [selectedSubject, setSelectedSubject] = useState<string>(classes[0]?.subject || '');

  const currentUser = AuthService.getCurrentUser() || StorageService.getUserById('Teacher1');
  const teacherName = currentUser?.name || 'Prof. Rajesh Sharma';

  const refreshStats = () => {
    setStats(StorageService.getDashboardStats());
  };

  const handleClassChange = (cId: string) => {
    setSelectedClassId(cId);
    const cls = classes.find(c => c.classId === cId);
    if (cls) setSelectedSubject(cls.subject);
  };

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedSubject) return;

    const teacher = currentUser || StorageService.getUserById('Teacher1');
    StorageService.startSession(selectedClassId, selectedSubject, teacher?.userId || 'Teacher1');
    setShowStartSessionModal(false);
    refreshStats();
    setShowScanner(true);
  };

  const handleEndSession = (sessionId: string) => {
    StorageService.endSession(sessionId);
    refreshStats();
  };

  const handleScanQRCodeClick = () => {
    if (stats.activeSession) {
      setShowScanner(true);
    } else {
      setShowStartSessionModal(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Teacher Name & Overview Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {teacherName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              IT Engineering Department • Faculty Attendance Portal
            </p>
          </div>
        </div>

        {/* Scan QR Code Header Action Button */}
        <button
          onClick={handleScanQRCodeClick}
          className="px-5 py-3 min-h-[44px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition shrink-0"
        >
          <QrCode className="w-4 h-4" /> Scan QR Code
        </button>
      </div>

      {/* 4 Primary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Students</span>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.totalStudents}</span>
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
              Registered
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Active student profiles</p>
        </div>

        {/* Present Today */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Present Today</span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.presentCount}</span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
              Scanned
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Marked present today</p>
        </div>

        {/* Absent Today */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Absent Today</span>
            <div className="p-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">{stats.absentCount}</span>
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/40 px-2 py-0.5 rounded-full">
              Unattended
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Unattended in sessions</p>
        </div>

        {/* Attendance Percentage */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Attendance Rate</span>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.percentage}%</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stats.percentage >= 75 ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'}`}>
              {stats.percentage >= 75 ? 'Healthy' : 'Needs Focus'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">Overall participation ratio</p>
        </div>
      </div>

      {/* Start Session Quick Control Bar */}
      {!stats.activeSession && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Instant Attendance Camera</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Launch live camera QR scanner to record student attendance instantly.</p>
          </div>
          <button
            onClick={handleScanQRCodeClick}
            className="w-full sm:w-auto px-6 py-3 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition"
          >
            <QrCode className="w-4 h-4" /> Scan QR Code
          </button>
        </div>
      )}

      {/* Modal: Start Attendance Session */}
      {showStartSessionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" /> Open Attendance Camera Scanner
              </h2>
              <button
                onClick={() => setShowStartSessionModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStartSession} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Class / Division</label>
                <select
                  value={selectedClassId}
                  onChange={e => handleClassChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {classes.map(c => (
                    <option key={c.classId} value={c.classId}>
                      {c.className} ({c.semester})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subject Name</label>
                <input
                  type="text"
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Data Structures & Algorithms"
                  required
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 rounded-xl text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p>Starting a session opens the Live QR Camera scanner immediately. Students present their QR code for real-time recording.</p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStartSessionModal(false)}
                  className="px-4 py-2.5 min-h-[40px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 min-h-[40px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Open Camera & Scan QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Live QR Scanner */}
      {showScanner && stats.activeSession && (
        <QRScannerModal
          session={stats.activeSession}
          onClose={() => {
            setShowScanner(false);
            refreshStats();
          }}
          onScanSuccess={refreshStats}
        />
      )}
    </div>
  );
};
