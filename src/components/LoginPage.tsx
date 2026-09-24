import React, { useState } from 'react';
import { AuthService } from '../services/authService';
import { StorageService } from '../services/storageService';
import { User } from '../types';
import {
  QrCode,
  UserCheck,
  GraduationCap,
  Lock,
  User as UserIcon,
  LogIn,
  Sparkles,
  AlertCircle,
  Users
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [roleTab, setRoleTab] = useState<'teacher' | 'student'>('teacher');
  const [idInput, setIdInput] = useState<string>('Teacher1');
  const [passwordInput, setPasswordInput] = useState<string>('Class1');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const allUsers = StorageService.getUsers();
  const availableStudents = allUsers.filter(u => u.role === 'student');
  const availableTeachers = allUsers.filter(u => u.role === 'teacher');

  const handleRoleTabChange = (role: 'teacher' | 'student') => {
    setRoleTab(role);
    setErrorMessage('');
    if (role === 'teacher') {
      setIdInput('Teacher1');
      setPasswordInput('Class1');
    } else {
      setIdInput('STU101');
      setPasswordInput('Student123');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const res = AuthService.login(idInput, passwordInput, roleTab);
    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleSelectAccount = (user: User) => {
    setRoleTab(user.role);
    setIdInput(user.rollNo || user.userId);
    setPasswordInput(user.password || (user.role === 'teacher' ? 'Class1' : 'Student123'));
    setErrorMessage('');
  };

  const handleQuickLogin = (user: User) => {
    setRoleTab(user.role);
    const pass = user.password || (user.role === 'teacher' ? 'Class1' : 'Student123');
    const res = AuthService.login(user.userId, pass, user.role);
    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl max-w-md w-full overflow-hidden relative z-10 p-6 sm:p-8 transition-colors duration-200">
        {/* Title Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-md mb-3 text-white">
            <QrCode className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">QR Attendance Portal</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Digital Student Attendance Management System</p>
        </div>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
          <button
            type="button"
            onClick={() => handleRoleTabChange('teacher')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition min-h-[40px] ${
              roleTab === 'teacher'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Teacher Login
          </button>
          <button
            type="button"
            onClick={() => handleRoleTabChange('student')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition min-h-[40px] ${
              roleTab === 'student'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Student Login
          </button>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {roleTab === 'teacher' ? 'Teacher ID / Email' : 'Student ID or Roll No'}
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={idInput}
                onChange={e => setIdInput(e.target.value)}
                placeholder={roleTab === 'teacher' ? 'e.g. Teacher1' : 'e.g. STU101 or 101'}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="Enter password..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition"
          >
            <LogIn className="w-4 h-4" /> Sign In to {roleTab === 'teacher' ? 'Teacher Portal' : 'Student Portal'}
          </button>
        </form>

        {/* Quick User Selection Panel */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-500" /> Select Registered Account
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">1-Click Auto Fill</span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
            {roleTab === 'teacher' ? (
              availableTeachers.map(t => (
                <div
                  key={t.userId}
                  className="p-2.5 bg-slate-50 hover:bg-blue-50/60 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs transition group cursor-pointer"
                  onClick={() => handleSelectAccount(t)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white leading-tight">{t.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">ID: {t.userId} • Pass: {t.password || 'Class1'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickLogin(t);
                    }}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg transition shrink-0"
                  >
                    Sign In
                  </button>
                </div>
              ))
            ) : (
              availableStudents.map(s => (
                <div
                  key={s.userId}
                  className="p-2.5 bg-slate-50 hover:bg-blue-50/60 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs transition group cursor-pointer"
                  onClick={() => handleSelectAccount(s)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white leading-tight">
                        {s.name} <span className="text-[10px] font-semibold text-slate-500">(Roll #{s.rollNo})</span>
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">ID: {s.userId} • Pass: {s.password || 'Student123'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickLogin(s);
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition shrink-0"
                  >
                    Sign In
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
