import React from 'react';
import { Menu, LogOut, User as UserIcon, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import NotificationDropdown from './NotificationDropdown';

const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Successfully logged out', 'info');
    } catch (err) {
      showToast('Error during logout', 'error');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'GL';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left side: Hamburger button on mobile & page heading context */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Genomics Core Laboratory</p>
            <p className="text-sm font-medium text-slate-800">Next-Generation Sequencing Platform</p>
          </div>
        </div>

        {/* Right side: Notifications, User Profile Chip & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notification Alert Center */}
          <NotificationDropdown />

          {/* User profile capsule */}
          <div className="flex items-center gap-3 bg-slate-50/80 border border-slate-200 px-3 py-1.5 rounded-xl">
            {/* Avatar circle */}
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm shadow-teal-600/30">
              {getInitials(user?.name)}
            </div>

            {/* Name, Org and Role */}
            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 leading-none">{user?.name}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-100/70 text-teal-800 border border-teal-200 uppercase">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span className="truncate max-w-[150px]">{user?.organization || 'Genomics Facility'}</span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
