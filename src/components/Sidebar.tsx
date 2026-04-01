import React from 'react';
import { 
  LayoutDashboard, 
  Network, 
  List, 
  Users, 
  History, 
  BarChart3, 
  ShieldCheck,
  Zap,
  ChevronRight,
  Gauge
} from 'lucide-react';
import { UserRole } from '../lib/types';
import clsx from 'clsx';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  role: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, role }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['CEO', 'MD', 'HR', 'Team Leader'] },
    { id: 'visual', label: 'Neural Tree', icon: Network, roles: ['CEO', 'MD', 'Team Leader'] },
    { id: 'data', label: 'Data Stream', icon: List, roles: ['CEO', 'MD', 'HR', 'Team Leader'] },
    { id: 'hr', label: 'HR Registry', icon: Users, roles: ['CEO', 'MD', 'HR'] },
    { id: 'audit', label: 'Audit Trail', icon: History, roles: ['CEO', 'MD'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['CEO', 'MD'] },
    { id: 'benchmarks', label: 'Benchmarks', icon: Gauge, roles: ['CEO', 'MD', 'Team Leader'] },
    { id: 'my-tasks', label: 'My Workspace', icon: Zap, roles: ['Employee'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
            <Network className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-sm font-bold text-white uppercase tracking-widest">Neural Router</h1>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-3 h-3 text-indigo-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Access Level</span>
          </div>
          <p className="text-xs font-bold text-white">{role}</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={clsx(
              "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group",
              activeTab === item.id 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className={clsx("w-4 h-4", activeTab === item.id ? "text-white" : "text-slate-500 group-hover:text-indigo-400")} />
              <span className="text-xs font-bold">{item.label}</span>
            </div>
            {activeTab === item.id && <ChevronRight className="w-3 h-3" />}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-indigo-500/5 rounded-xl p-4 border border-indigo-500/10">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">System Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-slate-300 font-mono">v2.5.0-STABLE</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
