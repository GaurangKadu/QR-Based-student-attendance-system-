import React from 'react';
import { User } from '../../types';
import { StorageService } from '../../services/storageService';
import { QrCode, Scan, History, Download } from 'lucide-react';

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
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header & Student Identity */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">Student Dashboard</h1>
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div>
            Name: <span className="font-semibold text-slate-900">{student.name}</span>
          </div>
          <div>
            Student ID: <span className="font-mono font-semibold text-slate-900">{student.userId}</span>
          </div>
          <div>
            Class: <span className="font-semibold text-slate-900">{studentClass?.className || 'SE IT'}</span>
          </div>
        </div>
      </div>

      {/* Primary Action Card: Scan Attendance QR */}
      <div className="bg-slate-900 text-white rounded-xl p-6 text-center shadow-xs space-y-3">
        <div className="p-3 bg-blue-600 inline-block rounded-lg text-white">
          <QrCode className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-base font-bold">Scan Attendance QR</h2>
          <p className="text-xs text-slate-300 mt-1">
            Scan the QR code displayed by your teacher to mark your attendance.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={onOpenScannerModal}
            className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition cursor-pointer inline-flex items-center gap-2"
          >
            <Scan className="w-4 h-4" />
            <span>SCAN QR</span>
          </button>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Attendance Summary
        </h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[11px] text-slate-500">Present</p>
            <p className="text-lg font-bold text-emerald-600 mt-0.5">{studentStats.presentCount}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[11px] text-slate-500">Total Classes</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{studentStats.totalSessions}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[11px] text-slate-500">Attendance Rate</p>
            <p className="text-lg font-bold text-blue-600 mt-0.5">{studentStats.percentage}%</p>
          </div>
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Recent Attendance
          </h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={studentStats.records.length === 0}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-semibold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Download CSV</span>
            </button>
            {onOpenHistoryDashboard && (
              <button
                type="button"
                onClick={onOpenHistoryDashboard}
                className="text-xs font-medium text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
              >
                <History className="w-3.5 h-3.5" />
                <span>Full Log</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Subject</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {recentRecords.length > 0 ? (
                recentRecords.map(rec => {
                  const sess = sessions.find(s => s.sessionId === rec.sessionId);
                  const subject = sess?.subject || 'Class Lecture';
                  return (
                    <tr key={rec.attendanceId} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono text-slate-700">{rec.date}</td>
                      <td className="p-3 text-slate-900">{subject}</td>
                      <td className="p-3 text-right">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Present
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-slate-400">
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

