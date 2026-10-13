import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/storageService';
import { User, ClassItem, AttendanceRecord, AttendanceSession } from '../../types';
import {
  Building2,
  Users,
  GraduationCap,
  MapPin,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Pencil,
  UserCheck,
  UserX,
  Navigation,
  KeyRound,
  BookOpen,
  Filter,
  Check,
  X,
  Activity,
  Layers,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { ViewToggle } from '../common/ViewToggle';
import {
  playClickSound,
  playPopSound,
  playSuccessSound,
  playWarningSound,
  playErrorSound,
  playDeleteSound
} from '../../utils/soundEffects';

interface AdminDashboardProps {
  currentUser: User;
  activeSubTab?: string;
  onNavigateTab?: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  activeSubTab = 'classrooms',
  onNavigateTab,
}) => {
  const [tab, setTab] = useState<'overview' | 'classrooms' | 'teachers' | 'students' | 'geofence' | 'activity'>('classrooms');
  const [classViewMode, setClassViewMode] = useState<'table' | 'card'>('table');
  const [teachersViewMode, setTeachersViewMode] = useState<'table' | 'card'>('table');
  const [studentsViewMode, setStudentsViewMode] = useState<'table' | 'card'>('table');

  useEffect(() => {
    if (activeSubTab) {
      const tabMap: Record<string, typeof tab> = {
        'admin_classes': 'classrooms',
        'admin_teachers': 'teachers',
        'admin_students': 'students',
        'admin_geofence': 'geofence',
        'admin_reports': 'activity'
      };
      if (tabMap[activeSubTab]) {
        setTab(tabMap[activeSubTab]);
      }
    }
  }, [activeSubTab]);

  // Core Data State
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  // Search & Filters
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('ALL');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [classSearch, setClassSearch] = useState('');
  const [activityDateFilter, setActivityDateFilter] = useState('');

  // Modals & Editing
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [isCreateTeacherOpen, setIsCreateTeacherOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [isEditTeacherOpen, setIsEditTeacherOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [assigningClass, setAssigningClass] = useState<ClassItem | null>(null);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);

  // Status Alerts
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form States - Create Class
  const [newClassName, setNewClassName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newYear, setNewYear] = useState('2nd Year');
  const [newSemester, setNewSemester] = useState('Semester IV');
  const [newDivision, setNewDivision] = useState('A');
  const [newClassroomName, setNewClassroomName] = useState('Room 201');
  const [newTeacherId, setNewTeacherId] = useState('');
  const [newLat, setNewLat] = useState('19.0760');
  const [newLng, setNewLng] = useState('72.8777');
  const [newRadius, setNewRadius] = useState('50');
  const [isLocating, setIsLocating] = useState(false);

  // Form States - Create Teacher
  const [newTeacherIdInput, setNewTeacherIdInput] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('Teacher@123');
  const [newTeacherDept, setNewTeacherDept] = useState('Information Technology');

  // Form States - Add Student
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newStudentClassId, setNewStudentClassId] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('Student123');

  // Load / Refresh Data
  const loadData = () => {
    const allUsers = StorageService.getUsers();
    setTeachers(allUsers.filter(u => u.role === 'teacher'));
    setStudents(allUsers.filter(u => u.role === 'student'));
    setClasses(StorageService.getClasses());
    setSessions(StorageService.getSessions());
    setRecords(StorageService.getAttendanceRecords());
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('qr_attendance_updated', handleUpdate);
    return () => window.removeEventListener('qr_attendance_updated', handleUpdate);
  }, []);

  // Sync with prop if provided
  useEffect(() => {
    if (activeSubTab) {
      if (activeSubTab === 'admin_classes') setTab('classrooms');
      else if (activeSubTab === 'admin_teachers') setTab('teachers');
      else if (activeSubTab === 'admin_students') setTab('students');
      else if (activeSubTab === 'admin_geofence') setTab('geofence');
      else if (activeSubTab === 'admin_overview') setTab('overview');
      else if (activeSubTab === 'admin_reports') setTab('activity');
    }
  }, [activeSubTab]);

  const showNotification = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      playSuccessSound();
    } else {
      playErrorSound();
    }
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // GPS Helper for Create Class
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      showNotification('error', 'Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewLat(pos.coords.latitude.toFixed(6));
        setNewLng(pos.coords.longitude.toFixed(6));
        setIsLocating(false);
        showNotification('success', 'Acquired precise GPS location for classroom.');
      },
      (err) => {
        setIsLocating(false);
        showNotification('error', `GPS detection failed: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Submit Create Class
  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !newSubject.trim()) {
      showNotification('error', 'Please provide Class Name and Subject.');
      return;
    }

    const classId = `CLASS_${Date.now()}`;
    const selectedTeacher = teachers.find(t => t.userId === newTeacherId);

    const newClassItem: ClassItem = {
      classId,
      className: newClassName.trim(),
      classroomName: newClassroomName.trim() || newClassName.trim(),
      subject: newSubject.trim(),
      year: newYear,
      semester: newSemester,
      division: newDivision,
      teacherId: selectedTeacher?.userId,
      teacherName: selectedTeacher?.name,
      totalStudents: 60,
      latitude: parseFloat(newLat) || 19.0760,
      longitude: parseFloat(newLng) || 72.8777,
      radius: parseInt(newRadius) || 50,
      geofenceActive: true,
    };

    StorageService.addClass(newClassItem);
    loadData();
    setIsCreateClassOpen(false);
    resetClassForm();
    showNotification('success', `Classroom "${newClassItem.className}" created and configured.`);
  };

  const resetClassForm = () => {
    setNewClassName('');
    setNewSubject('');
    setNewYear('2nd Year');
    setNewSemester('Semester IV');
    setNewDivision('A');
    setNewClassroomName('Room 201');
    setNewTeacherId('');
    setNewLat('19.0760');
    setNewLng('72.8777');
    setNewRadius('50');
  };

  // Open Edit Classroom Modal
  const handleOpenEditClass = (cls: ClassItem) => {
    setEditingClass(cls);
    setNewClassName(cls.className);
    setNewSubject(cls.subject);
    setNewYear(cls.year || '2nd Year');
    setNewSemester(cls.semester || 'Semester IV');
    setNewDivision(cls.division || 'A');
    setNewClassroomName(cls.classroomName || 'Room 201');
    setNewTeacherId(cls.teacherId || '');
    setNewLat(String(cls.latitude ?? 19.0760));
    setNewLng(String(cls.longitude ?? 72.8777));
    setNewRadius(String(cls.radius ?? 50));
    setIsEditClassOpen(true);
  };

  // Submit Save Edited Classroom
  const handleSaveEditClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    if (!newClassName.trim() || !newSubject.trim()) {
      showNotification('error', 'Please provide Class Name and Subject.');
      return;
    }

    const assignedTeacher = teachers.find(t => t.userId === newTeacherId);
    StorageService.updateClass(editingClass.classId, {
      className: newClassName.trim(),
      subject: newSubject.trim(),
      year: newYear,
      semester: newSemester,
      division: newDivision,
      classroomName: newClassroomName.trim(),
      teacherId: assignedTeacher?.userId || undefined,
      teacherName: assignedTeacher?.name || undefined,
      latitude: parseFloat(newLat) || 19.0760,
      longitude: parseFloat(newLng) || 72.8777,
      radius: parseInt(newRadius, 10) || 50,
    });

    loadData();
    setIsEditClassOpen(false);
    setEditingClass(null);
    resetClassForm();
    showNotification('success', `Classroom "${newClassName}" updated successfully.`);
  };

  // Open Edit Teacher Modal
  const handleOpenEditTeacher = (teacher: User) => {
    setEditingTeacher(teacher);
    setNewTeacherIdInput(teacher.userId);
    setNewTeacherName(teacher.name);
    setNewTeacherEmail(teacher.email || '');
    setNewTeacherPassword(teacher.password || 'Teacher@123');
    setNewTeacherDept(teacher.department || 'Information Technology');
    setIsEditTeacherOpen(true);
  };

  // Submit Save Edited Teacher
  const handleSaveEditTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    if (!newTeacherName.trim()) {
      showNotification('error', 'Teacher Name is required.');
      return;
    }

    StorageService.updateUser(editingTeacher.userId, {
      name: newTeacherName.trim(),
      email: newTeacherEmail.trim() || editingTeacher.userId,
      password: newTeacherPassword.trim() || 'Teacher@123',
      department: newTeacherDept.trim(),
    });

    loadData();
    setIsEditTeacherOpen(false);
    setEditingTeacher(null);
    setNewTeacherIdInput('');
    setNewTeacherName('');
    setNewTeacherEmail('');
    setNewTeacherPassword('Teacher@123');
    showNotification('success', `Teacher profile for "${newTeacherName}" updated successfully.`);
  };

  // Submit Create Teacher ID
  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = newTeacherIdInput.trim();
    const cleanName = newTeacherName.trim();

    if (!cleanId || !cleanName) {
      showNotification('error', 'Teacher ID and Name are required.');
      return;
    }

    // Check duplicate ID
    const existing = StorageService.getUserById(cleanId);
    if (existing) {
      showNotification('error', `A user with ID "${cleanId}" already exists.`);
      return;
    }

    const newTeacher: User = {
      userId: cleanId,
      name: cleanName,
      email: newTeacherEmail.trim() || cleanId,
      password: newTeacherPassword.trim() || 'Teacher@123',
      role: 'teacher',
      department: newTeacherDept,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    StorageService.addUser(newTeacher);
    loadData();
    setIsCreateTeacherOpen(false);
    setNewTeacherIdInput('');
    setNewTeacherName('');
    setNewTeacherEmail('');
    setNewTeacherPassword('Teacher@123');
    showNotification('success', `Teacher account "${cleanName}" (${cleanId}) created successfully.`);
  };

  // Submit Add / Edit Student
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = newStudentId.trim();
    const cleanName = newStudentName.trim();
    const cleanRoll = newStudentRoll.trim();

    if (!cleanId || !cleanName) {
      showNotification('error', 'Student ID and Name are required.');
      return;
    }

    if (editingStudent) {
      StorageService.updateUser(editingStudent.userId, {
        name: cleanName,
        rollNo: cleanRoll,
        classId: newStudentClassId,
        password: newStudentPassword,
      });
      showNotification('success', `Student "${cleanName}" updated successfully.`);
      setEditingStudent(null);
    } else {
      const existing = StorageService.getUserById(cleanId);
      if (existing) {
        showNotification('error', `A user with ID "${cleanId}" already exists.`);
        return;
      }

      const newStudentUser: User = {
        userId: cleanId,
        name: cleanName,
        email: cleanId,
        rollNo: cleanRoll,
        classId: newStudentClassId || (classes[0]?.classId ?? 'CLASS_SE_IT_A'),
        password: newStudentPassword.trim() || 'Student123',
        role: 'student',
        qrId: `QR_${cleanId}_${cleanRoll || 'STU'}`,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      StorageService.addUser(newStudentUser);
      showNotification('success', `Student "${cleanName}" registered with QR ID.`);
    }

    loadData();
    setIsAddStudentOpen(false);
    setNewStudentId('');
    setNewStudentName('');
    setNewStudentRoll('');
    setNewStudentPassword('Student123');
  };

  // Assign Teacher to Classroom
  const handleAssignTeacher = (classId: string, teacherId: string) => {
    const targetTeacher = teachers.find(t => t.userId === teacherId);
    StorageService.updateClass(classId, {
      teacherId: targetTeacher?.userId || undefined,
      teacherName: targetTeacher?.name || undefined,
    });
    loadData();
    setAssigningClass(null);
    showNotification(
      'success',
      targetTeacher
        ? `Classroom assigned to ${targetTeacher.name} (${targetTeacher.userId}).`
        : 'Classroom assignment cleared.'
    );
  };

  // Delete Classroom
  const handleDeleteClass = (classId: string, className: string) => {
    if (window.confirm(`Are you sure you want to remove classroom "${className}"?`)) {
      playDeleteSound();
      StorageService.deleteClass(classId);
      loadData();
      showNotification('success', `Classroom "${className}" deleted.`);
    }
  };

  // Toggle User Status
  const handleToggleUserStatus = (userId: string, name: string) => {
    playClickSound();
    StorageService.toggleUserStatus(userId);
    loadData();
    showNotification('success', `Updated account status for ${name}.`);
  };

  // Delete User
  const handleDeleteUser = (userId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete user "${name}" (${userId})?`)) {
      playDeleteSound();
      StorageService.deleteUser(userId);
      loadData();
      showNotification('success', `User "${name}" removed.`);
    }
  };

  // Toggle Geofence on Classroom
  const handleToggleGeofence = (cls: ClassItem) => {
    playClickSound();
    const updatedStatus = !cls.geofenceActive;
    StorageService.updateClass(cls.classId, { geofenceActive: updatedStatus });
    loadData();
    showNotification(
      'success',
      `Geofence boundary for "${cls.className}" is now ${updatedStatus ? 'ACTIVE' : 'DISABLED'}.`
    );
  };

  // Filtered Lists
  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.userId.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.rollNo && s.rollNo.includes(studentSearch));
    const matchesClass = studentClassFilter === 'ALL' || s.classId === studentClassFilter;
    return matchesSearch && matchesClass;
  });

  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    t.userId.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    (t.department && t.department.toLowerCase().includes(teacherSearch.toLowerCase()))
  );

  const filteredClasses = classes.filter(c =>
    c.className.toLowerCase().includes(classSearch.toLowerCase()) ||
    c.subject.toLowerCase().includes(classSearch.toLowerCase()) ||
    (c.teacherName && c.teacherName.toLowerCase().includes(classSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">

      {/* Alert Notification Bar */}
      {alertMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-nm-enter transition-all ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50/95 border border-emerald-200/90 text-emerald-900'
              : 'bg-rose-50/95 border border-rose-200/90 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="nm-icon-btn p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}


      {/* ========================================================= */}
      {/* TAB 1: CLASSROOMS & TEACHER ASSIGNMENT */}
      {/* ========================================================= */}
      {tab === 'classrooms' && (
        <div className="space-y-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 nm-card p-4 sm:p-5 w-full">
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">Academic Classrooms</h2>
              <p className="text-xs text-slate-500">
                Create new classes, assign teachers, and monitor active geofences
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <ViewToggle viewMode={classViewMode} setViewMode={setClassViewMode} />
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search class or teacher..."
                  value={classSearch}
                  onChange={e => setClassSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 nm-input text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full"
                />
              </div>
              <button
                onClick={() => {
                  playClickSound();
                  resetClassForm();
                  setIsCreateClassOpen(true);
                }}
                className="px-3 py-1.5 nm-btn-primary text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition cursor-pointer shadow-sm w-full sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Class</span>
              </button>
            </div>
          </div>

          {classViewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClasses.map(cls => {
                const classStudentCount = students.filter(s => s.classId === cls.classId).length;
                return (
                  <div
                    key={cls.classId}
                    className="nm-card-interactive p-4 sm:p-5 flex flex-col justify-between"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                            {cls.year || 'Academic Class'} • {cls.semester}
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm mt-1.5">{cls.className}</h3>
                          <p className="text-xs text-slate-600 font-medium">{cls.subject}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              playClickSound();
                              handleOpenEditClass(cls);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 nm-btn rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Edit Classroom Details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClass(cls.classId, cls.className)}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-700 nm-btn-danger rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Delete Classroom"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Teacher Assignment Box */}
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-blue-600" /> Assigned Teacher:
                          </span>
                          <button
                            onClick={() => setAssigningClass(cls)}
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            {cls.teacherId ? 'Change' : 'Assign'}
                          </button>
                        </div>
                        <div className="mt-1">
                          {cls.teacherId ? (
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">
                                {cls.teacherName || cls.teacherId}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                ID: {cls.teacherId}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-amber-600 font-medium italic">
                              ⚠️ No Teacher Assigned
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Geofence & Students info */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 bg-slate-50 rounded border border-slate-100">
                          <span className="text-slate-400 block text-[10px]">Students</span>
                          <span className="font-semibold text-slate-800">
                            {classStudentCount} Enrolled
                          </span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded border border-slate-100">
                          <span className="text-slate-400 block text-[10px]">Geofence Radius</span>
                          <span className="font-semibold text-slate-800">
                            {cls.radius || 50}m Boundary
                          </span>
                        </div>
                      </div>

                      {/* Geofence Status toggle */}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <MapPin
                            className={`w-3.5 h-3.5 ${
                              cls.geofenceActive ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                          />
                          <span className="text-[11px] font-medium text-slate-600">
                            {cls.geofenceActive ? 'GPS Geofence Active' : 'Geofence Disabled'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleToggleGeofence(cls)}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded transition cursor-pointer ${
                            cls.geofenceActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {cls.geofenceActive ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="nm-card overflow-hidden w-full max-w-full">
              {/* Mobile View: Clean Responsive Cards (sm:hidden) */}
              <div className="block sm:hidden divide-y divide-slate-100">
                {filteredClasses.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">No classrooms found.</div>
                ) : (
                  filteredClasses.map(cls => (
                    <div key={cls.classId} className="p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold text-slate-900 text-sm tracking-tight">{cls.className}</div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${cls.geofenceActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                          {cls.geofenceActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Subject</span>
                          <span className="text-slate-700 font-medium truncate block">{cls.subject}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Teacher</span>
                          <span className="text-slate-700 font-medium truncate block">{cls.teacherName || 'Not Assigned'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Students</span>
                          <span className="text-slate-700 font-medium block">{students.filter(s => s.classId === cls.classId).length} Enrolled</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Boundary</span>
                          <span className="text-slate-700 font-medium block">{cls.radius || 50}m Radius</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50">
                        <button
                          type="button"
                          onClick={() => handleOpenEditClass(cls)}
                          className="text-blue-700 nm-btn font-semibold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClass(cls.classId, cls.className)}
                          className="text-rose-700 nm-btn-danger font-semibold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Tablet & Desktop View: Full Table (hidden sm:block) */}
              <div className="hidden sm:block overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs min-w-[550px]">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200/80 text-slate-500 font-semibold text-[11px]">
                      <th className="py-3.5 px-4">Class</th>
                      <th className="py-3.5 px-4">Subject</th>
                      <th className="py-3.5 px-4">Teacher</th>
                      <th className="py-3.5 px-4">Students</th>
                      <th className="py-3.5 px-4">Geofence</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClasses.map(cls => (
                      <tr key={cls.classId} className="hover:bg-slate-50/80 transition">
                        <td className="whitespace-nowrap py-3.5 px-4 font-bold text-slate-900">{cls.className}</td>
                        <td className="py-3.5 px-4 text-slate-600">{cls.subject}</td>
                        <td className="py-3.5 px-4 text-slate-600">{cls.teacherName || 'Not Assigned'}</td>
                        <td className="py-3.5 px-4 text-slate-600">{students.filter(s => s.classId === cls.classId).length}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cls.geofenceActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                            {cls.geofenceActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenEditClass(cls)}
                            className="text-blue-700 nm-btn font-semibold text-[11px] px-2 py-1 rounded-md transition cursor-pointer"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: TEACHERS MANAGEMENT & CREATE TEACHER ID */}
      {/* ========================================================= */}
      {tab === 'teachers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 nm-card p-4 sm:p-5 w-full">
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">Faculty & Teacher Accounts</h2>
              <p className="text-xs text-slate-500">
                Create new Teacher IDs, configure login passwords, and track class allocations
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <ViewToggle viewMode={teachersViewMode} setViewMode={setTeachersViewMode} />
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search faculty..."
                  value={teacherSearch}
                  onChange={e => setTeacherSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 nm-input text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full"
                />
              </div>
              <button
                onClick={() => {
                  playClickSound();
                  setIsCreateTeacherOpen(true);
                }}
                className="px-3 py-1.5 nm-btn-primary text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition cursor-pointer shadow-sm w-full sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Teacher ID</span>
              </button>
            </div>
          </div>

          {teachersViewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeachers.map(teacher => {
                const assignedClassrooms = classes.filter(c => c.teacherId === teacher.userId);
                return (
                  <div
                    key={teacher.userId}
                    className="nm-card-interactive p-4 sm:p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                            {teacher.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{teacher.name}</h3>
                            <span className="text-[11px] font-mono text-slate-500">
                              ID: {teacher.userId}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            teacher.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {teacher.status}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-400 text-[11px]">Department:</span>
                          <span className="font-medium text-slate-800">
                            {teacher.department || 'Information Technology'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-400 text-[11px]">Password:</span>
                          <span className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {teacher.password || 'Class1'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-400 text-[11px]">Assigned Classes:</span>
                          <span className="font-bold text-blue-600">
                            {assignedClassrooms.length} Classroom(s)
                          </span>
                        </div>
                      </div>

                      {/* Assigned Class Pills */}
                      {assignedClassrooms.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {assignedClassrooms.map(ac => (
                            <span
                              key={ac.classId}
                              className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200"
                            >
                              {ac.className} ({ac.subject})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        onClick={() => handleToggleUserStatus(teacher.userId, teacher.name)}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          teacher.status === 'active'
                            ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {teacher.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            playClickSound();
                            handleOpenEditTeacher(teacher);
                          }}
                          className="text-blue-700 nm-btn text-[11px] font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Edit Teacher Profile"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(teacher.userId, teacher.name)}
                          className="text-rose-700 nm-btn-danger text-[11px] font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Delete Teacher Account"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="nm-card overflow-hidden w-full max-w-full">
              {/* Mobile View: Clean Responsive Cards (sm:hidden) */}
              <div className="block sm:hidden divide-y divide-slate-100">
                {filteredTeachers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">No teachers found.</div>
                ) : (
                  filteredTeachers.map(teacher => (
                    <div key={teacher.userId} className="p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 text-sm tracking-tight">{teacher.name}</div>
                          <div className="text-[11px] font-mono text-slate-500">{teacher.userId}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${teacher.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                          {teacher.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">
                        <span className="text-slate-400 text-[10px] block">Department</span>
                        <span className="font-medium text-slate-800">{teacher.department || 'Information Technology'}</span>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50">
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            handleOpenEditTeacher(teacher);
                          }}
                          className="text-blue-700 nm-btn font-semibold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(teacher.userId, teacher.name)}
                          className="text-rose-700 nm-btn-danger font-semibold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Tablet & Desktop View: Full Table (hidden sm:block) */}
              <div className="hidden sm:block overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200/80 text-slate-500 font-semibold text-[11px]">
                      <th className="py-3.5 px-4">Name & ID</th>
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTeachers.map(teacher => (
                      <tr key={teacher.userId} className="hover:bg-slate-50/80 transition">
                        <td className="whitespace-nowrap py-3.5 px-4">
                          <div className="font-bold text-slate-900">{teacher.name}</div>
                          <div className="text-[10px] font-mono text-slate-500">{teacher.userId}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{teacher.department || 'IT'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${teacher.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                            {teacher.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenEditTeacher(teacher)}
                            className="text-blue-700 nm-btn font-semibold text-[11px] px-2 py-1 rounded-md transition cursor-pointer"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: STUDENT DATA DIRECTORY */}
      {/* ========================================================= */}
      {tab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 nm-card p-4 sm:p-5 w-full">
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">Student Directory & Records</h2>
              <p className="text-xs text-slate-500">
                Maintain student enrollments, roll numbers, unique QR identities, and credentials
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <ViewToggle viewMode={studentsViewMode} setViewMode={setStudentsViewMode} />
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name or roll #..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 nm-input text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full"
                />
              </div>

              <select
                value={studentClassFilter}
                onChange={e => setStudentClassFilter(e.target.value)}
                className="px-3 py-1.5 nm-input text-xs text-slate-800 focus:outline-none w-full sm:w-auto"
              >
                <option value="ALL">All Classes</option>
                {classes.map(c => (
                  <option key={c.classId} value={c.classId}>
                    {c.className}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  playClickSound();
                  setEditingStudent(null);
                  setNewStudentId(`STU${100 + students.length + 1}`);
                  setNewStudentRoll(`${200 + students.length + 1}`);
                  setNewStudentClassId(classes[0]?.classId || '');
                  setIsAddStudentOpen(true);
                }}
                className="px-3 py-1.5 nm-btn-primary text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition cursor-pointer shadow-sm w-full sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Student</span>
              </button>
            </div>
          </div>

          {studentsViewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map(student => {
                const studentClass = classes.find(c => c.classId === student.classId);
                return (
                  <div key={student.userId} className="nm-card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{student.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">{student.userId}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${student.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                        {student.status}
                      </span>
                    </div>
                    <div className="mt-4 text-xs space-y-1">
                      <div>Roll: <span className="font-mono">{student.rollNo || 'N/A'}</span></div>
                      <div>Class: {studentClass?.className || 'Unassigned'}</div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => {
                          playClickSound();
                          setEditingStudent(student);
                          setNewStudentId(student.userId);
                          setNewStudentName(student.name);
                          setNewStudentRoll(student.rollNo || '');
                          setNewStudentClassId(student.classId || '');
                          setNewStudentPassword(student.password || 'Student123');
                          setIsAddStudentOpen(true);
                        }}
                        className="text-blue-700 nm-btn font-semibold text-[11px] px-2 py-1 rounded-md transition cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="nm-card overflow-hidden w-full max-w-full">
              {/* Mobile View: Clean Responsive Cards (sm:hidden) */}
              <div className="block sm:hidden divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">No students found.</div>
                ) : (
                  filteredStudents.map(student => {
                    const studentClass = classes.find(c => c.classId === student.classId);
                    return (
                      <div key={student.userId} className="p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-900 text-sm tracking-tight">{student.name}</div>
                            <div className="text-[11px] font-mono text-slate-500">{student.userId} • Roll #{student.rollNo || 'N/A'}</div>
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                              student.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {student.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400 text-[10px] block">Class</span>
                            <span className="font-medium text-slate-800 truncate block">{studentClass?.className || 'Unassigned'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Subject</span>
                            <span className="font-medium text-slate-800 truncate block">{studentClass?.subject || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50">
                          <button
                            type="button"
                            onClick={() => {
                              playClickSound();
                              setEditingStudent(student);
                              setNewStudentId(student.userId);
                              setNewStudentName(student.name);
                              setNewStudentRoll(student.rollNo || '');
                              setNewStudentClassId(student.classId || '');
                              setNewStudentPassword(student.password || 'Student123');
                              setIsAddStudentOpen(true);
                            }}
                            className="text-blue-700 nm-btn font-semibold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(student.userId, student.name)}
                            className="text-rose-700 nm-btn-danger font-semibold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Tablet & Desktop View: Full Table (hidden sm:block) */}
              <div className="hidden sm:block overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs min-w-[650px]">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200/80 text-slate-500 font-semibold text-[11px]">
                      <th className="py-3.5 px-4">Student Name & ID</th>
                      <th className="py-3.5 px-4">Roll No</th>
                      <th className="py-3.5 px-4">Enrolled Class</th>
                      <th className="py-3.5 px-4">QR Token</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map(student => {
                      const studentClass = classes.find(c => c.classId === student.classId);
                      return (
                        <tr key={student.userId} className="hover:bg-slate-50/80 transition">
                          <td className="whitespace-nowrap py-3.5 px-4">
                            <div className="font-bold text-slate-900">{student.name}</div>
                            <div className="text-[11px] font-mono text-slate-500">{student.userId}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                            #{student.rollNo || 'N/A'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-slate-800">
                              {studentClass?.className || 'Unassigned'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {studentClass?.subject}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                              {student.qrId || `QR_${student.userId}`}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                student.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {student.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  playClickSound();
                                  setEditingStudent(student);
                                  setNewStudentId(student.userId);
                                  setNewStudentName(student.name);
                                  setNewStudentRoll(student.rollNo || '');
                                  setNewStudentClassId(student.classId || '');
                                  setNewStudentPassword(student.password || 'Student123');
                                  setIsAddStudentOpen(true);
                                }}
                                className="text-blue-700 nm-btn font-semibold text-[11px] px-2 py-1 rounded-md transition cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleToggleUserStatus(student.userId, student.name)}
                                className="text-slate-600 nm-btn font-medium text-[11px] px-2 py-1 rounded-md transition cursor-pointer"
                              >
                                {student.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(student.userId, student.name)}
                                className="text-rose-700 nm-btn-danger font-semibold text-[11px] px-2 py-1 rounded-md transition cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: CAMPUS GEOFENCE MASTER */}
      {/* ========================================================= */}
      {tab === 'geofence' && (
        <div className="space-y-6">
          <div className="nm-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 tracking-tight">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Campus Geofence Master & Real-Time Validation
                </h2>
                <p className="text-xs text-slate-500">
                  Manage geographical boundaries for each classroom. Attendance QR scan only passes
                  when student is physically located within the configured boundary.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {classes.map(cls => (
                <div
                  key={cls.classId}
                  className="nm-card-interactive p-4 sm:p-5 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{cls.className}</h4>
                      <p className="text-xs text-slate-500">{cls.classroomName || 'Theory Hall'}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cls.geofenceActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {cls.geofenceActive ? 'Active Geofence' : 'Disabled'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[11px]">Latitude:</span>
                      <span className="font-mono text-slate-800">{cls.latitude ?? 19.076}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[11px]">Longitude:</span>
                      <span className="font-mono text-slate-800">{cls.longitude ?? 72.8777}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[11px]">Radius:</span>
                      <span className="font-bold text-slate-900">{cls.radius ?? 50} meters</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleGeofence(cls)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded transition cursor-pointer ${
                        cls.geofenceActive
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {cls.geofenceActive ? 'Turn Off Geofence' : 'Turn On Geofence'}
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Radius: {cls.radius || 50}m
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: LIVE SESSIONS & LOGS */}
      {/* ========================================================= */}
      {tab === 'activity' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 nm-card p-4 sm:p-5 w-full">
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">Attendance Session Logs</h2>
              <p className="text-xs text-slate-500">
                Live inspection of attendance sessions generated by teachers
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={activityDateFilter}
                onChange={e => setActivityDateFilter(e.target.value)}
                className="nm-input text-xs px-3 py-1.5"
              />
              <button
                onClick={() => setActivityDateFilter('')}
                className="nm-btn text-xs px-2 py-1.5"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="nm-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200/80 text-slate-500 font-semibold text-[11px]">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Time</th>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4">Class</th>
                    <th className="py-3.5 px-4">Teacher</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions
                    .filter(s => activityDateFilter === '' || s.date === activityDateFilter)
                    .map(s => {
                      const sessionClass = classes.find(c => c.classId === s.classId);
                      const sessionTeacher = teachers.find(t => t.userId === s.teacherId);
                      return (
                        <tr key={s.sessionId} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 font-mono text-slate-600">{s.date}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-800">{s.startTime}</td>
                          <td className="py-3.5 px-4 text-slate-900 font-medium">{s.subject}</td>
                          <td className="py-3.5 px-4 text-slate-600">{sessionClass?.className || s.classId}</td>
                          <td className="py-3.5 px-4 text-slate-600">{sessionTeacher?.name || s.teacherId}</td>
                          <td className="py-3.5 px-4">
                             <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                               {s.status.toUpperCase()}
                             </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE CLASSROOM & ASSIGN TEACHER */}
      {/* ========================================================= */}
      {isCreateClassOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Create New Classroom</h3>
                  <p className="text-xs text-slate-500">Assign to faculty & setup geofence</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateClassOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Classroom Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SE IT - Div A"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Computing & DevOps"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Academic Year</label>
                  <select
                    value={newYear}
                    onChange={e => setNewYear(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="1st Year">1st Year (FE)</option>
                    <option value="2nd Year">2nd Year (SE)</option>
                    <option value="3rd Year">3rd Year (TE)</option>
                    <option value="4th Year">4th Year (BE)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Semester</label>
                  <select
                    value={newSemester}
                    onChange={e => setNewSemester(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Semester III">Semester III</option>
                    <option value="Semester IV">Semester IV</option>
                    <option value="Semester V">Semester V</option>
                    <option value="Semester VI">Semester VI</option>
                    <option value="Semester VII">Semester VII</option>
                    <option value="Semester VIII">Semester VIII</option>
                  </select>
                </div>
              </div>

              {/* Assign to Teacher */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Assign Classroom to Teacher
                </label>
                <select
                  value={newTeacherId}
                  onChange={e => setNewTeacherId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="">-- Assign Later --</option>
                  {teachers.map(t => (
                    <option key={t.userId} value={t.userId}>
                      {t.name} ({t.userId}) - {t.department || 'Faculty'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Classroom Geofence Coordinates */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> Geofence Boundary
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={isLocating}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>{isLocating ? 'Locating...' : 'Use My Current GPS'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500">Latitude</label>
                    <input
                      type="text"
                      value={newLat}
                      onChange={e => setNewLat(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Longitude</label>
                    <input
                      type="text"
                      value={newLng}
                      onChange={e => setNewLng(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500">
                    Radius Limit: {newRadius} meters
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={newRadius}
                    onChange={e => setNewRadius(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateClassOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition cursor-pointer shadow-xs"
                >
                  Create & Save Classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT CLASSROOM */}
      {/* ========================================================= */}
      {isEditClassOpen && editingClass && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-4 sm:p-6 border border-slate-200 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Edit Classroom Details</h3>
                  <p className="text-xs text-slate-500">Update class info, assigned teacher & geofence</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditClassOpen(false);
                  setEditingClass(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditClass} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Classroom Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SE IT - Div A"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Computing & DevOps"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Academic Year</label>
                  <select
                    value={newYear}
                    onChange={e => setNewYear(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="1st Year">1st Year (FE)</option>
                    <option value="2nd Year">2nd Year (SE)</option>
                    <option value="3rd Year">3rd Year (TE)</option>
                    <option value="4th Year">4th Year (BE)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Semester</label>
                  <select
                    value={newSemester}
                    onChange={e => setNewSemester(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Semester I">Semester I</option>
                    <option value="Semester II">Semester II</option>
                    <option value="Semester III">Semester III</option>
                    <option value="Semester IV">Semester IV</option>
                    <option value="Semester V">Semester V</option>
                    <option value="Semester VI">Semester VI</option>
                    <option value="Semester VII">Semester VII</option>
                    <option value="Semester VIII">Semester VIII</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Division</label>
                  <input
                    type="text"
                    value={newDivision}
                    onChange={e => setNewDivision(e.target.value)}
                    placeholder="e.g. A"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Room / Venue</label>
                  <input
                    type="text"
                    value={newClassroomName}
                    onChange={e => setNewClassroomName(e.target.value)}
                    placeholder="e.g. Room 201 (Theory Hall)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Assign to Teacher */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Assigned Faculty / Teacher
                </label>
                <select
                  value={newTeacherId}
                  onChange={e => setNewTeacherId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="">-- No Teacher Assigned --</option>
                  {teachers.map(t => (
                    <option key={t.userId} value={t.userId}>
                      {t.name} ({t.userId}) - {t.department || 'Faculty'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Classroom Geofence Coordinates */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> Geofence Boundary
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={isLocating}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>{isLocating ? 'Locating...' : 'Use My Current GPS'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500">Latitude</label>
                    <input
                      type="text"
                      value={newLat}
                      onChange={e => setNewLat(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Longitude</label>
                    <input
                      type="text"
                      value={newLng}
                      onChange={e => setNewLng(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500">
                    Radius Limit: {newRadius} meters
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={newRadius}
                    onChange={e => setNewRadius(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteClass(editingClass.classId, editingClass.className)}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Class</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditClassOpen(false);
                      setEditingClass(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition cursor-pointer shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE TEACHER ID */}
      {/* ========================================================= */}
      {isCreateTeacherOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Create New Teacher ID</h3>
                  <p className="text-xs text-slate-500">Provide faculty credentials</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateTeacherOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Teacher ID (Login User ID) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Teacher2 or Prof_Patil"
                  value={newTeacherIdInput}
                  onChange={e => setNewTeacherIdInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Teacher Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Sneha Deshmukh"
                  value={newTeacherName}
                  onChange={e => setNewTeacherName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Information Technology"
                  value={newTeacherDept}
                  onChange={e => setNewTeacherDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Login Password *</label>
                <input
                  type="text"
                  required
                  value={newTeacherPassword}
                  onChange={e => setNewTeacherPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateTeacherOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition cursor-pointer shadow-xs"
                >
                  Create Teacher Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT TEACHER */}
      {/* ========================================================= */}
      {isEditTeacherOpen && editingTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Edit Teacher Profile</h3>
                  <p className="text-xs text-slate-500">Update credentials and department info</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditTeacherOpen(false);
                  setEditingTeacher(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTeacher} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Teacher ID (System Key)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingTeacher.userId}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-mono opacity-80 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Teacher Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Sneha Deshmukh"
                  value={newTeacherName}
                  onChange={e => setNewTeacherName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Information Technology"
                  value={newTeacherDept}
                  onChange={e => setNewTeacherDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Email / Contact</label>
                <input
                  type="email"
                  placeholder="e.g. teacher@college.edu"
                  value={newTeacherEmail}
                  onChange={e => setNewTeacherEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Login Password *</label>
                <input
                  type="text"
                  required
                  value={newTeacherPassword}
                  onChange={e => setNewTeacherPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteUser(editingTeacher.userId, editingTeacher.name)}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditTeacherOpen(false);
                      setEditingTeacher(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition cursor-pointer shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ASSIGN TEACHER TO CLASSROOM */}
      {/* ========================================================= */}
      {assigningClass && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Assign Teacher to {assigningClass.className}
                </h3>
                <p className="text-xs text-slate-500">Select faculty member for this subject</p>
              </div>
              <button
                onClick={() => setAssigningClass(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                {teachers.map(teacher => {
                  const isAssigned = assigningClass.teacherId === teacher.userId;
                  return (
                    <button
                      key={teacher.userId}
                      onClick={() => handleAssignTeacher(assigningClass.classId, teacher.userId)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                        isAssigned
                          ? 'border-blue-600 bg-blue-50/60 text-blue-950'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">{teacher.name}</div>
                        <div className="text-[11px] text-slate-500">
                          ID: {teacher.userId} • {teacher.department || 'Faculty'}
                        </div>
                      </div>
                      {isAssigned && (
                        <span className="text-[11px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {assigningClass.teacherId && (
                <div className="pt-2">
                  <button
                    onClick={() => handleAssignTeacher(assigningClass.classId, '')}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    Unassign Current Teacher
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REGISTER / EDIT STUDENT */}
      {/* ========================================================= */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingStudent ? 'Edit Student Details' : 'Register New Student'}
                  </h3>
                  <p className="text-xs text-slate-500">Student enrollment & QR code token</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddStudentOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Student ID *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingStudent}
                  value={newStudentId}
                  onChange={e => setNewStudentId(e.target.value)}
                  placeholder="e.g. STU107"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 font-mono disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                  placeholder="e.g. Rohit Sharma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={newStudentRoll}
                    onChange={e => setNewStudentRoll(e.target.value)}
                    placeholder="e.g. 207"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Enrolled Class</label>
                  <select
                    value={newStudentClassId}
                    onChange={e => setNewStudentClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    {classes.map(c => (
                      <option key={c.classId} value={c.classId}>
                        {c.className}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Login Password</label>
                <input
                  type="text"
                  value={newStudentPassword}
                  onChange={e => setNewStudentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition cursor-pointer shadow-xs"
                >
                  {editingStudent ? 'Save Changes' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
