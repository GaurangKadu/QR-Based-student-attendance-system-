import React, { useState } from 'react';
import { User } from '../types';
import { AuthService } from '../services/authService';
import { StorageService } from '../services/storageService';
import { useTheme } from '../context/ThemeContext';
import {
  GraduationCap,
  LogOut,
  UserCheck,
  RotateCcw,
  QrCode,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onUserChange,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    AuthService.logout();
    onUserChange(null);
    setMobileMenuOpen(false);
  };

  const handleResetDemoData = () => {
    if (window.confirm('Reset all demo data back to initial default state?')) {
      StorageService.resetToDemo();
      window.location.reload();
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Title */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-sm text-white shrink-0">
              <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
                  QR-ATTENDANCE
                </span>
                <span className="hidden xs:inline-block bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  IT ENGINEERING
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
                Digital Student Attendance Management System
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {currentUser ? (
              <>
                {/* User Profile Badge */}
                <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 px-3 py-1.5 rounded-xl">
                  <div className={`p-1 rounded-lg ${currentUser.role === 'teacher' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'}`}>
                    {currentUser.role === 'teacher' ? <UserCheck className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold leading-tight text-slate-900 dark:text-slate-100">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{currentUser.role} {currentUser.rollNo ? `(#${currentUser.rollNo})` : ''}</p>
                  </div>
                </div>

                {/* Reset Data Button */}
                <button
                  onClick={handleResetDemoData}
                  title="Reset Demo Data"
                  className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 min-h-[40px] bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>

                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="sm:hidden p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                Portal Sign-In
              </span>
            )}
          </div>
        </div>

        {/* Mobile Expandable Drawer */}
        {mobileMenuOpen && currentUser && (
          <div className="sm:hidden border-t border-slate-200 dark:border-slate-800 py-3 space-y-3">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${currentUser.role === 'teacher' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'}`}>
                  {currentUser.role === 'teacher' ? <UserCheck className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{currentUser.role} {currentUser.rollNo ? `(#${currentUser.rollNo})` : ''}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
