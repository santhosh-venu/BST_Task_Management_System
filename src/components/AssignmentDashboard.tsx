import React, { useMemo, useState } from 'react';
import { Task, EmployeeWithStats, UserRole } from '../lib/types';
import { 
  Users, 
  Package, 
  AlertCircle, 
  TrendingUp,
  Zap,
  ArrowRight,
  CheckCircle2,
  RefreshCcw,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { suggestRebalance, transferTask } from '../lib/assignmentLogic';
import { logAction } from '../lib/audit';
import clsx from 'clsx';

interface AssignmentDashboardProps {
  employees: EmployeeWithStats[];
  pendingTasks: Task[];
  role: UserRole;
  onRefresh: () => void;
}

export const AssignmentDashboard: React.FC<AssignmentDashboardProps> = ({ employees, pendingTasks, role, onRefresh }) => {
  const [balancing, setBalancing] = useState(false);
  
  const stats = useMemo(() => {
    const totalAssignedLoad = employees.reduce((sum, emp) => sum + emp.current_load, 0);
    const totalPendingLoad = pendingTasks.reduce((sum, t) => sum + t.cognitive_load, 0);
    const avgWorkload = employees.length > 0 
      ? Math.round(employees.reduce((sum, emp) => sum + emp.workload_percentage, 0) / employees.length) 
      : 0;
    const overloadedCount = employees.filter(emp => emp.workload_percentage > 100).length;

    return { totalAssignedLoad, totalPendingLoad, avgWorkload, overloadedCount };
  }, [employees, pendingTasks]);

  const rebalanceSuggestion = useMemo(() => suggestRebalance(employees), [employees]);

  const handleRebalance = async () => {
    if (!rebalanceSuggestion) return;
    setBalancing(true);
    try {
      await transferTask(
        rebalanceSuggestion.task.id, 
        rebalanceSuggestion.source.id, 
        rebalanceSuggestion.target.id
      );
      await logAction('REBALANCE_PACKET', 'ASSIGNMENT', role, rebalanceSuggestion.task.id, 
        { from: rebalanceSuggestion.source.name }, 
        { to: rebalanceSuggestion.target.name }
      );
      onRefresh();
    } catch (err) {
      console.error('Rebalance failed:', err);
    } finally {
      setBalancing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Global Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Network Load', value: stats.totalAssignedLoad, icon: TrendingUp, color: 'text-indigo-400', sub: 'Active Units' },
          { label: 'Pending Payload', value: stats.totalPendingLoad, icon: Package, color: 'text-amber-400', sub: `${pendingTasks.length} Packets` },
          { label: 'Avg Workload', value: `${stats.avgWorkload}%`, icon: Zap, color: 'text-emerald-400', sub: 'System Capacity' },
          { label: 'Overload Nodes', value: stats.overloadedCount, icon: AlertCircle, color: 'text-red-400', sub: 'Critical State' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg group hover:border-slate-700 transition-all">
            <div className="flex justify-between items-start mb-2">
              <div className={clsx("p-2 rounded-lg bg-slate-800", stat.color)}>
                <stat.icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-mono font-bold text-white">{stat.value}</h3>
              <p className="text-[10px] text-slate-600 font-bold uppercase mt-1">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Load Balancing Suggestion */}
      {rebalanceSuggestion && ['CEO', 'MD', 'Team Leader'].includes(role) && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-600/10 border border-indigo-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-900/40">
              <RefreshCcw className={clsx("w-6 h-6 text-white", balancing && "animate-spin")} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Neural Rebalance Suggested</h3>
              <p className="text-indigo-300 text-xs mt-1 leading-relaxed max-w-md">
                {rebalanceSuggestion.reason}
              </p>
            </div>
          </div>
          <button 
            onClick={handleRebalance}
            disabled={balancing}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-900/20 flex items-center gap-2 whitespace-nowrap"
          >
            {balancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Execute Transfer
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              Active Node Distribution
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {employees.map((emp) => (
                <motion.div
                  layout
                  key={emp.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={clsx(
                    "bg-slate-900 rounded-2xl border p-5 transition-all relative overflow-hidden group",
                    emp.workload_percentage > 100 ? "border-red-500/30 bg-red-500/[0.02]" : "border-slate-800 hover:border-slate-700"
                  )}
                >
                  {emp.workload_percentage > 100 && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-red-500 text-[8px] font-bold text-white uppercase tracking-tighter rounded-bl-lg">
                      Overload Detected
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                      {emp.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{emp.name}</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">{emp.role} • {emp.experience}y Exp</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Load Capacity</span>
                      <span className={clsx(
                        "text-xs font-mono font-bold",
                        emp.workload_percentage > 100 ? "text-red-400" : "text-indigo-400"
                      )}>
                        {emp.current_load} / {emp.max_capacity}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(emp.workload_percentage, 100)}%` }}
                        className={clsx(
                          "h-full rounded-full",
                          emp.workload_percentage > 100 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-indigo-500"
                        )}
                      />
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/50">
                    <p className="text-[9px] font-bold text-slate-600 uppercase mb-3 tracking-widest">Routed Packets</p>
                    <div className="space-y-2">
                      {emp.assigned_tasks.length === 0 ? (
                        <p className="text-[10px] text-slate-700 italic">No packets currently routed to this node.</p>
                      ) : (
                        emp.assigned_tasks.map(task => (
                          <div key={task.id} className="flex items-center justify-between bg-slate-800/40 p-2 rounded-lg border border-slate-700/30">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span className="text-[10px] text-slate-300 font-medium truncate max-w-[120px]">{task.title}</span>
                            </div>
                            <span className="text-[10px] font-mono text-indigo-400 font-bold">{task.cognitive_load}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-500" />
            Neural Queue (BST)
          </h3>
          
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-2 max-h-[800px] overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {pendingTasks.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-xs text-slate-600 font-bold uppercase">Queue Empty</p>
                </div>
              ) : (
                pendingTasks.map((task) => (
                  <motion.div
                    layout
                    key={task.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-4 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">{task.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-slate-500 font-mono">LOAD: {task.cognitive_load}</span>
                          <span className="text-[9px] text-slate-500">•</span>
                          <span className="text-[9px] text-slate-500 uppercase">{task.duration}m</span>
                        </div>
                      </div>
                      <div className="bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                        <ArrowRight className="w-3 h-3 text-amber-500" />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
