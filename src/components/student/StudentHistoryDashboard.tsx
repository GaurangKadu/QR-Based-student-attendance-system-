import React, { useState, useMemo } from 'react';
import { User } from '../../types';
import { StorageService } from '../../services/storageService';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  RotateCcw,
  Check,
  BookOpen,
  QrCode,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';

interface StudentHistoryDashboardProps {
  student: User;
  onBackToDashboard?: () => void;
}

export const StudentHistoryDashboard: React.FC<StudentHistoryDashboardProps> = ({
  student,
  onBackToDashboard,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PRESENT' | 'ABSENT'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const studentClass = StorageService.getClassById(student.classId || '');
  const sessions = StorageService.getSessions();
  const studentStats = StorageService.getStudentStats(student.userId);
  const rawRecords = studentStats.records;

  // Extract unique subjects for the filter dropdown
  const uniqueSubjects = useMemo(() => {
    const subjectsSet = new Set<string>();
    rawRecords.forEach(rec => {
      const sess = sessions.find(s => s.sessionId === rec.sessionId);
      if (sess?.subject) {
        subjectsSet.add(sess.subject);
      }
    });
    return Array.from(subjectsSet);
  }, [rawRecords, sessions]);

  // Filtered & sorted records
  const filteredRecords = useMemo(() => {
    return rawRecords
      .filter(rec => {
        const sess = sessions.find(s => s.sessionId === rec.sessionId);
        const subject = sess?.subject || 'Class Lecture';
        const dateStr = rec.date || '';
        const timeStr = rec.time || '';

        // Status filter
        if (statusFilter !== 'all' && rec.status !== statusFilter) {
          return false;
        }

        // Subject filter
        if (selectedSubject !== 'all' && subject.toLowerCase() !== selectedSubject.toLowerCase()) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchSubject = subject.toLowerCase().includes(q);
          const matchDate = dateStr.toLowerCase().includes(q);
          const matchTime = timeStr.toLowerCase().includes(q);
          const matchSession = rec.sessionId.toLowerCase().includes(q);
          if (!matchSubject && !matchDate && !matchTime && !matchSession) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime() || 0;
        const dateB = new Date(b.date).getTime() || 0;
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [rawRecords, sessions, statusFilter, selectedSubject, searchQuery, sortOrder]);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedSubject !== 'all' || statusFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSubject('all');
    setStatusFilter('all');
    setSortOrder('desc');
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    const headers = ['Attendance ID', 'Date', 'Time', 'Subject', 'Class', 'Status', 'Session ID'];
    const rows = filteredRecords.map(rec => {
      const sess = sessions.find(s => s.sessionId === rec.sessionId);
      const subject = sess?.subject || 'Class Lecture';
      const className = studentClass?.className || 'Class';
      return [
        rec.attendanceId,
        rec.date,
        rec.time || 'N/A',
        `"${subject}"`,
        `"${className}"`,
        rec.status,
        rec.sessionId
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_History_${student.name.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {onBackToDashboard && (
                <button
                  type="button"
                  onClick={onBackToDashboard}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>
              )}
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-400/30 uppercase tracking-wider">
                Student Attendance Records
              </span>
              <span className="text-xs text-slate-300 font-semibold">{studentClass?.className}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Attendance History & Log
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Student: <strong className="text-white">{student.name}</strong> • Roll #{student.rollNo || 'N/A'} • ID: {student.userId}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredRecords.length === 0}
              className="py-2.5 px-4 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl border border-white/10 flex items-center gap-2 transition cursor-pointer shadow-sm shrink-0"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Lectures</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">{studentStats.totalSessions}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Conducted this semester</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Present</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5">{studentStats.presentCount}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Verified check-ins</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Missed</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1.5">{studentStats.absentCount}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Recorded absences</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Attendance Rate</span>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
              studentStats.totalSessions === 0
                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                : studentStats.percentage >= 75
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}>
              {studentStats.totalSessions === 0 ? 'No Records' : studentStats.percentage >= 75 ? 'Qualified' : 'Critical'}
            </span>
          </div>
          <div className="mt-1.5">
            <p className={`text-2xl font-black ${studentStats.totalSessions === 0 ? 'text-slate-400' : studentStats.percentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
              {studentStats.totalSessions === 0 ? '0%' : `${studentStats.percentage}%`}
            </p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  studentStats.percentage >= 75 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, studentStats.percentage)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Filter & Controls Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by subject name, date (YYYY-MM-DD), or session..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Subject Dropdown */}
            <div className="relative flex items-center">
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="py-2.5 pl-3 pr-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Subjects ({uniqueSubjects.length})</option>
                {uniqueSubjects.map(sub => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
            </div>

            {/* Sort Order Toggle */}
            <button
              type="button"
              onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
              title="Toggle Sort Order"
              className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-500" />
              <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
            </button>

            {/* Download / Export CSV button */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredRecords.length === 0}
              className="py-2.5 px-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-2xl shadow-sm shadow-blue-500/20 flex items-center gap-1.5 transition cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>

            {/* Reset Filters button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-2xl border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Status:
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`py-1.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All ({rawRecords.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PRESENT')}
            className={`py-1.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center gap-1 cursor-pointer ${
              statusFilter === 'PRESENT'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <Check className="w-3 h-3" />
            <span>Present ({studentStats.presentCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ABSENT')}
            className={`py-1.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center gap-1 cursor-pointer ${
              statusFilter === 'ABSENT'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
            }`}
          >
            <XCircle className="w-3 h-3" />
            <span>Absent ({studentStats.absentCount})</span>
          </button>

          <span className="ml-auto text-[11px] text-slate-400 font-mono font-bold hidden sm:inline">
            Showing {filteredRecords.length} of {rawRecords.length} records
          </span>
        </div>
      </div>

      {/* Attendance History Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                Detailed Session Log
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Individual attendance verification logs with timestamps and method
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            {filteredRecords.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Subject & Session</th>
                <th className="p-4">Class</th>
                <th className="p-4">Time Recorded</th>
                <th className="p-4">Verification</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredRecords.length > 0 ? (
                filteredRecords.map(rec => {
                  const session = sessions.find(s => s.sessionId === rec.sessionId);
                  const subject = session?.subject || 'Class Lecture';
                  return (
                    <tr
                      key={rec.attendanceId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="p-4 whitespace-nowrap">
                        <p className="font-extrabold text-slate-900 dark:text-white">{rec.date}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {new Date(rec.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900 dark:text-white">{subject}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {rec.sessionId} {session?.dailyCode ? `• Passcode: ${session.dailyCode}` : ''}
                        </p>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {studentClass?.className || 'Class'}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        {rec.time || 'N/A'}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                          <QrCode className="w-3.5 h-3.5 text-blue-500" />
                          <span>QR Verified</span>
                        </div>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                            rec.status === 'PRESENT'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {rec.status === 'PRESENT' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span>Present</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-500" />
                              <span>Absent</span>
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                        {rawRecords.length === 0 ? <Calendar className="w-5 h-5 text-indigo-500" /> : <Filter className="w-5 h-5" />}
                      </div>
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                        {rawRecords.length === 0 ? 'No attendance records logged yet' : 'No matching attendance records'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {rawRecords.length === 0
                          ? 'Your verified lecture attendance logs will appear here once you scan into class.'
                          : 'No logs match your current search and filter combination.'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
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
