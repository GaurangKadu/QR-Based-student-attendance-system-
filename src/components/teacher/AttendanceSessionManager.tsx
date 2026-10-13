import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/storageService';
import { ClassItem, AttendanceSession } from '../../types';
import { SessionQRModal } from './SessionQRModal';
import { BookOpen, QrCode } from 'lucide-react';

export const AttendanceSessionManager: React.FC<{ onNavigate: (tab: string, classId?: string) => void }> = () => {
  const [classes, setClasses] = useState<ClassItem[]>(StorageService.getClasses());
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.classId || '');
  const [selectedSubject, setSelectedSubject] = useState<string>(classes[0]?.subject || '');
  
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>(
    StorageService.getSessions().filter(s => s.status === 'active')
  );
  const [selectedActiveSession, setSelectedActiveSession] = useState<AttendanceSession | null>(null);
  const [showSessionModal, setShowSessionModal] = useState<boolean>(false);

  useEffect(() => {
    const handleUpdate = () => {
      const updatedClasses = StorageService.getClasses();
      setClasses(updatedClasses);
      setActiveSessions(StorageService.getSessions().filter(s => s.status === 'active'));
    };
    window.addEventListener('qr_attendance_updated', handleUpdate);
    return () => window.removeEventListener('qr_attendance_updated', handleUpdate);
  }, []);

  const refreshData = () => {
    setClasses(StorageService.getClasses());
    setActiveSessions(StorageService.getSessions().filter(s => s.status === 'active'));
  };

  const handleClassChange = (cId: string) => {
    setSelectedClassId(cId);
    const cls = classes.find(c => c.classId === cId);
    if (cls) {
      setSelectedSubject(cls.subject);
    }
  };

  const handleStartAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;
    const cls = classes.find(c => c.classId === selectedClassId);
    const subj = selectedSubject || cls?.subject || 'Lecture';
    const sess = StorageService.startSession(selectedClassId, subj, 'Teacher1');
    setActiveSessions(StorageService.getSessions().filter(s => s.status === 'active'));
    setSelectedActiveSession(sess);
    setShowSessionModal(true);
    refreshData();
  };

  const handleDeactivate = (sessionId: string) => {
    StorageService.endSession(sessionId);
    refreshData();
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-700" /> Attendance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Start an attendance session for your class.
          </p>
        </div>
      </div>

      {/* Primary Session Start Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <form onSubmit={handleStartAttendance} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Class
              </label>
              <select
                value={selectedClassId}
                onChange={e => handleClassChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
              >
                {classes.map(c => (
                  <option key={c.classId} value={c.classId}>
                    {c.className} ({c.subject})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                placeholder="Enter Subject Name"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                required
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="submit"
              className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition cursor-pointer flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>START ATTENDANCE</span>
            </button>
          </div>
        </form>
      </div>

      {/* Active Sessions List */}
      {activeSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Active Classes ({activeSessions.length})
          </h2>
          {activeSessions.map(session => {
            const cls = StorageService.getClassById(session.classId);
            return (
              <div key={session.sessionId} className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900">
                <div>
                  <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] block">
                    Active Session Started at {session.startTime}
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {cls?.className || session.classId} — {session.subject}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Code: {session.dailyCode} | Room: {cls?.classroomName || 'N/A'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedActiveSession(session);
                      setShowSessionModal(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeactivate(session.sessionId)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Session QR Modal */}
      {showSessionModal && selectedActiveSession && (
        <SessionQRModal
          session={selectedActiveSession}
          onClose={() => {
            setShowSessionModal(false);
            setSelectedActiveSession(null);
            refreshData();
          }}
        />
      )}
    </div>
  );
};
