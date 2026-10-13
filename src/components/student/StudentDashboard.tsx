import React from 'react';
import { User } from '../../types';
import { StorageService } from '../../services/storageService';
import { QrCode, Scan, History, Download, Sparkles, CheckCircle2, BookOpen, User as UserIcon } from 'lucide-react';
import { playClickSound, playPopSound, playSuccessSound } from '../../utils/soundEffects';

interface StudentDashboardProps {
  student: User;
  onOpenHistoryDashboard?: () => void;
  externalScannerOpen?: boolean;
  onCloseExternalScanner?: () => void;
  onOpenScannerModal?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  onOpenHistoryDashboard,
  onOpenScannerModal,
}) => {
  const [studentClass, setStudentClass] = React.useState(() => StorageService.getClassById(student.classId || ''));
  const [studentStats, setStudentStats] = React.useState(() => StorageService.getStudentStats(student.userId));
  const [sessions, setSessions] = React.useState(() => StorageService.getSessions());

  React.useEffect(() => {
    const handleUpdate = () => {
      setStudentClass(StorageService.getClassById(student.classId || ''));
      setStudentStats(StorageService.getStudentStats(student.userId));
      setSessions(StorageService.getSessions());
    };
    window.addEventListener('qr_attendance_updated', handleUpdate);
    return () => window.removeEventListener('qr_attendance_updated', handleUpdate);
  }, [student.classId, student.userId]);

  const recentRecords = studentStats.records.slice(0, 5);

  const handleExportCSV = () => {
    playClickSound();
    const allRecords = studentStats.records;
    if (allRecords.length === 0) return;
    const headers = ['Attendance ID', 'Date', 'Time', 'Subject', 'Class', 'Status'];
    const rows = allRecords.map(rec => {
      const sess = sessions.find(s => s.sessionId === rec.sessionId);
      const subject = sess?.subject || 'Class Lecture';
      const className = studentClass?.className || 'Class';
      return [
        `"${rec.attendanceId}"`,
        `"${rec.date}"`,
        `"${rec.time || 'N/A'}"`,
        `"${subject}"`,
        `"${className}"`,
        `"${rec.status}"`
      ].join(',');
    });

    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Attendance_History_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    playSuccessSound();
  };

  const handleScanClick = () => {
    playClickSound();
    if (onOpenScannerModal) {
      onOpenScannerModal();
    }
  };

  const handleHistoryClick = () => {
    playPopSound();
    if (onOpenHistoryDashboard) {
      onOpenHistoryDashboard();
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto animate-nm-enter">
      {/* Header & Student Identity - Mild Neumorphic Card */}
      <div className="nm-card p-6 border border-white/80">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Student Portal</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Automated Geofence & QR Attendance Verification</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-400 block">Current Class</span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 inline-block mt-0.5">
              {studentClass?.className || 'SE IT'}
            </span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl nm-inset">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Full Name</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">{student.name}</span>
          </div>
          <div className="p-3 rounded-xl nm-inset">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Student ID / Roll</span>
            <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{student.userId}</span>
          </div>
          <div className="p-3 rounded-xl nm-inset">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Department</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">Information Tech</span>
          </div>
        </div>
      </div>

      {/* Primary Action Card: Scan Attendance QR - Tactile Neumorphic Showcase */}
      <div className="nm-card p-6 sm:p-7 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white border border-slate-700/60 shadow-xl">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0 animate-soft-pulse">
              <QrCode className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Ready to Mark Attendance?</h2>
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-md leading-relaxed">
                Aim your phone camera at the active classroom QR code or enter the teacher's session code within the geofenced room.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleScanClick}
            className="nm-btn-primary px-7 py-3.5 text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2.5 shrink-0 shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Scan className="w-5 h-5 text-white" />
            <span>SCAN ATTENDANCE QR</span>
          </button>
        </div>
      </div>

      {/* Attendance Summary - Mild Neumorphic Raised Metric Tiles */}
      <div className="nm-card p-5 border border-white/80">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span>Attendance Metrics & Summary</span>
        </h3>
        <div className="grid grid-cols-3 gap-3.5 text-center">
          <div className="p-4 rounded-xl nm-inset transition-all hover:scale-[1.02]">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Present</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{studentStats.presentCount}</p>
            <span className="text-[10px] text-emerald-600 font-medium">Classes Attended</span>
          </div>
          <div className="p-4 rounded-xl nm-inset transition-all hover:scale-[1.02]">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Classes</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{studentStats.totalSessions}</p>
            <span className="text-[10px] text-slate-400 font-medium">Conducted Sessions</span>
          </div>
          <div className="p-4 rounded-xl nm-inset transition-all hover:scale-[1.02]">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{studentStats.percentage}%</p>
            <span className={`text-[10px] font-bold ${studentStats.percentage >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {studentStats.percentage >= 75 ? 'Above Threshold' : 'Needs Attention'}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Attendance - Neumorphic Table View */}
      <div className="nm-card overflow-hidden border border-white/80">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Recent Verified Attendance</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={studentStats.records.length === 0}
              className="nm-btn px-3 py-1.5 disabled:opacity-50 text-slate-800 font-semibold text-xs flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export CSV</span>
            </button>
            {onOpenHistoryDashboard && (
              <button
                type="button"
                onClick={handleHistoryClick}
                className="nm-btn px-3 py-1.5 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition hover:text-blue-800"
              >
                <History className="w-3.5 h-3.5" />
                <span>Full History</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5 pl-5">Date</th>
                <th className="p-3.5">Subject</th>
                <th className="p-3.5 text-right pr-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {recentRecords.length > 0 ? (
                recentRecords.map(rec => {
                  const sess = sessions.find(s => s.sessionId === rec.sessionId);
                  const subject = sess?.subject || 'Class Lecture';
                  return (
                    <tr key={rec.attendanceId} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 pl-5 font-mono text-slate-700">{rec.date}</td>
                      <td className="p-3.5 text-slate-900 font-bold">{subject}</td>
                      <td className="p-3.5 text-right pr-5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Present
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-400">
                    No attendance records logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

