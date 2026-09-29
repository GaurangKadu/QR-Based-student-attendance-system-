import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/storageService';
import { ClassItem, AttendanceSession } from '../../types';
import { SessionQRModal } from './SessionQRModal';
import { BookOpen, QrCode, Plus, X } from 'lucide-react';

export const AttendanceSessionManager: React.FC<{ onNavigate: (tab: string, classId?: string) => void }> = () => {
  const [classes, setClasses] = useState<ClassItem[]>(StorageService.getClasses());
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.classId || '');
  const [selectedSubject, setSelectedSubject] = useState<string>(classes[0]?.subject || '');
  
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(
    StorageService.getSessions().find(s => s.status === 'active') || null
  );
  const [showSessionModal, setShowSessionModal] = useState<boolean>(false);
  const [showAddClassModal, setShowAddClassModal] = useState<boolean>(false);

  // New Class Form State
  const [newClassName, setNewClassName] = useState('');
  const [newYear, setNewYear] = useState('2nd Year');
  const [newSemester, setNewSemester] = useState('Semester IV');
  const [newDivision, setNewDivision] = useState('A');
  const [newSubject, setNewSubject] = useState('');
  const [newVenue, setNewVenue] = useState('Computer Lab 1');

  useEffect(() => {
    const handleUpdate = () => {
      const updatedClasses = StorageService.getClasses();
      setClasses(updatedClasses);
      setActiveSession(StorageService.getSessions().find(s => s.status === 'active') || null);
    };
    window.addEventListener('qr_attendance_updated', handleUpdate);
    return () => window.removeEventListener('qr_attendance_updated', handleUpdate);
  }, []);

  const refreshData = () => {
    setClasses(StorageService.getClasses());
    setActiveSession(StorageService.getSessions().find(s => s.status === 'active') || null);
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
    setActiveSession(sess);
    setShowSessionModal(true);
    refreshData();
  };

  const handleSaveNewClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName || !newSubject) return;

    const classId = `CLASS_${newClassName.replace(/\s+/g, '_').toUpperCase()}`;
    const newClassObj: ClassItem = {
      classId,
      className: newClassName,
      year: newYear,
      semester: newSemester,
      division: newDivision,
      subject: newSubject,
      totalStudents: 60,
      classroomName: newVenue,
      latitude: 19.0760,
      longitude: 72.8777,
      radius: 50,
      geofenceActive: true,
    };

    StorageService.addClass(newClassObj);
    const updated = StorageService.getClasses();
    setClasses(updated);
    setSelectedClassId(classId);
    setSelectedSubject(newSubject);
    setShowAddClassModal(false);
    setNewClassName('');
    setNewSubject('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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

        <button
          type="button"
          onClick={() => setShowAddClassModal(true)}
          className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>ADD CLASS</span>
        </button>
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

            {activeSession && (
              <button
                type="button"
                onClick={() => setShowSessionModal(true)}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <span>View Active QR</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Active Session Indicator */}
      {activeSession && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-xs text-emerald-900">
          <div>
            <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] block">
              Active Session Running
            </span>
            <p className="font-semibold mt-0.5">
              {StorageService.getClassById(activeSession.classId)?.className} — {activeSession.subject}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSessionModal(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
          >
            Show Attendance QR
          </button>
        </div>
      )}

      {/* Session QR Modal */}
      {showSessionModal && activeSession && (
        <SessionQRModal
          session={activeSession}
          onClose={() => {
            setShowSessionModal(false);
            refreshData();
          }}
        />
      )}

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg max-w-md w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Add New Class</h2>
              <button
                type="button"
                onClick={() => setShowAddClassModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Class Name</label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  placeholder="e.g. TE IT - Div B"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Year</label>
                  <input
                    type="text"
                    value={newYear}
                    onChange={e => setNewYear(e.target.value)}
                    placeholder="3rd Year"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Division</label>
                  <input
                    type="text"
                    value={newDivision}
                    onChange={e => setNewDivision(e.target.value)}
                    placeholder="B"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default Subject</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  placeholder="e.g. Database Management Systems"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Classroom / Venue</label>
                <input
                  type="text"
                  value={newVenue}
                  onChange={e => setNewVenue(e.target.value)}
                  placeholder="e.g. Lab 402"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
                >
                  CREATE CLASS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

