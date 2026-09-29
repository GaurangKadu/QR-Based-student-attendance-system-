import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { StorageService } from '../../services/storageService';
import { User, ClassItem } from '../../types';
import { Users, Search, Plus, Upload, Download, Filter, X, Check, AlertCircle } from 'lucide-react';

export const StudentRosterView: React.FC = () => {
  const [students, setStudents] = useState<User[]>(StorageService.getStudents());
  const [classes, setClasses] = useState<ClassItem[]>(StorageService.getClasses());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Manual Add Form State
  const [newStudentId, setNewStudentId] = useState('');
  const [newName, setNewName] = useState('');
  const [newRollNo, setNewRollNo] = useState('');
  const [newClassId, setNewClassId] = useState(classes[0]?.classId || '');
  const [formError, setFormError] = useState('');

  // Bulk Import Preview State
  const [parsedImportRows, setParsedImportRows] = useState<Omit<User, 'createdAt'>[]>([]);
  const [importSummary, setImportSummary] = useState<{ validCount: number; errors: { row: number; studentId: string; reason: string }[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setStudents(StorageService.getStudents());
      setClasses(StorageService.getClasses());
    };
    window.addEventListener('qr_attendance_updated', handleUpdate);
    return () => window.removeEventListener('qr_attendance_updated', handleUpdate);
  }, []);

  const refreshRoster = () => {
    setStudents(StorageService.getStudents());
    setClasses(StorageService.getClasses());
  };

  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(q) ||
      s.userId.toLowerCase().includes(q) ||
      (s.rollNo && s.rollNo.includes(q));

    const matchesClass = selectedClassFilter === 'ALL' || s.classId === selectedClassFilter;

    return matchesSearch && matchesClass;
  });

  const handleManualAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newStudentId.trim() || !newName.trim() || !newClassId) {
      setFormError('Student ID, Name, and Class are required.');
      return;
    }

    const existing = students.find(s => s.userId.toLowerCase() === newStudentId.trim().toLowerCase());
    if (existing) {
      setFormError(`Student ID "${newStudentId.trim()}" already exists.`);
      return;
    }

    StorageService.addUser({
      userId: newStudentId.trim(),
      name: newName.trim(),
      email: newStudentId.trim(),
      password: 'Student123',
      role: 'student',
      rollNo: newRollNo.trim() || undefined,
      classId: newClassId,
      status: 'active',
      qrId: `QR_${newStudentId.trim()}_${newName.trim().replace(/\s+/g, '_').toUpperCase()}`,
    });

    refreshRoster();
    setShowAddModal(false);
    setNewStudentId('');
    setNewName('');
    setNewRollNo('');
  };

  const handleDownloadTemplate = () => {
    const headers = ['Student ID', 'Student Name', 'Roll No', 'Class ID'];
    const targetClass = classes[0]?.classId || 'CLASS_SE_IT_A';
    const sampleRows = [
      ['STU201', 'Rahul Sharma', '1', targetClass],
      ['STU202', 'Amit Patil', '2', targetClass],
      ['STU203', 'Priya Shah', '3', targetClass],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student_Import_Template');
    XLSX.writeFile(wb, 'student_import_template.xlsx');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rows.length < 2) {
          alert('Excel file is empty or missing data rows.');
          return;
        }

        // Header row mapping
        const headerRow = rows[0].map((h: any) => String(h || '').trim().toLowerCase());
        const idIdx = headerRow.findIndex(h => h.includes('id'));
        const nameIdx = headerRow.findIndex(h => h.includes('name'));
        const rollIdx = headerRow.findIndex(h => h.includes('roll'));
        const classIdx = headerRow.findIndex(h => h.includes('class'));

        const parsedList: Omit<User, 'createdAt'>[] = [];
        const existingIds = new Set(students.map(s => s.userId.toLowerCase()));
        const errors: { row: number; studentId: string; reason: string }[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const sId = String(row[idIdx >= 0 ? idIdx : 0] || '').trim();
          const sName = String(row[nameIdx >= 0 ? nameIdx : 1] || '').trim();
          const sRoll = String(row[rollIdx >= 0 ? rollIdx : 2] || '').trim();
          let sClass = String(row[classIdx >= 0 ? classIdx : 3] || '').trim();

          // Match class by ID or className
          if (sClass) {
            const matchedClass = classes.find(c => c.classId.toLowerCase() === sClass.toLowerCase() || c.className.toLowerCase() === sClass.toLowerCase());
            if (matchedClass) {
              sClass = matchedClass.classId;
            }
          } else {
            sClass = classes[0]?.classId || 'CLASS_SE_IT_A';
          }

          if (!sId) {
            errors.push({ row: i + 1, studentId: 'N/A', reason: 'Missing Student ID' });
            continue;
          }
          if (!sName) {
            errors.push({ row: i + 1, studentId: sId, reason: 'Missing Student Name' });
            continue;
          }

          if (existingIds.has(sId.toLowerCase())) {
            errors.push({ row: i + 1, studentId: sId, reason: 'Duplicate Student ID in system' });
            continue;
          }

          existingIds.add(sId.toLowerCase());
          parsedList.push({
            userId: sId,
            name: sName,
            email: sId,
            password: 'Student123',
            role: 'student',
            rollNo: sRoll || undefined,
            classId: sClass,
            status: 'active',
            qrId: `QR_${sId}_${sName.replace(/\s+/g, '_').toUpperCase()}`,
          });
        }

        setParsedImportRows(parsedList);
        setImportSummary({
          validCount: parsedList.length,
          errors,
        });
        setShowImportModal(true);
      } catch (err) {
        alert('Failed to parse Excel file. Please use valid .xlsx, .xls, or .csv format.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (parsedImportRows.length === 0) return;
    StorageService.bulkImportStudents(parsedImportRows);
    refreshRoster();
    setShowImportModal(false);
    setParsedImportRows([]);
    setImportSummary(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-700" /> Students
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered student roster and class assignments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>TEMPLATE</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>IMPORT EXCEL</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => {
              setNewClassId(classes[0]?.classId || '');
              setShowAddModal(true);
            }}
            className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD STUDENT</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search student by ID, Name, or Roll No..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
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

      {/* Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3">Student ID</th>
                <th className="p-3">Roll No</th>
                <th className="p-3">Name</th>
                <th className="p-3">Class</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => {
                  const studentClass = StorageService.getClassById(student.classId || '');
                  return (
                    <tr key={student.userId} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-medium text-slate-800">{student.userId}</td>
                      <td className="p-3 font-mono text-slate-600">{student.rollNo || 'N/A'}</td>
                      <td className="p-3 font-medium text-slate-900">{student.name}</td>
                      <td className="p-3 text-slate-600">{studentClass?.className || 'Unassigned'}</td>
                      <td className="p-3 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${
                          student.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {student.status === 'active' ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    No students found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg max-w-md w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Add New Student</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleManualAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student ID</label>
                <input
                  type="text"
                  value={newStudentId}
                  onChange={e => setNewStudentId(e.target.value)}
                  placeholder="e.g. STU201"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Roll Number</label>
                <input
                  type="text"
                  value={newRollNo}
                  onChange={e => setNewRollNo(e.target.value)}
                  placeholder="e.g. 15"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Class</label>
                <select
                  value={newClassId}
                  onChange={e => setNewClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  {classes.map(c => (
                    <option key={c.classId} value={c.classId}>
                      {c.className}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
                >
                  SAVE STUDENT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Preview Modal */}
      {showImportModal && importSummary && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg max-w-lg w-full p-6 relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 shrink-0">
              <h2 className="text-base font-bold text-slate-900">Excel Import Preview</h2>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                  <p className="text-lg font-bold text-emerald-700">{importSummary.validCount}</p>
                  <p className="font-semibold mt-0.5">Valid Students Ready</p>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">
                  <p className="text-lg font-bold text-rose-700">{importSummary.errors.length}</p>
                  <p className="font-semibold mt-0.5">Skipped / Errors</p>
                </div>
              </div>

              {importSummary.errors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1">
                  <p className="font-bold text-rose-800">Skipped Rows:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-rose-700 text-[11px]">
                    {importSummary.errors.map((err, idx) => (
                      <li key={idx}>
                        Row {err.row} (ID: {err.studentId}) — {err.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsedImportRows.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-2">ID</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">Roll</th>
                        <th className="p-2">Class</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedImportRows.slice(0, 10).map(s => (
                        <tr key={s.userId}>
                          <td className="p-2 font-mono font-medium">{s.userId}</td>
                          <td className="p-2">{s.name}</td>
                          <td className="p-2 font-mono">{s.rollNo || '-'}</td>
                          <td className="p-2">{StorageService.getClassById(s.classId || '')?.className || s.classId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedImportRows.length > 10 && (
                    <p className="text-[11px] text-slate-400 p-2 text-center border-t border-slate-100">
                      ...and {parsedImportRows.length - 10} more rows
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 mt-4 shrink-0">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={parsedImportRows.length === 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>CONFIRM & IMPORT ({parsedImportRows.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
