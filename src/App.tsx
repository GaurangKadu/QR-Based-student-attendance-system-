import { useState, useEffect } from 'react';
import { User } from './types';
import { AuthService } from './services/authService';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './components/LoginPage';
import { TeacherDashboardOverview } from './components/teacher/TeacherDashboardOverview';
import { StudentManagement } from './components/teacher/StudentManagement';
import { AttendanceSessionManager } from './components/teacher/AttendanceSessionManager';
import { ReportsView } from './components/teacher/ReportsView';
import { StudentDashboard } from './components/student/StudentDashboard';
import { Clock, ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [targetClassId, setTargetClassId] = useState<string | undefined>(undefined);
  const [now, setNow] = useState<Date>(new Date());

  const handleNavigate = (tab: string, classId?: string) => {
    setActiveTab(tab);
    setTargetClassId(classId);
  };

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setActiveTab(user.role === 'student' ? 'student_dash' : 'dashboard');
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUserChange = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      setActiveTab(user.role === 'student' ? 'student_dash' : 'dashboard');
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased transition-colors duration-200">
        <LoginPage onLoginSuccess={handleUserChange} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased flex flex-col lg:flex-row transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        currentUser={currentUser}
        onUserChange={handleUserChange}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Header Bar with Live Date, Day, Time */}
        <header className="hidden lg:flex items-center justify-end bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-8 py-3.5 sticky top-0 z-30 transition-colors shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Live Date, Day & Time Badge */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 px-3.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold shadow-2xs">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-blue-500 font-extrabold">•</span>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-extrabold">
                {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Tab Content Rendering */}
          {currentUser.role === 'teacher' ? (
            <>
              {activeTab === 'dashboard' && <TeacherDashboardOverview onNavigate={handleNavigate} />}
              {activeTab === 'students' && <StudentManagement initialClassId={targetClassId} />}
              {activeTab === 'attendance' && <AttendanceSessionManager onNavigate={handleNavigate} />}
              {activeTab === 'reports' && <ReportsView />}
            </>
          ) : (
            <StudentDashboard student={currentUser} />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 px-4 text-center text-xs text-slate-500 dark:text-slate-400 mt-auto transition-colors">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© 2026 QR Code Digital Student Attendance Management System</p>
            <p className="font-semibold text-blue-600 dark:text-blue-400">2nd-Year IT Engineering Mini Project</p>
          </div>
        </footer>
      </div>
    </div>
  );
};
