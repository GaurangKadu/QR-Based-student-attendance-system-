import React, { useState } from 'react';
import { StorageService } from '../../services/storageService';
import { ClassItem, User, AttendanceSession } from '../../types';
import { QRCodeGenerator } from '../QRCodeGenerator';
import { StudentHistoryModal } from './StudentHistoryModal';
import {
  X,
  Users,
  CheckCircle2,
  XCircle,
  UserPlus,
  QrCode,
  Edit2,
  Trash2,
  KeyRound,
  Power,
  MapPin,
  BookOpen
} from 'lucide-react';

interface ClassDetailModalProps {
  cls: ClassItem;
  activeSession: AttendanceSession | null;
  onClose: () => void;
  onStartSession: (cls: ClassItem) => void;
}

export const ClassDetailModal: React.FC<ClassDetailModalProps> = ({
  cls,
  activeSession,
  onClose,
  onStartSession,
}) => {
  const [students, setStudents] = useState<User[]>(
    StorageService.getStudents().filter(s => s.classId === cls.classId)
  );
  const [activeTab, setActiveTab] = useState<'analytics' | 'roster'>('analytics');
  const [rosterFilter, setRosterFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL');

  // Modals inside class detail
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [qrModalStudent, setQrModalStudent] = useState<User | null>(null);
  const [historyStudent, setHistoryStudent] = useState<User | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<User | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    rollNo: `${200 + students.length + 1}`,
    email: `STU${200 + students.length + 1}`,
    password: 'Student123',
  });

  const refreshStudents = () => {
    setStudents(StorageService.getStudents().filter(s => s.classId === cls.classId));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Analytics computation
  const sessionRecords = activeSession && activeSession.classId === cls.classId
    ? StorageService.getAttendanceForSession(activeSession.sessionId)
    : StorageService.getAttendanceRecords().filter(r => r.classId === cls.classId);

  const presentIds = new Set(sessionRecords.filter(r => r.status === 'PRESENT').map(r => r.studentId));
  const presentStudents = students.filter(s => presentIds.has(s.userId));
  const absentStudents = students.filter(s => !presentIds.has(s.userId));

  const displayedRoster = rosterFilter === 'PRESENT'
    ? presentStudents
    : rosterFilter === 'ABSENT'
    ? absentStudents
    : students;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.rollNo || !formData.email) return;

    const qrHash = `QR_${formData.email.toUpperCase()}_${formData.rollNo}_${Date.now()}`;
    StorageService.addUser({
      userId: formData.email,
      name: formData.name,
      email: formData.email,
      password: formData.password || 'Student123',
      role: 'student',
      rollNo: formData.rollNo,
      classId: cls.classId,
      qrId: qrHash,
      status: 'active',
    });

    setShowAddModal(false);
    refreshStudents();
    showToast(`Added ${formData.name} to ${cls.className}!`);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    StorageService.updateUser(editingStudent.userId, {
      name: formData.name,
      rollNo: formData.rollNo,
    });

    setEditingStudent(null);
    refreshStudents();
    showToast(`Updated student details`);
  };

  const handleToggleStatus = (student: User) => {
    StorageService.toggleUserStatus(student.userId);
    refreshStudents();
    showToast(`${student.name} status updated`);
  };

  const handleDeleteStudent = () => {
    if (!deletingStudent) return;
    StorageService.deleteUser(deletingStudent.userId);
    setDeletingStudent(null);
    refreshStudents();
    showToast(`Deleted student`);
  };

  const hasActiveSess = activeSession?.classId === cls.classId;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full p-5 sm:p-7 border border-slate-200 dark:border-slate-800 relative transition-colors max-h-[90vh] flex flex-col">
        {toastMessage && (
          <div className="absolute top-4 right-16 z-50 bg-slate-900 text-white px-3.5 py-2 rounded-xl shadow-xl text-xs font-bold border border-blue-500/30 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {cls.year || '2nd Year IT'}
              </span>
              {hasActiveSess && (
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live Session Active
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
              {cls.className}
            </h2>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 mt-1">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" /> {cls.subject}
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Geofence Radius: {cls.radius || 50}m
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onStartSession(cls)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <QrCode className="w-4 h-4" /> {hasActiveSess ? 'View Session QR' : 'Start Attendance'}
            </button>
            <button
              onClick={onClose}
              className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 pt-4 shrink-0">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Student Analytical Board
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Student Management & Roster ({students.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-4">
          {activeTab === 'analytics' ? (
            <div className="space-y-5">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  onClick={() => { setActiveTab('roster'); setRosterFilter('PRESENT'); }}
                  className="p-5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl cursor-pointer hover:shadow-md transition"
                >
                  <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Present Students
                  </p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-300 mt-2">{presentStudents.length}</p>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1">Click to view present student list</p>
                </div>

                <div
                  onClick={() => { setActiveTab('roster'); setRosterFilter('ABSENT'); }}
                  className="p-5 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl cursor-pointer hover:shadow-md transition"
                >
                  <p className="text-xs font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" /> Absent Students
                  </p>
                  <p className="text-2xl font-black text-rose-600 dark:text-rose-300 mt-2">{absentStudents.length}</p>
                  <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-1">Click to view absent student list</p>
                </div>

                <div
                  onClick={() => { setActiveTab('roster'); setRosterFilter('ALL'); }}
                  className="p-5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl cursor-pointer hover:shadow-md transition"
                >
                  <p className="text-xs font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" /> Total Enrolled
                  </p>
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-300 mt-2">{students.length}</p>
                  <p className="text-[11px] text-blue-700/80 dark:text-blue-400/80 mt-1">Click to view entire roster</p>
                </div>
              </div>

              {/* Quick Present Students Preview List */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Present Students in Current Session</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{presentStudents.length} / {students.length}</span>
                </h3>
                {presentStudents.length > 0 ? (
                  <div className="space-y-2">
                    {presentStudents.map(student => (
                      <div key={student.userId} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-900 dark:text-white">{student.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">Roll: #{student.rollNo} • ID: {student.userId}</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-[10px] font-bold">
                          Present
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">No students have marked attendance for this session yet.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Roster Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setRosterFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${rosterFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    All ({students.length})
                  </button>
                  <button
                    onClick={() => setRosterFilter('PRESENT')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${rosterFilter === 'PRESENT' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    Present ({presentStudents.length})
                  </button>
                  <button
                    onClick={() => setRosterFilter('ABSENT')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${rosterFilter === 'ABSENT' ? 'bg-rose-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    Absent ({absentStudents.length})
                  </button>
                </div>

                <button
                  onClick={() => {
                    const nextRoll = 200 + students.length + 1;
                    const autoId = `STU${nextRoll}`;
                    setFormData({
                      name: '',
                      rollNo: `${nextRoll}`,
                      email: autoId,
                      password: 'Student123',
                    });
                    setShowAddModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition w-full sm:w-auto justify-center"
                >
                  <UserPlus className="w-4 h-4" /> Add Student to Class
                </button>
              </div>

              {/* Roster Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Roll</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">ID</th>
                      <th className="p-3">QR Pass</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {displayedRoster.length > 0 ? (
                      displayedRoster.map(student => (
                        <tr key={student.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">#{student.rollNo}</td>
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{student.name}</td>
                          <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{student.userId}</td>
                          <td className="p-3">
                            <button
                              onClick={() => setQrModalStudent(student)}
                              className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-indigo-100 transition"
                            >
                              <QrCode className="w-3.5 h-3.5" /> View QR
                            </button>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${student.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-50 text-rose-700'}`}>
                              {student.status}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1">
                            <button
                              onClick={() => {
                                setEditingStudent(student);
                                setFormData({ name: student.name, rollNo: student.rollNo || '', email: student.email, password: student.password || '' });
                              }}
                              title="Edit Student"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-blue-600 rounded-lg transition inline-flex"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(student)}
                              title="Toggle Status"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-indigo-600 rounded-lg transition inline-flex"
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingStudent(student)}
                              title="Delete Student"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-lg transition inline-flex"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          No students in this roster view.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Add Student inside Class */}
        {showAddModal && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" /> Add Student to {cls.className}
              </h3>
              <form onSubmit={handleAddSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Yash Vardhan"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={formData.rollNo}
                    onChange={e => setFormData({ ...formData, rollNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Student ID / Email</label>
                  <input
                    type="text"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md"
                  >
                    Add Student
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Student */}
        {editingStudent && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" /> Edit Student
              </h3>
              <form onSubmit={handleEditSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={formData.rollNo}
                    onChange={e => setFormData({ ...formData, rollNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Student QR Pass */}
        {qrModalStudent && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 relative">
              <button
                onClick={() => setQrModalStudent(null)}
                className="absolute top-4 right-4 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
              <QRCodeGenerator student={qrModalStudent} showCard={true} />
            </div>
          </div>
        )}

        {/* Modal: Delete confirmation */}
        {deletingStudent && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-rose-200">
              <h3 className="text-base font-bold text-rose-600 mb-2">Delete {deletingStudent.name}?</h3>
              <p className="text-xs text-slate-500 mb-4">This will permanently remove this student record.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeletingStudent(null)} className="px-3 py-1.5 bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
                <button onClick={handleDeleteStudent} className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
