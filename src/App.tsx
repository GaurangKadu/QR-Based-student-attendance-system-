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
import {
  Clock,
  LayoutDashboard,
  Scan,
  History,
  BookOpen,
  MapPin,
  Users,
  FileText
} from 'lucide-react';
import { testFirestoreConnection } from './lib/firebase';

export default function App() {

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('attendance');
  const [now, setNow] = useState<Date>(new Date());
  const [scannerModalOpen, setScannerModalOpen] = useState<boolean>(false);

  useEffect(() => {
    testFirestoreConnection();
    const user = AuthService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setActiveTab(user.role === 'student' ? 'student_dash' : 'attendance');
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUserChange = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      setActiveTab(user.role === 'student' ? 'student_dash' : 'attendance');
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased">
        <LoginPage onLoginSuccess={handleUserChange} />
      </div>
    );
  }

  const isStudent = currentUser.role === 'student';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col lg:flex-row pb-16 lg:pb-0">
      {/* Sidebar Navigation */}
      <Sidebar
        currentUser={currentUser}
        onUserChange={handleUserChange}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenScanner={() => setScannerModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <header className="hidden lg:flex items-center justify-between bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-30">
          <div>
            <span className="text-sm font-bold text-slate-900">QR Attendance</span>
            <span className="text-slate-400 text-xs mx-2">|</span>
            <span className="text-xs text-slate-500 font-normal">
              Digital Student Attendance Management System
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span>•</span>
            <span className="font-mono text-slate-800">
              {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {currentUser.role === 'teacher' ? (
            <>
              {(activeTab === 'attendance' || activeTab === 'dashboard') && (
                <AttendanceSessionManager onNavigate={(tab) => setActiveTab(tab)} />
              )}
              {activeTab === 'geofence' && <GeofenceSettingsView />}
              {activeTab === 'students' && <StudentRosterView />}
              {activeTab === 'reports' && <ReportsView />}
            </>
          ) : activeTab === 'student_history' ? (
            <StudentHistoryDashboard
              student={currentUser}
              onBackToDashboard={() => setActiveTab('student_dash')}
            />
          ) : (
            <StudentDashboard
              student={currentUser}
              onOpenHistoryDashboard={() => setActiveTab('student_history')}
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

        {/* Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-3 py-1.5 flex items-center justify-around shadow-lg">
          {isStudent ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('student_dash')}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg cursor-pointer transition ${
                  activeTab === 'student_dash' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[10px]">Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => setScannerModalOpen(true)}
                className="flex flex-col items-center gap-1 py-1 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer transition -mt-3"
              >
                <Scan className="w-5 h-5" />
                <span className="text-[10px] font-bold">Scan QR</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('student_history')}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg cursor-pointer transition ${
                  activeTab === 'student_history' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <History className="w-5 h-5" />
                <span className="text-[10px]">History</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('attendance')}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg cursor-pointer transition ${
                  activeTab === 'attendance' || activeTab === 'dashboard' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span className="text-[10px]">Attendance</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('geofence')}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg cursor-pointer transition ${
                  activeTab === 'geofence' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <MapPin className="w-5 h-5" />
                <span className="text-[10px]">Geofence</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('students')}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg cursor-pointer transition ${
                  activeTab === 'students' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="text-[10px]">Students</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg cursor-pointer transition ${
                  activeTab === 'reports' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span className="text-[10px]">Reports</span>
              </button>
            </>
          )}
        </nav>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
            <p>QR Attendance • Digital Student Attendance Management System</p>
            <p className="font-medium text-slate-700">IT Engineering Department</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

