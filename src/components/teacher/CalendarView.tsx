import React, { useState } from 'react';
import { StorageService } from '../../services/storageService';
import { ClassItem, AttendanceSession } from '../../types';
import { SessionQRModal } from './SessionQRModal';
import { ClassDetailModal } from './ClassDetailModal';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  QrCode,
  Clock,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [classes] = useState<ClassItem[]>(StorageService.getClasses());
  const [sessions] = useState<AttendanceSession[]>(StorageService.getSessions());
  
  const [selectedClassForModal, setSelectedClassForModal] = useState<ClassItem | null>(null);
  const [selectedSessionModal, setSelectedSessionModal] = useState<AttendanceSession | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Days in month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    daysArray.push(new Date(year, month, d));
  }

  const handleStartSession = (cls: ClassItem) => {
    const sess = StorageService.startSession(cls.classId, cls.subject, 'Teacher1');
    setSelectedSessionModal(sess);
    setShowQRModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20 shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Class Schedule & Attendance Calendar
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              IT Engineering Department • Interactive Session Calendar
            </p>
          </div>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={prevMonth}
            className="p-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl transition shadow-2xs"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white px-3 min-w-[130px] text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl transition shadow-2xs"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-center font-black text-xs text-slate-400 uppercase tracking-wider">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-2 pt-3">
          {daysArray.map((dateObj, idx) => {
            if (!dateObj) {
              return <div key={`empty-${idx}`} className="min-h-[100px] bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-transparent"></div>;
            }

            const dateStr = dateObj.toISOString().split('T')[0];
            const daySessions = sessions.filter(s => s.date === dateStr);
            const isToday = new Date().toDateString() === dateObj.toDateString();

            return (
              <div
                key={dateStr}
                className={`min-h-[110px] p-2 sm:p-3 rounded-2xl border transition flex flex-col justify-between ${
                  isToday
                    ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-400 dark:border-blue-600 shadow-sm'
                    : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black ${isToday ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-xs' : 'text-slate-700 dark:text-slate-300'}`}>
                    {dateObj.getDate()}
                  </span>
                  {daySessions.length > 0 && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {daySessions.length} sess
                    </span>
                  )}
                </div>

                {/* Session pills */}
                <div className="space-y-1 mt-2 overflow-y-auto max-h-[70px] no-scrollbar">
                  {daySessions.map(sess => {
                    const cls = classes.find(c => c.classId === sess.classId);
                    return (
                      <div
                        key={sess.sessionId}
                        onClick={() => cls && setSelectedClassForModal(cls)}
                        className="text-[10px] font-bold p-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-800 dark:text-slate-200 truncate cursor-pointer shadow-2xs transition"
                        title={`${cls?.className || 'Class'} - ${sess.subject}`}
                      >
                        <span className="text-blue-600 dark:text-blue-400 mr-1 font-mono">{sess.startTime}</span>
                        {cls?.className || sess.subject}
                      </div>
                    );
                  })}
                  {daySessions.length === 0 && (
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center py-2">
                      No sessions
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Class Quick-Start List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" /> Today's Scheduled Classes & Quick Start
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Click any class to manage attendance</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {classes.map(cls => (
            <div
              key={cls.classId}
              onClick={() => setSelectedClassForModal(cls)}
              className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 cursor-pointer transition flex flex-col justify-between space-y-3 group"
            >
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  {cls.year || '2nd Year'}
                </span>
                <h3 className="font-black text-slate-900 dark:text-white text-sm mt-2 group-hover:text-blue-600 transition">
                  {cls.className}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{cls.subject}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" /> {cls.radius || 50}m radius
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartSession(cls);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" /> Start QR
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Class Detail Modal */}
      {selectedClassForModal && (
        <ClassDetailModal
          cls={selectedClassForModal}
          activeSession={null}
          onClose={() => setSelectedClassForModal(null)}
          onStartSession={(cls) => {
            setSelectedClassForModal(null);
            handleStartSession(cls);
          }}
        />
      )}

      {/* Session QR Modal */}
      {showQRModal && selectedSessionModal && (
        <SessionQRModal
          session={selectedSessionModal}
          onClose={() => {
            setShowQRModal(false);
            setSelectedSessionModal(null);
          }}
        />
      )}
    </div>
  );
};
