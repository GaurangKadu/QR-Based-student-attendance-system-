import React, { useState } from 'react';
import { User } from '../../types';
import { StorageService } from '../../services/storageService';
import { ArrowLeft, History, Search, CheckCircle2 } from 'lucide-react';
import { playClickSound, playPopSound } from '../../utils/soundEffects';

interface StudentHistoryDashboardProps {
  student: User;
  onBackToDashboard?: () => void;
}

export const StudentHistoryDashboard: React.FC<StudentHistoryDashboardProps> = ({
  student,
  onBackToDashboard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [studentClass, setStudentClass] = useState(() => StorageService.getClassById(student.classId || ''));
  const [sessions, setSessions] = useState(() => StorageService.getSessions());
  const [studentStats, setStudentStats] = useState(() => StorageService.getStudentStats(student.userId));

  React.useEffect(() => {
    const handleUpdate = () => {
      setStudentClass(StorageService.getClassById(student.classId || ''));
      setSessions(StorageService.getSessions());
      setStudentStats(StorageService.getStudentStats(student.userId));
    };
    window.addEventListener('qr_attendance_updated', handleUpdate);
    return () => window.removeEventListener('qr_attendance_updated', handleUpdate);
  }, [student.classId, student.userId]);

  const rawRecords = studentStats.records;

  const filteredRecords = rawRecords.filter(rec => {
    const sess = sessions.find(s => s.sessionId === rec.sessionId);
    const subject = sess?.subject || 'Class Lecture';
    const q = searchQuery.toLowerCase();
    return (
      subject.toLowerCase().includes(q) ||
      rec.date.toLowerCase().includes(q) ||
      rec.status.toLowerCase().includes(q)
    );
  });

  const handleBackClick = () => {
    playPopSound();
    if (onBackToDashboard) {
      onBackToDashboard();
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto animate-nm-enter">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" /> Attendance History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verified attendance records for <span className="font-semibold text-slate-700">{student.name}</span> ({studentClass?.className || 'SE IT'}).
          </p>
        </div>

        {onBackToDashboard && (
          <button
            type="button"
            onClick={handleBackClick}
            className="nm-btn py-2 px-3.5 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-2 transition hover:text-blue-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        )}
      </div>

      {/* Search Bar - Sunken Well Neumorphism */}
      <div className="nm-card p-4 border border-white/80">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search verified records by subject, date, or code..."
            className="nm-input w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:outline-none"
          />
        </div>
      </div>

      {/* History Table - Mild Neumorphic Card */}
      <div className="nm-card overflow-hidden border border-white/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5 pl-5">Date</th>
                <th className="p-3.5">Time</th>
                <th className="p-3.5">Subject</th>
                <th className="p-3.5">Class</th>
                <th className="p-3.5 text-right pr-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredRecords.length > 0 ? (
                filteredRecords.map(rec => {
                  const sess = sessions.find(s => s.sessionId === rec.sessionId);
                  const subject = sess?.subject || 'Class Lecture';
                  return (
                    <tr key={rec.attendanceId} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 pl-5 font-mono text-slate-800 font-semibold">{rec.date}</td>
                      <td className="p-3.5 font-mono text-slate-500">{rec.time || 'N/A'}</td>
                      <td className="p-3.5 font-bold text-slate-900">{subject}</td>
                      <td className="p-3.5 text-slate-600">{studentClass?.className || 'Class'}</td>
                      <td className="p-3.5 text-right pr-5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No attendance records found matching your query.
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
