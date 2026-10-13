import { useState, useEffect } from 'react';
import { User } from './types';
import { AuthService } from './services/authService';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './components/LoginPage';
import { AttendanceSessionManager } from './components/teacher/AttendanceSessionManager';
import { GeofenceSettingsView } from './components/teacher/GeofenceSettingsView';
import { StudentRosterView } from './components/teacher/StudentRosterView';
import { ReportsView } from './components/teacher/ReportsView';
import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentHistoryDashboard } from './components/student/StudentHistoryDashboard';
import { StudentQRScannerModal } from './components/student/StudentQRScannerModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ScheduleView } from './components/common/ScheduleView';
import {
  Clock,
  LayoutDashboard,
  Scan,
  History,
  Volume2,
  VolumeX
} from 'lucide-react';
import { testFirestoreConnection } from './lib/firebase';
import { soundEngine, playPopSound } from './utils/soundEffects';

export default function App() {

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('attendance');
  const [now, setNow] = useState<Date>(new Date());
  const [scannerModalOpen, setScannerModalOpen] = useState<boolean>(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(soundEngine.isMuted());

  useEffect(() => {
    const unsub = soundEngine.subscribe((muted) => setIsSoundMuted(muted));
    return unsub;
  }, []);

  const handleSoundToggle = () => {
    const next = soundEngine.toggleMute();
    setIsSoundMuted(next);
  };

  const handleTabChangeWithSound = (tab: string) => {
    playPopSound();
    setActiveTab(tab);
  };

  useEffect(() => {
    testFirestoreConnection();
    const user = AuthService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setActiveTab(
        user.role === 'admin'
          ? 'admin_classes'
          : user.role === 'student'
          ? 'student_dash'
          : 'attendance'
      );
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUserChange = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      setActiveTab(
        user.role === 'admin'
          ? 'admin_classes'
          : user.role === 'student'
          ? 'student_dash'
          : 'attendance'
      );
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased">
        <LoginPage onLoginSuccess={handleUserChange} />
      </div>
    );
  }

  const isAdmin = currentUser.role === 'admin';
  const isStudent = currentUser.role === 'student';
  const isTeacher = currentUser.role === 'teacher';

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-slate-900 font-sans antialiased flex flex-col lg:flex-row pb-16 lg:pb-0 w-full max-w-full overflow-x-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentUser={currentUser}
        onUserChange={handleUserChange}
        activeTab={activeTab}
        setActiveTab={handleTabChangeWithSound}
        onOpenScanner={() => setScannerModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60 w-full max-w-full overflow-x-hidden">
        {/* Header Bar */}
        <header className="hidden lg:flex items-center justify-between bg-white/90 backdrop-blur-xs border-b border-slate-200/80 px-6 py-3.5 sticky top-0 z-30 shadow-[0_2px_8px_rgba(164,177,196,0.15)]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 tracking-tight">QR Attendance</span>
            <span className="text-slate-300 text-xs">|</span>
            <span className="text-xs text-slate-500 font-normal">
              Digital Student Attendance Management System
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Audio Feedback Controller */}
            <button
              type="button"
              onClick={handleSoundToggle}
              className="nm-btn px-2.5 py-1.5 flex items-center gap-1.5 text-xs text-slate-700 font-medium transition cursor-pointer"
              title={isSoundMuted ? "Sound effects muted (Click to enable)" : "Sound effects enabled (Click to mute)"}
            >
              {isSoundMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-blue-600 animate-soft-pulse" />
              )}
              <span className="text-[11px] font-semibold">{isSoundMuted ? 'Muted' : 'Sound On'}</span>
            </button>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium px-2.5 py-1 rounded-lg bg-slate-100/70 border border-slate-200/60">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span>•</span>
              <span className="font-mono text-slate-800 tabular-nums">
                {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col min-h-0 p-2 sm:p-4 lg:p-6 w-full max-w-full mx-auto animate-nm-enter box-border overflow-x-hidden">
          {activeTab === 'schedule' ? (
            <ScheduleView currentUser={currentUser} />
          ) : isAdmin ? (
            <AdminDashboard
              currentUser={currentUser}
              activeSubTab={activeTab}
              onNavigateTab={handleTabChangeWithSound}
            />
          ) : isTeacher ? (
            <>
              {(activeTab === 'attendance' || activeTab === 'dashboard') && (
                <AttendanceSessionManager onNavigate={(tab) => handleTabChangeWithSound(tab)} />
              )}
              {activeTab === 'geofence' && <GeofenceSettingsView />}
              {activeTab === 'students' && <StudentRosterView />}
              {activeTab === 'reports' && <ReportsView />}
            </>
          ) : activeTab === 'student_history' ? (
            <StudentHistoryDashboard
              student={currentUser}
              onBackToDashboard={() => handleTabChangeWithSound('student_dash')}
            />
          ) : (
            <StudentDashboard
              student={currentUser}
              onOpenHistoryDashboard={() => handleTabChangeWithSound('student_history')}
              onOpenScannerModal={() => setScannerModalOpen(true)}
            />
          )}
        </main>

        {/* Student Scanner Modal Trigger */}
        {currentUser.role === 'student' && scannerModalOpen && (
          <StudentQRScannerModal
            student={currentUser}
            onClose={() => setScannerModalOpen(false)}
            onScanSuccess={() => {}}
          />
        )}


      </div>
    </div>
  );
}
