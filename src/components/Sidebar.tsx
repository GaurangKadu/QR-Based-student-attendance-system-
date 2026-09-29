import React, { useState } from 'react';
import { User } from '../types';
import { AuthService } from '../services/authService';
import {
  BookOpen,
  MapPin,
  Users,
  FileText,
  LogOut,
  QrCode,
  Menu,
  X,
  LayoutDashboard,
  Scan
} from 'lucide-react';

interface SidebarProps {
  currentUser: User;
  onUserChange: (user: User | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenScanner?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  onUserChange,
  activeTab,
  setActiveTab,
  onOpenScanner,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    AuthService.logout();
    onUserChange(null);
  };

  const isTeacher = currentUser.role === 'teacher';

  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    action?: () => void;
  }

  const teacherNavItems: NavItem[] = [
    { id: 'attendance', label: 'Attendance', icon: BookOpen },
    { id: 'geofence', label: 'Geofence Settings', icon: MapPin },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const studentNavItems: NavItem[] = [
    { id: 'student_dash', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'scan_qr',
      label: 'Scan QR',
      icon: Scan,
      action: () => {
        if (onOpenScanner) onOpenScanner();
      },
    },
  ];

  const navItems = isTeacher ? teacherNavItems : studentNavItems;

  const handleNavClick = (item: NavItem) => {
    if (item.action) {
      item.action();
    } else {
      setActiveTab(item.id);
    }
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-slate-900 text-white p-3 px-4 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle Navigation"
            className="p-1.5 text-slate-300 hover:text-white rounded-lg focus:outline-none"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <span className="font-bold text-sm tracking-tight text-white">QR Attendance</span>
          </div>
        </div>

        <span className="text-[11px] font-medium text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700 capitalize">
          {currentUser.role}
        </span>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 bottom-0 z-50 lg:z-30 w-60 bg-slate-900 text-slate-200 flex flex-col justify-between transition-transform duration-200 h-screen shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Header Branding */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 rounded-lg text-white">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight text-white">QR Attendance</h1>
                <p className="text-[11px] text-slate-400">IT Engineering System</p>
              </div>
            </div>
          </div>

          {/* User Brief Info */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/40">
            <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 capitalize">
              {currentUser.role} {currentUser.rollNo ? `• Roll #${currentUser.rollNo}` : ''}
            </p>
          </div>

          {/* Nav Links */}
          <nav className="p-3 space-y-1">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
              Menu
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition text-left cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Logout */}
        <div className="p-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-3 py-2 rounded-lg text-xs font-medium text-rose-300 hover:text-white hover:bg-rose-950/50 flex items-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
