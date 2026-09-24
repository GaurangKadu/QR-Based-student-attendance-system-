import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { AuthService } from '../services/authService';
import { StorageService } from '../services/storageService';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Users,
  QrCode,
  FileText,
  LogOut,
  RotateCcw,
  Sun,
  Moon,
  UserCheck,
  GraduationCap,
  Menu,
  X,
  ChevronRight,
  Clock,
  BookOpen
} from 'lucide-react';

interface SidebarProps {
  currentUser: User;
  onUserChange: (user: User | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  onUserChange,
  activeTab,
  setActiveTab,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    onUserChange(null);
  };

  const handleResetData = () => {
    StorageService.resetToDemo();
    window.location.reload();
  };

  const isTeacher = currentUser.role === 'teacher';

  const teacherNavItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Student Management', icon: Users },
    { id: 'attendance', label: 'Class Management', icon: BookOpen },
    { id: 'reports', label: 'Reports & Analytics', icon: FileText },
  ];

  const studentNavItems = [
    { id: 'student_dash', label: 'My QR Attendance Pass', icon: QrCode },
  ];

  const navItems = isTeacher ? teacherNavItems : studentNavItems;

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Navigation Bar with Date, Day, Time */}
      <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3.5 px-4 flex items-center justify-between sticky top-0 z-40 transition-colors shadow-sm gap-2">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle Menu"
          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center font-bold shadow-sm transition shrink-0"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Live Date, Day & Time display */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-[11px] sm:text-xs font-bold shadow-2xs min-w-0">
          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="truncate">
            {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="text-blue-500 font-extrabold">•</span>
          <span className="font-mono text-blue-600 dark:text-blue-400 font-extrabold shrink-0">
            {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* User Role Pill */}
        <span className="text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 shrink-0">
          {currentUser.role}
        </span>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}

      {/* Vertical Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 bottom-0 z-50 lg:z-30 w-72 lg:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out min-h-screen ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 flex flex-col h-full overflow-y-auto no-scrollbar">
          {/* Sidebar Header: Logo & Theme Toggle Button Embedded Inside */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl text-white shadow-md shadow-blue-500/20 shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <span className="font-black text-base text-slate-900 dark:text-white tracking-tight">QR-ATTENDANCE</span>
                <span className="block text-[10px] font-bold text-blue-600 dark:text-blue-400">IT ENGG PORTAL</span>
              </div>
            </div>

            {/* Theme Toggle Button Inside Sidebar Header */}
            <button
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl min-h-[38px] min-w-[38px] flex items-center justify-center transition border border-slate-200 dark:border-slate-700"
            >
              {theme === 'light' ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          </div>

          {/* User Profile Card inside Sidebar */}
          <div className="mt-5 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  isTeacher
                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                    : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {isTeacher ? <UserCheck className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  {currentUser.role} {currentUser.rollNo ? `(#${currentUser.rollNo})` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="mt-6 flex-1 space-y-1">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2">
              Navigation Menu
            </p>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold flex items-center justify-between transition min-h-[44px] ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-white/80" />}
                </button>
              );
            })}
          </div>

          {/* Bottom Sidebar Controls */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 mt-auto">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={toggleTheme}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition min-h-[40px]"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-4 h-4 text-indigo-600" /> Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" /> Light Mode
                  </>
                )}
              </button>

              <button
                onClick={handleResetData}
                title="Reset Demo Data"
                className="p-2.5 bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-amber-700 dark:text-slate-400 rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition min-h-[40px]"
            >
              <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" /> Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
