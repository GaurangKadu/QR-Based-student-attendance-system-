import React, { useState } from 'react';
import { StorageService } from '../../services/storageService';
import {
  FileText,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [students] = useState(StorageService.getStudents());
  const classes = StorageService.getClasses();
  const sessions = StorageService.getSessions();
  const records = StorageService.getAttendanceRecords();

  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Calculate Student Wise Attendance Percentage Report
  const studentReports = students.map(student => {
    const studentSessions = sessions.filter(s => s.classId === student.classId && s.status === 'completed');
    const totalConducted = studentSessions.length || 1;

    const studentRecords = records.filter(r => r.studentId === student.userId);
    const presentCount = studentRecords.filter(r => r.status === 'PRESENT').length;

    const percentage = Math.round((presentCount / totalConducted) * 100);
    const isDefaulter = percentage < 75;

    const studentClass = StorageService.getClassById(student.classId || '');

    return {
      student,
      studentClass,
      totalConducted,
      presentCount,
      absentCount: Math.max(0, totalConducted - presentCount),
      percentage,
      isDefaulter,
    };
  });

  const filteredReports = studentReports.filter(rep => {
    const matchesSearch =
      rep.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rep.student.rollNo && rep.student.rollNo.includes(searchQuery)) ||
      rep.student.userId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = selectedClassFilter === 'ALL' || rep.student.classId === selectedClassFilter;

    return matchesSearch && matchesClass;
  });

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Roll No', 'Student Name', 'Student ID', 'Class', 'Sessions Conducted', 'Present', 'Absent', 'Percentage', 'Status'];
    const csvRows = [
      headers.join(','),
      ...filteredReports.map(r => [
        `"${r.student.rollNo || ''}"`,
        `"${r.student.name}"`,
        `"${r.student.userId}"`,
        `"${r.studentClass?.className || ''}"`,
        r.totalConducted,
        r.presentCount,
        r.absentCount,
        `"${r.percentage}%"`,
        `"${r.isDefaulter ? 'DEFAULTER (<75%)' : 'REGULAR'}"`
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalStudentsCount = filteredReports.length;
  const defaultersCount = filteredReports.filter(r => r.isDefaulter).length;
  const averagePercentage = totalStudentsCount > 0
    ? Math.round(filteredReports.reduce((acc, curr) => acc + curr.percentage, 0) / totalStudentsCount)
    : 0;

  return (
    <div className="space-y-6 print:p-0 print:space-y-4">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden transition-colors">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Attendance Statistics & Defaulter Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Student-wise attendance percentages, total conducted lectures, and automatic &lt;75% defaulter threshold alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4" /> Export CSV Sheet
          </button>
          <button
            onClick={handlePrintReport}
            className="px-4 py-2.5 min-h-[44px] bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5 transition border border-slate-700"
          >
            <Printer className="w-4 h-4" /> Print Report
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Filtered Roster</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalStudentsCount} Students</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Average Attendance Rate</p>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">{averagePercentage}%</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Defaulter Students (&lt;75%)</p>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">{defaultersCount} Students</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-3 print:hidden transition-colors">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search report by student name or roll number..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedClassFilter}
            onChange={e => setSelectedClassFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold px-3 py-2.5 text-slate-800 dark:text-white"
          >
            <option value="ALL">All Divisions</option>
            {classes.map(c => (
              <option key={c.classId} value={c.classId}>
                {c.className}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-1 transition-colors">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-slate-900 dark:text-white text-sm">Student-Wise Attendance Percentage Sheet</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Department of Information Technology Engineering</p>
          </div>
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500">Generated: {new Date().toLocaleDateString()}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="p-4">Roll No</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Class</th>
                <th className="p-4 text-center">Conducted</th>
                <th className="p-4 text-center">Attended</th>
                <th className="p-4 text-center">Percentage</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredReports.length > 0 ? (
                filteredReports.map(rep => (
                  <tr key={rep.student.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">#{rep.student.rollNo || 'N/A'}</td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{rep.student.name}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{rep.studentClass?.className}</td>
                    <td className="p-4 text-center font-mono text-slate-700 dark:text-slate-300">{rep.totalConducted}</td>
                    <td className="p-4 text-center font-mono text-emerald-700 dark:text-emerald-400 font-bold">{rep.presentCount}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden hidden sm:block">
                          <div
                            className={`h-full rounded-full ${rep.isDefaulter ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, rep.percentage)}%` }}
                          ></div>
                        </div>
                        <span className={`font-extrabold ${rep.isDefaulter ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {rep.percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {rep.isDefaulter ? (
                        <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" /> DEFAULTER (&lt;75%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> REGULAR
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No student records matching filter criteria.
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
