import React, { useState } from 'react';
import { AuthService } from '../services/authService';
import { StorageService } from '../services/storageService';
import { User } from '../types';
import { QrCode, AlertCircle, Sparkles } from 'lucide-react';
import { playClickSound, playPopSound, playSuccessSound, playErrorSound } from '../utils/soundEffects';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [roleTab, setRoleTab] = useState<'teacher' | 'student' | 'admin'>('teacher');
  const [idInput, setIdInput] = useState<string>('Teacher1');
  const [passwordInput, setPasswordInput] = useState<string>('Class1');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const allUsers = StorageService.getUsers();
  const availableStudents = allUsers.filter(u => u.role === 'student');
  const availableTeachers = allUsers.filter(u => u.role === 'teacher');
  const availableAdmins = allUsers.filter(u => u.role === 'admin');

  const handleRoleTabChange = (role: 'teacher' | 'student' | 'admin') => {
    playPopSound();
    setRoleTab(role);
    setErrorMessage('');
    if (role === 'teacher') {
      setIdInput('Teacher1');
      setPasswordInput('Class1');
    } else if (role === 'student') {
      setIdInput('STU101');
      setPasswordInput('Student123');
    } else {
      setIdInput('Admin1');
      setPasswordInput('Admin@12345');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const res = AuthService.login(idInput, passwordInput, roleTab);
    if (res.success && res.user) {
      playSuccessSound();
      onLoginSuccess(res.user);
    } else {
      playErrorSound();
      setErrorMessage(res.message);
    }
  };

  const handleSelectAccount = (user: User) => {
    playClickSound();
    setRoleTab(user.role);
    setIdInput(user.rollNo || user.userId);
    setPasswordInput(user.password || (user.role === 'admin' ? 'Admin@12345' : user.role === 'teacher' ? 'Class1' : 'Student123'));
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4">
      <div className="nm-card max-w-sm w-full p-6 sm:p-8 animate-nm-pop border border-white/80">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl mb-3 shadow-[4px_4px_12px_rgba(37,99,235,0.35),-2px_-2px_8px_rgba(255,255,255,0.8)]">
            <QrCode className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center justify-center gap-1.5">
            <span>QR Attendance</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Digital Student Attendance Management System
          </p>
        </div>

        {/* Role Toggle with Mild Inset Well */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 nm-inset rounded-xl mb-5 text-xs font-medium">
          <button
            type="button"
            onClick={() => handleRoleTabChange('teacher')}
            className={`py-2 px-1 rounded-lg transition-all text-center cursor-pointer ${
              roleTab === 'teacher'
                ? 'nm-tab-active text-blue-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Teacher
          </button>
          <button
            type="button"
            onClick={() => handleRoleTabChange('student')}
            className={`py-2 px-1 rounded-lg transition-all text-center cursor-pointer ${
              roleTab === 'student'
                ? 'nm-tab-active text-blue-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => handleRoleTabChange('admin')}
            className={`py-2 px-1 rounded-lg transition-all text-center cursor-pointer ${
              roleTab === 'admin'
                ? 'nm-tab-active text-blue-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50/80 border border-rose-200/80 rounded-xl text-rose-700 text-xs flex items-center gap-2 shadow-xs animate-nm-enter">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {roleTab === 'admin' ? 'Admin ID' : roleTab === 'teacher' ? 'User ID' : 'Student ID or Roll No'}
            </label>
            <input
              type="text"
              required
              value={idInput}
              onChange={e => setIdInput(e.target.value)}
              placeholder={roleTab === 'admin' ? 'Admin1' : roleTab === 'teacher' ? 'Teacher1' : 'STU101'}
              className="w-full px-3.5 py-2.5 nm-input text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 nm-input text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 nm-btn-primary font-semibold text-xs tracking-wide rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>LOGIN</span>
          </button>
        </form>

        {/* Demo Account Credentials Quick-Select */}
        <div className="mt-6 pt-4 border-t border-slate-200/60">
          <p className="text-[11px] font-semibold text-slate-500 mb-2.5 uppercase tracking-wider">
            Quick Demo Accounts:
          </p>
          <div className="space-y-1.5 text-xs">
            {roleTab === 'admin' ? (
              (availableAdmins.length > 0 ? availableAdmins : [{ userId: 'Admin1', name: 'System Administrator', role: 'admin', password: 'Admin@12345' } as User]).map(a => (
                <button
                  key={a.userId}
                  type="button"
                  onClick={() => handleSelectAccount(a)}
                  className="w-full text-left p-2.5 nm-btn rounded-xl flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">{a.name}</span>
                    <span className="text-[9px] bg-slate-800 text-white font-semibold px-1.5 py-0.5 rounded">ADMIN</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono font-medium">ID: {a.userId}</span>
                </button>
              ))
            ) : roleTab === 'teacher' ? (
              availableTeachers.map(t => (
                <button
                  key={t.userId}
                  type="button"
                  onClick={() => handleSelectAccount(t)}
                  className="w-full text-left p-2.5 nm-btn rounded-xl flex items-center justify-between transition cursor-pointer"
                >
                  <span className="font-medium text-slate-800">{t.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono font-medium">ID: {t.userId}</span>
                </button>
              ))
            ) : (
              availableStudents.slice(0, 3).map(s => (
                <button
                  key={s.userId}
                  type="button"
                  onClick={() => handleSelectAccount(s)}
                  className="w-full text-left p-2.5 nm-btn rounded-xl flex items-center justify-between transition cursor-pointer"
                >
                  <span className="font-medium text-slate-800">{s.name} <span className="text-slate-500 font-normal">(Roll #{s.rollNo})</span></span>
                  <span className="text-[11px] text-slate-500 font-mono font-medium">ID: {s.userId}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
