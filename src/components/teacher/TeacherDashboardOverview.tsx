import React, { useState } from 'react';
import { StorageService } from '../../services/storageService';
import { AuthService } from '../../services/authService';
import { SessionQRModal } from './SessionQRModal';
import { ClassDetailModal } from './ClassDetailModal';
import { CreateClassModal } from './CreateClassModal';
import { User, ClassItem, AttendanceSession } from '../../types';
import {
  QrCode,
  GraduationCap,
  BookOpen,
  MapPin,
  Plus
} from 'lucide-react';

interface TeacherDashboardOverviewProps {
  onNavigate: (tab: string, classId?: string) => void;
}

export const TeacherDashboardOverview: React.FC<TeacherDashboardOverviewProps> = () => {
  const [classes, setClasses] = useState<ClassItem[]>(StorageService.getClasses());
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(
    StorageService.getSessions().find(s => s.status === 'active') || null
  );

  const [showSessionModal, setShowSessionModal] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<AttendanceSession | null>(null);
  const [selectedClassForModal, setSelectedClassForModal] = useState<ClassItem | null>(null);

  const currentUser = AuthService.getCurrentUser() || StorageService.getUserById('Teacher1');
  const teacherName = currentUser?.name || 'Prof. Rajesh Sharma';

  const refreshData = () => {
    setClasses(StorageService.getClasses());
    setActiveSession(StorageService.getSessions().find(s => s.status === 'active') || null);
  };

  const handleStartSession = (cls: ClassItem) => {
    const sess = StorageService.startSession(cls.classId, cls.subject, currentUser?.userId || 'Teacher1');
    setActiveSession(sess);
    setSelectedSessionForModal(sess);
    setShowSessionModal(true);
    refreshData();
  };

  const handleStartSessionFromModal = (cls: ClassItem) => {
    const sess = StorageService.startSession(cls.classId, cls.subject, currentUser?.userId || 'Teacher1');
    setActiveSession(sess);
    setSelectedClassForModal(null);
    setSelectedSessionForModal(sess);
    setShowSessionModal(true);
    refreshData();
  };

  const handleViewSessionQR = (sess: AttendanceSession) => {
    setSelectedSessionForModal(sess);
    setShowSessionModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Teacher Name & Overview Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {teacherName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              IT Engineering Department • Classroom Attendance Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-3 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create New Class
          </button>

          {activeSession && (
            <button
              type="button"
              onClick={() => handleViewSessionQR(activeSession)}
              className="px-5 py-3 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition shrink-0 cursor-pointer"
            >
              <QrCode className="w-4 h-4" /> View Active Session QR
            </button>
          )}
        </div>
      </div>

      {/* Class-Wise Attendance Cards Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" /> Class-Wise Attendance & Geofence Status
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">Click any classroom to open student analytical board and roster</span>
      </div>

      {/* Class-Wise Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes.map(cls => {
          const students = StorageService.getStudents().filter(s => s.classId === cls.classId && s.status === 'active');
          const totalCount = students.length;

          const sessionRecords = activeSession && activeSession.classId === cls.classId
            ? StorageService.getAttendanceForSession(activeSession.sessionId)
            : StorageService.getAttendanceRecords().filter(r => r.classId === cls.classId);

          const presentIds = new Set(sessionRecords.filter(r => r.status === 'PRESENT').map(r => r.studentId));
          const presentStudents = students.filter(s => presentIds.has(s.userId));
          const absentStudents = students.filter(s => !presentIds.has(s.userId));

          const presentCount = presentStudents.length;
          const absentCount = absentStudents.length;
          const hasActiveSess = activeSession?.classId === cls.classId;

          return (
            <div
              key={cls.classId}
              onClick={() => setSelectedClassForModal(cls)}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {cls.year || '2nd Year'}
                  </span>

                  {hasActiveSess && (
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-xs shadow-emerald-400"></span> Live • Code: {activeSession?.dailyCode || 'Active'}
                    </span>
                  )}
                </div>

                <h3 className="font-black text-slate-900 dark:text-white text-base mt-2 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  {cls.classroomName || cls.className}
                </h3>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">{cls.subject}</p>

                {/* Geofence info */}
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Radius: {cls.radius || 50}m</span>
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    cls.geofenceActive !== false
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  }`}>
                    {cls.geofenceActive !== false ? 'Fence Active' : 'Fence Disabled'}
                  </span>
                </div>

                {/* Clickable Stats Grid */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center" onClick={(e) => e.stopPropagation()}>
                  <div
                    onClick={() => setSelectedClassForModal(cls)}
                    className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 rounded-2xl transition cursor-pointer text-left"
                  >
                    <p className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase">Present</p>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-300 mt-0.5">{presentCount}</p>
                  </div>

                  <div
                    onClick={() => setSelectedClassForModal(cls)}
                    className="p-3 bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-800 rounded-2xl transition cursor-pointer text-left"
                  >
                    <p className="text-[10px] font-extrabold text-rose-700 dark:text-rose-400 uppercase">Absent</p>
                    <p className="text-lg font-black text-rose-600 dark:text-rose-300 mt-0.5">{absentCount}</p>
                  </div>

                  <div
                    onClick={() => setSelectedClassForModal(cls)}
                    className="p-3 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/70 border border-blue-200 dark:border-blue-800 rounded-2xl transition cursor-pointer text-left"
                  >
                    <p className="text-[10px] font-extrabold text-blue-700 dark:text-blue-400 uppercase">Total</p>
                    <p className="text-lg font-black text-blue-600 dark:text-blue-300 mt-0.5">{totalCount}</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => handleStartSession(cls)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
                    hasActiveSess
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  {hasActiveSess ? 'View Session QR' : 'Start Attendance & QR'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Class */}
      {showCreateModal && (
        <CreateClassModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            refreshData();
          }}
        />
      )}

      {/* Modal: Class Detail / Student Analytical Board & Management */}
      {selectedClassForModal && (
        <ClassDetailModal
          cls={selectedClassForModal}
          activeSession={activeSession}
          onClose={() => {
            setSelectedClassForModal(null);
            refreshData();
          }}
          onStartSession={handleStartSessionFromModal}
        />
      )}

      {/* Modal: Session QR */}
      {showSessionModal && (selectedSessionForModal || activeSession) && (
        <SessionQRModal
          session={selectedSessionForModal || activeSession!}
          onClose={() => {
            setShowSessionModal(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
};
