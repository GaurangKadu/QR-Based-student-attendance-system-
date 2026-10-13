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
  Plus,
  Radio
} from 'lucide-react';
import { playClickSound, playPopSound } from '../../utils/soundEffects';
import { ViewToggle } from '../common/ViewToggle';

interface TeacherDashboardOverviewProps {
  onNavigate: (tab: string, classId?: string) => void;
}

export const TeacherDashboardOverview: React.FC<TeacherDashboardOverviewProps> = () => {
  const [classes, setClasses] = useState<ClassItem[]>(StorageService.getClasses());
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(
    StorageService.getSessions().find(s => s.status === 'active') || null
  );
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

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
    playClickSound();
    const sess = StorageService.startSession(cls.classId, cls.subject, currentUser?.userId || 'Teacher1');
    setActiveSession(sess);
    setSelectedSessionForModal(sess);
    setShowSessionModal(true);
    refreshData();
  };

  const handleStartSessionFromModal = (cls: ClassItem) => {
    playClickSound();
    const sess = StorageService.startSession(cls.classId, cls.subject, currentUser?.userId || 'Teacher1');
    setActiveSession(sess);
    setSelectedClassForModal(null);
    setSelectedSessionForModal(sess);
    setShowSessionModal(true);
    refreshData();
  };

  const handleViewSessionQR = (sess: AttendanceSession) => {
    playClickSound();
    setSelectedSessionForModal(sess);
    setShowSessionModal(true);
  };

  const handleOpenClassModal = (cls: ClassItem) => {
    playPopSound();
    setSelectedClassForModal(cls);
  };

  return (
    <div className="space-y-6 animate-nm-enter">
      {/* Teacher Name & Overview Header */}
      <div className="nm-card p-5 sm:p-6 border border-white/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/25 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {teacherName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              IT Engineering Department • Classroom Attendance Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setShowCreateModal(true);
            }}
            className="nm-btn-primary px-5 py-2.5 min-h-[40px] text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create New Class
          </button>

          {activeSession && (
            <button
              type="button"
              onClick={() => handleViewSessionQR(activeSession)}
              className="px-5 py-2.5 min-h-[40px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition shrink-0 cursor-pointer"
            >
              <QrCode className="w-4 h-4" /> View Active Session QR
            </button>
          )}
        </div>
      </div>

      {/* Class-Wise Attendance Cards Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" /> Class-Wise Attendance & Geofence Status
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">Click any classroom to view analytical board and student roster</span>
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        </div>
      </div>

      {/* Class-Wise Cards Grid */}
      {viewMode === 'card' ? (
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
                onClick={() => handleOpenClassModal(cls)}
                className="nm-card-interactive p-5 sm:p-6 border border-white/80 flex flex-col justify-between space-y-4 cursor-pointer group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {cls.year || '2nd Year'}
                    </span>

                    {hasActiveSess && (
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1.5 animate-pulse">
                        <Radio className="w-3 h-3 text-emerald-600" /> Live • Code: {activeSession?.dailyCode || 'Active'}
                      </span>
                    )}
                  </div>

                  <h3 className="font-black text-slate-900 text-base mt-2 tracking-tight group-hover:text-blue-600 transition">
                    {cls.classroomName || cls.className}
                  </h3>
                  <p className="text-xs font-bold text-slate-600 mt-0.5">{cls.subject}</p>

                  {/* Geofence info */}
                  <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Radius: {cls.radius || 50}m</span>
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      cls.geofenceActive !== false
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {cls.geofenceActive !== false ? 'Fence Active' : 'Fence Disabled'}
                    </span>
                  </div>

                  {/* Clickable Stats Grid */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <div
                      onClick={() => handleOpenClassModal(cls)}
                      className="p-3 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl transition cursor-pointer text-left"
                    >
                      <p className="text-[10px] font-extrabold text-emerald-700 uppercase">Present</p>
                      <p className="text-lg font-black text-emerald-600 mt-0.5">{presentCount}</p>
                    </div>

                    <div
                      onClick={() => handleOpenClassModal(cls)}
                      className="p-3 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200 rounded-xl transition cursor-pointer text-left"
                    >
                      <p className="text-[10px] font-extrabold text-rose-700 uppercase">Absent</p>
                      <p className="text-lg font-black text-rose-600 mt-0.5">{absentCount}</p>
                    </div>

                    <div
                      onClick={() => handleOpenClassModal(cls)}
                      className="p-3 bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200 rounded-xl transition cursor-pointer text-left"
                    >
                      <p className="text-[10px] font-extrabold text-blue-700 uppercase">Total</p>
                      <p className="text-lg font-black text-blue-600 mt-0.5">{totalCount}</p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => handleStartSession(cls)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
                      hasActiveSess
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'nm-btn text-slate-800 hover:text-blue-600'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-blue-600" />
                    {hasActiveSess ? 'View Session QR' : 'Start Attendance & QR'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="nm-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200/80 text-slate-500 font-semibold text-[11px]">
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Geofence</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classes.map(cls => (
                  <tr key={cls.classId} className="hover:bg-slate-50/80 transition" onClick={() => handleOpenClassModal(cls)}>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{cls.className}</td>
                    <td className="py-3.5 px-4 text-slate-600">{cls.subject}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cls.geofenceActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                        {cls.geofenceActive !== false ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStartSession(cls); }}
                        className="text-blue-700 nm-btn font-semibold text-[11px] px-2 py-1 rounded-md transition cursor-pointer"
                      >
                        Start Session
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
