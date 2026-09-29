import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/storageService';
import { FileText, Download, Filter } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [students, setStudents] = useState(StorageService.getStudents());
  const [classes, setClasses] = useState(StorageService.getClasses());
  const [sessions, setSessions] = useState(StorageService.getSessions());
  const [records, setRecords] = useState(StorageService.getAttendanceRecords());

  useEffect(() => {
    const handleUpdate = () => {
      setStudents(StorageService.getStudents());
      setClasses(StorageService.getClasses());
      setSessions(StorageService.getSessions());
      setRecords(StorageService.getAttendanceRecords());
    };
    window.addEventListener('qr_attendance_updated', handleUpdate);
    return () => window.removeEventListener('qr_attendance_updated', handleUpdate);
  }, []);

  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');


  const studentReports = students.map(student => {
    const studentSessions = sessions.filter(s => s.classId === student.classId && s.status === 'completed');
    const totalConducted = studentSessions.length || 1;

    const studentRecords = records.filter(r => r.studentId === student.userId);
    const presentCount = studentRecords.filter(r => r.status === 'PRESENT').length;

    const percentage = Math.round((presentCount / totalConducted) * 100);

    const studentClass = StorageService.getClassById(student.classId || '');

    return {
      student,
      studentClass,
      totalConducted,
      presentCount,
      absentCount: Math.max(0, totalConducted - presentCount),
      percentage,
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

  const handleExportCSV = () => {
    const headers = ['Student ID', 'Roll No', 'Student Name', 'Class', 'Present', 'Absent', 'Attendance %'];
    const csvRows = [
      headers.join(','),
      ...filteredReports.map(r => [
        `"${r.student.userId}"`,
        `"${r.student.rollNo || ''}"`,
        `"${r.student.name}"`,
        `"${r.studentClass?.className || ''}"`,
        r.presentCount,
        r.absentCount,
        `"${r.percentage}%"`
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-700" /> Attendance Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Student-wise attendance percentages and class attendance summary.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>EXPORT CSV</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search student by name or roll number..."
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedClassFilter}
            onChange={e => setSelectedClassFilter(e.target.value)}
            className="w-full sm:w-auto bg-white border border-slate-300 rounded-lg text-xs font-medium px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
          >
            <option value="ALL">All Classes</option>
            {classes.map(c => (
              <option key={c.classId} value={c.classId}>
                {c.className}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3">Student ID</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Class</th>
                <th className="p-3 text-center">Present</th>
                <th className="p-3 text-center">Absent</th>
                <th className="p-3 text-right">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredReports.length > 0 ? (
                filteredReports.map(rep => (
                  <tr key={rep.student.userId} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-medium text-slate-800">{rep.student.userId}</td>
                    <td className="p-3 font-medium text-slate-900">{rep.student.name}</td>
                    <td className="p-3 text-slate-600">{rep.studentClass?.className || 'N/A'}</td>
                    <td className="p-3 text-center font-mono text-emerald-700 font-medium">{rep.presentCount}</td>
                    <td className="p-3 text-center font-mono text-rose-700 font-medium">{rep.absentCount}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {rep.percentage}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
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
