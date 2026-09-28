import React, { useState } from 'react';
import { StorageService } from '../../services/storageService';
import { ClassItem, AttendanceSession } from '../../types';
import { SessionQRModal } from './SessionQRModal';
import { ClassDetailModal } from './ClassDetailModal';
import { CreateClassModal } from './CreateClassModal';
import {
  BookOpen,
  Layers,
  QrCode,
  CheckCircle2,
  Sparkles,
  Plus
} from 'lucide-react';

export const AttendanceSessionManager: React.FC<{ onNavigate: (tab: string, classId?: string) => void }> = ({ onNavigate }) => {
  const [classes, setClasses] = useState<ClassItem[]>(StorageService.getClasses());
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(
    StorageService.getSessions().find(s => s.status === 'active') || null
  );
  const [showSessionModal, setShowSessionModal] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedClassForModal, setSelectedClassForModal] = useState<ClassItem | null>(null);

  const refreshData = () => {
    setClasses(StorageService.getClasses());
    setActiveSession(StorageService.getSessions().find(s => s.status === 'active') || null);
  };

  const handleStartSessionForClass = (e: React.MouseEvent, cls: ClassItem) => {
    e.stopPropagation();
    const sess = StorageService.startSession(cls.classId, cls.subject, 'Teacher1');
    setActiveSession(sess);
    setShowSessionModal(true);
    refreshData();
  };

  const handleStartSessionFromModal = (cls: ClassItem) => {
    const sess = StorageService.startSession(cls.classId, cls.subject, 'Teacher1');
    setActiveSession(sess);
    setSelectedClassForModal(null);
    setShowSessionModal(true);
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-400" /> Class Room Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Click any classroom card to open the student analytical board and student management roster.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Create New Class
          </button>

          {activeSession && (
            <button
              type="button"
              onClick={() => setShowSessionModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
            >
              <QrCode className="w-4 h-4" /> View Active Session QR
            </button>
          )}
        </div>
      </div>

      {/* Class Rooms List / Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes.map(cls => {
          const students = StorageService.getStudents().filter(s => s.classId === cls.classId);
          const total = students.length;
          
          const sessionRecords = activeSession && activeSession.classId === cls.classId
            ? StorageService.getAttendanceForSession(activeSession.sessionId)
            : StorageService.getAttendanceRecords().filter(r => r.classId === cls.classId);
          
          const presentIds = new Set(sessionRecords.filter(r => r.status === 'PRESENT').map(r => r.studentId));
          const present = presentIds.size;
          const absent = Math.max(0, total - present);
          const hasActiveSess = activeSession?.classId === cls.classId;

          return (
            <div
              key={cls.classId}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 group"
              onClick={() => setSelectedClassForModal(cls)}
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
                  {cls.className}
                </h3>

                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" /> {cls.subject}
                </p>

                {/* Statistics Box */}
                <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Present</p>
                    <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{present}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Absent</p>
                    <p className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5">{absent}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Capacity</p>
                    <p className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">{cls.totalStudents || total}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleStartSessionForClass(e, cls)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition min-h-[40px] cursor-pointer shadow-xs ${
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

      {/* Modal: Session QR Modal */}
      {showSessionModal && activeSession && (
        <SessionQRModal
          session={activeSession}
          onClose={() => {
            setShowSessionModal(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
};
