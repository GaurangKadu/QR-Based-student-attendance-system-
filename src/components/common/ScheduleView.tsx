import React, { useState, useEffect } from 'react';
import { User, TimeTableLecture, DayOfWeek, ClassItem } from '../../types';
import { StorageService } from '../../services/storageService';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User as UserIcon,
  BookOpen,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { playPopSound, playDeleteSound } from '../../utils/soundEffects';

interface ScheduleViewProps {
  currentUser: User;
}

const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const ScheduleView: React.FC<ScheduleViewProps> = ({ currentUser }) => {
  const [timetable, setTimetable] = useState<TimeTableLecture[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'weekly' | 'date'>('weekly');
  const [classesList, setClassesList] = useState<ClassItem[]>([]);
  const [teachersList, setTeachersList] = useState<User[]>([]);

  // Modal state for Admin adding lectures
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDay, setNewDay] = useState<DayOfWeek>('Monday');
  const [newSpecificDate, setNewSpecificDate] = useState<string>('');
  const [newStartTime, setNewStartTime] = useState<string>('09:00 AM');
  const [newEndTime, setNewEndTime] = useState<string>('10:00 AM');
  const [newSubject, setNewSubject] = useState<string>('');
  const [newSubjectCode, setNewSubjectCode] = useState<string>('');
  const [newClassId, setNewClassId] = useState<string>('');
  const [newRoom, setNewRoom] = useState<string>('Room 201');
  const [newLectureType, setNewLectureType] = useState<'Theory' | 'Practical Lab' | 'Tutorial'>('Theory');
  const [newTeacherName, setNewTeacherName] = useState<string>('');
  const [newColorTag, setNewColorTag] = useState<'blue' | 'indigo' | 'emerald' | 'amber' | 'purple' | 'cyan' | 'rose'>('blue');

  const loadData = () => {
    setTimetable(StorageService.getTimeTable());
    setClassesList(StorageService.getClasses());
    setTeachersList(StorageService.getTeachers());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('qr_attendance_updated', handleUpdate);
    return () => window.removeEventListener('qr_attendance_updated', handleUpdate);
  }, []);

  const isAdmin = currentUser.role === 'admin';
  const isTeacher = currentUser.role === 'teacher';
  const isStudent = currentUser.role === 'student';

  // Filter lectures based on role
  const getFilteredLectures = () => {
    let list = timetable;

    if (isStudent) {
      // Students see lectures for their classId
      list = list.filter(l => l.classId === currentUser.classId);
    } else if (isTeacher) {
      // Teachers see lectures where they are assigned or their department
      list = list.filter(l => l.teacherName?.toLowerCase().includes(currentUser.name.toLowerCase()));
    }

    if (viewMode === 'weekly') {
      return list.filter(l => !l.specificDate && l.dayOfWeek === selectedDay);
    } else {
      // Date specific mode or matching day
      const d = new Date(selectedDate);
      const dayName = DAYS_OF_WEEK[(d.getDay() + 6) % 7]; // convert JS Sunday=0 to Monday=0
      return list.filter(l => {
        if (l.specificDate) return l.specificDate === selectedDate;
        return l.dayOfWeek === dayName;
      });
    }
  };

  const handleAddLecture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject || !newClassId) {
      alert('Please fill in Subject and Class.');
      return;
    }

    const targetClass = classesList.find(c => c.classId === newClassId);
    const newLecture: TimeTableLecture = {
      id: `TT_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dayOfWeek: newDay,
      specificDate: newSpecificDate || undefined,
      startTime: newStartTime,
      endTime: newEndTime,
      subject: newSubject,
      subjectCode: newSubjectCode || 'IT-SUB',
      classId: newClassId,
      className: targetClass ? targetClass.className : newClassId,
      room: newRoom,
      lectureType: newLectureType,
      teacherName: newTeacherName || targetClass?.teacherName || currentUser.name,
      colorTag: newColorTag,
    };

    StorageService.addTimeTableLecture(newLecture);
    playPopSound();
    setIsAddModalOpen(false);
    // Reset form
    setNewSubject('');
    setNewSubjectCode('');
    setNewSpecificDate('');
    loadData();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this scheduled lecture?')) {
      playDeleteSound();
      StorageService.deleteTimeTableLecture(id);
      loadData();
    }
  };

  const activeLectures = getFilteredLectures();

  const getColorClasses = (tag?: string) => {
    switch (tag) {
      case 'emerald':
        return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      case 'amber':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'purple':
        return 'bg-purple-50 border-purple-200 text-purple-900';
      case 'indigo':
        return 'bg-indigo-50 border-indigo-200 text-indigo-900';
      case 'cyan':
        return 'bg-cyan-50 border-cyan-200 text-cyan-900';
      case 'rose':
        return 'bg-rose-50 border-rose-200 text-rose-900';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-sm">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Academic Schedule & Timetable</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAdmin
                  ? 'Manage and allot student and teacher timetables.'
                  : isTeacher
                  ? 'View your assigned lecture schedule and classroom allotments.'
                  : 'View your class lecture timetable and assigned subjects (Read-Only).'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Allot Timetable Lecture</span>
            </button>
          )}
        </div>
      </div>

      {/* Controls & Day Selector */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => { playPopSound(); setViewMode('weekly'); }}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewMode === 'weekly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Schedule
          </button>
          <button
            onClick={() => { playPopSound(); setViewMode('date'); }}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewMode === 'date' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Specific Date View
          </button>
        </div>

        {viewMode === 'weekly' ? (
          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {DAYS_OF_WEEK.map(day => (
              <button
                key={day}
                onClick={() => { playPopSound(); setSelectedDay(day); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                  selectedDay === day
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-600">Select Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Read Only Notice for Student / Teacher */}
      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800">
            Timetable is alloted by the System Administrator. This view is read-only.
          </p>
        </div>
      )}

      {/* Lectures List / Calendar Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            {viewMode === 'weekly' ? `${selectedDay} Lectures` : `Lectures for ${selectedDate}`}
            <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
              {activeLectures.length} Scheduled
            </span>
          </h2>
        </div>

        {activeLectures.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
            <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No Lectures Allotted</h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAdmin
                ? 'No lectures scheduled for this time/day. Click "Allot Timetable Lecture" above to assign classes.'
                : 'You have no lectures or classes scheduled for this day.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeLectures.map(lecture => (
              <div
                key={lecture.id}
                className={`p-5 rounded-2xl border shadow-xs transition hover:shadow-md relative overflow-hidden flex flex-col justify-between ${getColorClasses(
                  lecture.colorTag
                )}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/80 border border-black/10 mb-1.5">
                        {lecture.lectureType} • {lecture.subjectCode}
                      </span>
                      <h3 className="text-base font-bold tracking-tight">{lecture.subject}</h3>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(lecture.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-100/80 rounded-lg transition cursor-pointer"
                        title="Delete Lecture"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 text-xs opacity-90 mt-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 opacity-70 shrink-0" />
                      <span className="font-semibold">{lecture.startTime} - {lecture.endTime}</span>
                      {lecture.specificDate && (
                        <span className="text-[10px] bg-white/60 px-1.5 py-0.5 rounded font-mono">
                          {lecture.specificDate}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 opacity-70 shrink-0" />
                      <span>Class: <strong className="font-semibold">{lecture.className}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 opacity-70 shrink-0" />
                      <span>Location: {lecture.room}</span>
                    </div>
                    {lecture.teacherName && (
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-3.5 h-3.5 opacity-70 shrink-0" />
                        <span>Teacher: {lecture.teacherName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Allot Timetable Modal */}
      {isAdmin && isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-nm-enter max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Allot Timetable Lecture</h2>
            <p className="text-xs text-slate-500 mb-5">
              Assign a lecture subject, time, classroom, and teacher for students and faculty.
            </p>

            <form onSubmit={handleAddLecture} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Day of Week</label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value as DayOfWeek)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Specific Date (Optional)</label>
                  <input
                    type="date"
                    value={newSpecificDate}
                    onChange={(e) => setNewSpecificDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="text"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="text"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject Name</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. Data Structures"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject Code</label>
                  <input
                    type="text"
                    value={newSubjectCode}
                    onChange={(e) => setNewSubjectCode(e.target.value)}
                    placeholder="e.g. IT401"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Allot Class</label>
                  <select
                    value={newClassId}
                    onChange={(e) => setNewClassId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
                    required
                  >
                    <option value="">Select Class</option>
                    {classesList.map(c => (
                      <option key={c.classId} value={c.classId}>{c.className} ({c.subject})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Allot Teacher</label>
                  <select
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
                  >
                    <option value="">Select Teacher</option>
                    {teachersList.map(t => (
                      <option key={t.userId} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room / Location</label>
                  <input
                    type="text"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lecture Type</label>
                  <select
                    value={newLectureType}
                    onChange={(e) => setNewLectureType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
                  >
                    <option value="Theory">Theory</option>
                    <option value="Practical Lab">Practical Lab</option>
                    <option value="Tutorial">Tutorial</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Color Theme</label>
                  <select
                    value={newColorTag}
                    onChange={(e) => setNewColorTag(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
                  >
                    <option value="blue">Blue</option>
                    <option value="indigo">Indigo</option>
                    <option value="emerald">Emerald</option>
                    <option value="amber">Amber</option>
                    <option value="purple">Purple</option>
                    <option value="cyan">Cyan</option>
                    <option value="rose">Rose</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Save & Allot Timetable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
