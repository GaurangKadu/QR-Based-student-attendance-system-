import React, { useState } from 'react';
import { StorageService } from '../../services/storageService';
import { User } from '../../types';
import { QRCodeGenerator } from '../QRCodeGenerator';
import { StudentHistoryModal } from './StudentHistoryModal';
import {
  UserPlus,
  Search,
  Filter,
  Edit2,
  KeyRound,
  Power,
  Trash2,
  QrCode,
  X,
  CheckCircle2,
  GraduationCap,
  AlertTriangle,
  MoreVertical
} from 'lucide-react';

export const StudentManagement: React.FC<{ initialClassId?: string }> = ({ initialClassId }) => {
  const [students, setStudents] = useState<User[]>(StorageService.getStudents());
  const classes = StorageService.getClasses();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(initialClassId || 'ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [resetPassStudent, setResetPassStudent] = useState<User | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<User | null>(null);
  const [qrModalStudent, setQrModalStudent] = useState<User | null>(null);
  const [historyStudent, setHistoryStudent] = useState<User | null>(null);
  const [activeMenuStudentId, setActiveMenuStudentId] = useState<string | null>(null);

  // Form State for Add/Edit
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    classId: classes[0]?.classId || '',
    email: '',
    password: 'Student123',
  });

  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');

  const refreshList = () => {
    setStudents(StorageService.getStudents());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleOpenAdd = () => {
    const nextRoll = 200 + students.length + 1;
    const autoStudentId = `STU${nextRoll}`;
    setFormData({
      name: '',
      rollNo: `${nextRoll}`,
      classId: classes[0]?.classId || '',
      email: autoStudentId,
      password: 'Student123',
    });
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.rollNo || !formData.classId || !formData.email) return;

    const qrHash = `QR_${formData.email.toUpperCase()}_${formData.rollNo}_${Date.now()}`;

    StorageService.addUser({
      userId: formData.email,
      name: formData.name,
      email: formData.email,
      password: formData.password || 'Student123',
      role: 'student',
      rollNo: formData.rollNo,
      classId: formData.classId,
      qrId: qrHash,
      status: 'active',
    });

    setShowAddModal(false);
    refreshList();
    showToast(`Added ${formData.name} (ID: ${formData.email})!`);
  };

  const handleOpenEdit = (student: User) => {
    setEditingStudent(student);
    setActiveMenuStudentId(null);
    setFormData({
      name: student.name,
      rollNo: student.rollNo || '',
      classId: student.classId || classes[0]?.classId || '',
      email: student.email,
      password: student.password || 'Student123',
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    StorageService.updateUser(editingStudent.userId, {
      name: formData.name,
      rollNo: formData.rollNo,
      classId: formData.classId,
    });

    setEditingStudent(null);
    refreshList();
    showToast(`Updated ${formData.name}`);
  };

  const handleToggleStatus = (student: User) => {
    setActiveMenuStudentId(null);
    const newStatus = StorageService.toggleUserStatus(student.userId);
    refreshList();
    showToast(`${student.name} is now ${newStatus?.status === 'active' ? 'Active' : 'Deactivated'}`);
  };

  const handleConfirmDelete = () => {
    if (!deletingStudent) return;
    const name = deletingStudent.name;
    StorageService.deleteUser(deletingStudent.userId);
    setDeletingStudent(null);
    setActiveMenuStudentId(null);
    refreshList();
    showToast(`Deleted student ${name}`);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassStudent || !newPasswordInput) return;

    StorageService.updateUser(resetPassStudent.userId, {
      password: newPasswordInput,
    });

    setResetPassStudent(null);
    setNewPasswordInput('');
    refreshList();
    showToast(`Password updated for ${resetPassStudent.name}`);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.rollNo && student.rollNo.includes(searchQuery)) ||
      student.userId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = selectedClassFilter === 'ALL' || student.classId === selectedClassFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || student.status === selectedStatusFilter;

    return matchesSearch && matchesClass && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-blue-500/30 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Student Identity & QR Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create student IDs, set credentials, generate unique QR codes, and manage roll statuses.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2 transition shrink-0"
        >
          <UserPlus className="w-4 h-4" /> Add New Student
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-3 transition-colors">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search student name, roll no, ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedClassFilter}
            onChange={e => setSelectedClassFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold px-3 py-2.5 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Classes / Divisions</option>
            {classes.map(c => (
              <option key={c.classId} value={c.classId}>
                {c.className}
              </option>
            ))}
          </select>
        </div>

        <select
          value={selectedStatusFilter}
          onChange={e => setSelectedStatusFilter(e.target.value)}
          className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold px-3 py-2.5 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="active">Active</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-visible transition-colors">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="p-4">Roll No</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Student ID</th>
                <th className="p-4">QR Pass</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => {
                  const isMenuOpen = activeMenuStudentId === student.userId;
                  return (
                    <tr key={student.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="p-4 font-bold text-slate-900 dark:text-white cursor-pointer hover:text-blue-600" onClick={() => setHistoryStudent(student)}>
                        #{student.rollNo || 'N/A'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{student.name}</p>
                            <p className="text-[10px] text-slate-400">Pass: {student.password || '******'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-700 dark:text-slate-300">{student.userId}</td>
                      <td className="p-4">
                        <button
                          onClick={() => setQrModalStudent(student)}
                          className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition"
                        >
                          <QrCode className="w-3.5 h-3.5" /> View QR
                        </button>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                            student.status === 'active'
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="p-4 text-right relative">
                        {/* More Options Dropdown Trigger */}
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setActiveMenuStudentId(isMenuOpen ? null : student.userId)}
                            title="More Options"
                            className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition border border-slate-200/60 dark:border-slate-700/60"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Actions Dropdown Menu */}
                          {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95">
                              <button
                                onClick={() => handleOpenEdit(student)}
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2.5 transition"
                              >
                                <Edit2 className="w-4 h-4 text-blue-500" />
                                <span>Edit Details</span>
                              </button>

                              <button
                                onClick={() => {
                                  setResetPassStudent(student);
                                  setActiveMenuStudentId(null);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2.5 transition"
                              >
                                <KeyRound className="w-4 h-4 text-amber-500" />
                                <span>Reset Password</span>
                              </button>

                              <button
                                onClick={() => handleToggleStatus(student)}
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2.5 transition"
                              >
                                <Power className="w-4 h-4 text-indigo-500" />
                                <span>{student.status === 'active' ? 'Deactivate Account' : 'Activate Account'}</span>
                              </button>

                              <div className="my-1 border-t border-slate-100 dark:border-slate-700/80"></div>

                              <button
                                onClick={() => {
                                  setDeletingStudent(student);
                                  setActiveMenuStudentId(null);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition"
                              >
                                <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                <span>Delete Student</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No students found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Custom Delete Confirmation */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-950/50 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Permanently Delete Student?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs text-rose-900 dark:text-rose-200 my-4 space-y-1">
              <p className="font-bold">You are deleting:</p>
              <p>• Student: <strong>{deletingStudent.name}</strong></p>
              <p>• Student ID: <strong>{deletingStudent.userId}</strong> (Roll: #{deletingStudent.rollNo})</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2.5 min-h-[40px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 min-h-[40px] bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Yes, Delete Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Student */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" /> Register New Student Profile
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Student Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Yash Vardhan"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Roll Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.rollNo}
                    onChange={e => setFormData({ ...formData, rollNo: e.target.value })}
                    placeholder="e.g. 207"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Class / Division *</label>
                  <select
                    value={formData.classId}
                    onChange={e => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    {classes.map(c => (
                      <option key={c.classId} value={c.classId}>
                        {c.className}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Student Login ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. STU107"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Password *</label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="e.g. Student123"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 min-h-[40px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 min-h-[40px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Register Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Student */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" /> Edit Student Details
              </h2>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Student Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Roll No</label>
                  <input
                    type="text"
                    required
                    value={formData.rollNo}
                    onChange={e => setFormData({ ...formData, rollNo: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Class / Division</label>
                  <select
                    value={formData.classId}
                    onChange={e => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    {classes.map(c => (
                      <option key={c.classId} value={c.classId}>
                        {c.className}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2.5 min-h-[40px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 min-h-[40px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {resetPassStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" /> Reset Password
              </h2>
              <button onClick={() => setResetPassStudent(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
              Reset password for <strong>{resetPassStudent.name}</strong> (ID: {resetPassStudent.userId}):
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <input
                  type="text"
                  required
                  value={newPasswordInput}
                  onChange={e => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new password..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetPassStudent(null)}
                  className="px-4 py-2.5 min-h-[40px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 min-h-[40px] bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Student QR Code */}
      {qrModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 relative transition-colors">
            <button
              onClick={() => setQrModalStudent(null)}
              className="absolute top-4 right-4 p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <QRCodeGenerator student={qrModalStudent} showCard={true} />
          </div>
        </div>
      )}

      {/* Modal: View Student History */}
      {historyStudent && (
        <StudentHistoryModal
            student={historyStudent}
            onClose={() => setHistoryStudent(null)}
        />
      )}
    </div>
  );
};
