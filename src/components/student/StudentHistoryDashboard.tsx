import React, { useState } from 'react';
import { User } from '../../types';
import { StorageService } from '../../services/storageService';
import { ArrowLeft, History, Search } from 'lucide-react';

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" /> Attendance History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verified attendance logs for {student.name} ({studentClass?.className || 'SE IT'}).
          </p>
        </div>

        {onBackToDashboard && (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search log by subject or date..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Time</th>
                <th className="p-3">Subject</th>
                <th className="p-3">Class</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredRecords.length > 0 ? (
                filteredRecords.map(rec => {
                  const sess = sessions.find(s => s.sessionId === rec.sessionId);
                  const subject = sess?.subject || 'Class Lecture';
                  return (
                    <tr key={rec.attendanceId} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono text-slate-800">{rec.date}</td>
                      <td className="p-3 font-mono text-slate-500">{rec.time || 'N/A'}</td>
                      <td className="p-3 font-medium text-slate-900">{subject}</td>
                      <td className="p-3 text-slate-600">{studentClass?.className || 'Class'}</td>
                      <td className="p-3 text-right">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
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
