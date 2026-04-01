import React from 'react';
import { UserRole } from '../lib/types';
import { Shield, ChevronDown, UserCheck } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentRole, onRoleChange }) => {
  const roles: UserRole[] = ['CEO', 'MD', 'HR', 'Team Leader', 'Employee'];

  return (
    <div className="relative group">
      <button className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-700 transition-all">
        <div className="bg-indigo-500/20 p-1.5 rounded-lg">
          <Shield className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="text-left">
          <p className="text-[10px] text-slate-500 uppercase font-bold leading-none mb-1">Access Level</p>
          <p className="text-xs font-bold text-white leading-none">{currentRole}</p>
        </div>
        <ChevronDown className="w-3 h-3 text-slate-500 ml-2" />
      </button>

      <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] overflow-hidden">
        <div className="p-2 border-b border-slate-800 bg-slate-800/50">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2">Switch Persona</p>
        </div>
        {roles.map((role) => (
          <button
            key={role}
            onClick={() => onRoleChange(role)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-medium transition-colors hover:bg-slate-800 ${
              currentRole === role ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-400'
            }`}
          >
            <UserCheck className={`w-3.5 h-3.5 ${currentRole === role ? 'opacity-100' : 'opacity-0'}`} />
            {role}
          </button>
        ))}
      </div>
    </div>
  );
};
