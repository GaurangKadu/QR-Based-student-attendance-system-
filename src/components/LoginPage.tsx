import React, { useState } from 'react';
import { AuthService } from '../services/authService';
import { StorageService } from '../services/storageService';
import { User } from '../types';
import { QrCode, AlertCircle } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs max-w-sm w-full p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-2.5 bg-slate-900 text-white rounded-lg mb-3">
            <QrCode className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">QR Attendance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Digital Student Attendance Management System
          </p>
        </div>

        {/* Role Toggle */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg mb-5 text-xs font-medium">
          <button
            type="button"
            onClick={() => handleRoleTabChange('teacher')}
            className={`py-1.5 rounded-md transition cursor-pointer ${
              roleTab === 'teacher'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Teacher Login
          </button>
          <button
            type="button"
            onClick={() => handleRoleTabChange('student')}
            className={`py-1.5 rounded-md transition cursor-pointer ${
              roleTab === 'student'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student Login
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {roleTab === 'teacher' ? 'User ID' : 'Student ID or Roll No'}
            </label>
            <input
              type="text"
              required
              value={idInput}
              onChange={e => setIdInput(e.target.value)}
              placeholder={roleTab === 'teacher' ? 'Teacher1' : 'STU101'}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-normal text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-normal text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition cursor-pointer"
          >
            LOGIN
          </button>
        </form>

        {/* Demo Account Credentials Quick-Select */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <p className="text-[11px] font-medium text-slate-500 mb-2">
            Default Demo Accounts (Click to fill):
          </p>
          <div className="space-y-1 text-xs">
            {roleTab === 'teacher' ? (
              availableTeachers.map(t => (
                <button
                  key={t.userId}
                  type="button"
                  onClick={() => handleSelectAccount(t)}
                  className="w-full text-left p-2 hover:bg-slate-50 rounded border border-slate-100 flex items-center justify-between transition cursor-pointer"
                >
                  <span className="font-medium text-slate-800">{t.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono">ID: {t.userId}</span>
                </button>
              ))
            ) : (
              availableStudents.slice(0, 3).map(s => (
                <button
                  key={s.userId}
                  type="button"
                  onClick={() => handleSelectAccount(s)}
                  className="w-full text-left p-2 hover:bg-slate-50 rounded border border-slate-100 flex items-center justify-between transition cursor-pointer"
                >
                  <span className="font-medium text-slate-800">{s.name} (Roll #{s.rollNo})</span>
                  <span className="text-[11px] text-slate-500 font-mono">ID: {s.userId}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
