import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  TestTubes,
  Activity,
  Cpu,
  Binary,
  FileText,
  Users,
  Dna,
  X,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || 'requester';

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'lab_staff', 'requester'],
    },
    {
      to: '/requests',
      label: role === 'requester' ? 'My Requests' : 'Requests',
      icon: FileSpreadsheet,
      roles: ['admin', 'lab_staff', 'requester'],
    },
    {
      to: '/samples',
      label: role === 'requester' ? 'My Samples' : 'Samples',
      icon: TestTubes,
      roles: ['admin', 'lab_staff', 'requester'],
    },
    {
      to: '/qc',
      label: 'Quality Control',
      icon: Activity,
      roles: ['admin', 'lab_staff'],
    },
    {
      to: '/sequencing',
      label: 'Sequencing Runs',
      icon: Cpu,
      roles: ['admin', 'lab_staff'],
    },
    {
      to: '/analysis',
      label: 'Bioinformatics',
      icon: Binary,
      roles: ['admin', 'lab_staff'],
    },
    {
      to: '/reports',
      label: role === 'requester' ? 'Delivered Reports' : 'Reports',
      icon: FileText,
      roles: ['admin', 'lab_staff', 'requester'],
    },
    {
      to: '/analytics/tat',
      label: 'TAT & SLA Analytics',
      icon: BarChart3,
      roles: ['admin', 'lab_staff'],
    },
    {
      to: '/admin/audit',
      label: 'Compliance Audit Trail',
      icon: ShieldCheck,
      roles: ['admin'],
    },
    {
      to: '/admin/users',
      label: 'User Management',
      icon: Users,
      roles: ['admin'],
    },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(role));

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
            <Dna className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">Genomics LIMS</h1>
            <p className="text-[10px] font-medium tracking-wide uppercase text-teal-400">Sequencing Core</p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Badge Indicator */}
      <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Active Workspace</span>
          <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800">
            {role.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => onClose && onClose()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-950/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="w-2 h-2 -ml-4 rounded-full bg-emerald-500" />
          <div className="text-[11px] leading-tight">
            <p className="text-slate-300 font-medium">Pipeline v2.6 Online</p>
            <p className="text-slate-500 text-[10px]">ISO-15189 Certified</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 shadow-xl">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop and Sidebar */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
