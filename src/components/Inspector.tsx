import React from 'react';
import { Task, EmployeeWithStats, SimulationStep } from '../lib/types';
import { Activity, Zap, User, AlertCircle, Terminal, Cpu, BarChart } from 'lucide-react';
import clsx from 'clsx';

interface InspectorProps {
  selectedTask?: Task | null;
  selectedEmployee?: EmployeeWithStats | null;
  activeStep?: SimulationStep | null;
  bstStats?: { comparisons: number, height: number, nodes: number, efficiency: number };
}

export const Inspector: React.FC<InspectorProps> = ({ selectedTask, selectedEmployee, activeStep, bstStats }) => {
  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          Neural Telemetry
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* Performance Metrics */}
        <section>
          <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">Routing Performance</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 mb-1">
                <Cpu className="w-3 h-3 text-indigo-400" />
                <span className="text-[8px] text-slate-500 uppercase font-bold">Latency</span>
              </div>
              <p className="text-sm font-mono text-white">{bstStats?.comparisons || 0} <span className="text-[8px] text-slate-600">Ops</span></p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 mb-1">
                <BarChart className="w-3 h-3 text-emerald-400" />
                <span className="text-[8px] text-slate-500 uppercase font-bold">Efficiency</span>
              </div>
              <p className="text-sm font-mono text-white">{Math.round((bstStats?.efficiency || 0) * 100)}%</p>
            </div>
          </div>
        </section>

        {/* Simulation Log */}
        <section>
          <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">Neural Log</h3>
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-[11px] min-h-[100px] relative">
            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            {activeStep ? (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1">
                <p className="text-indigo-400">$ ROUTE_SEARCH_INIT</p>
                <p className="text-slate-300">{activeStep.message}</p>
                {activeStep.comparison && <p className="text-amber-400">DECISION: {activeStep.comparison}</p>}
              </div>
            ) : (
              <p className="text-slate-700 italic">Awaiting routing instructions...</p>
            )}
          </div>
        </section>

        {/* Selected Task Details */}
        {selectedTask && (
          <section className="animate-in slide-in-from-right-4">
            <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">Packet Metadata</h3>
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-500/20 p-2 rounded-lg">
                  <Zap className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{selectedTask.title}</p>
                  <p className="text-[9px] text-slate-500 font-mono">{selectedTask.id.slice(0, 12)}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {selectedTask.required_skills.map(skill => (
                  <span key={skill} className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[7px] font-bold uppercase rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Selected Employee Details */}
        {selectedEmployee && (
          <section className="animate-in slide-in-from-right-4">
            <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">Node Profile</h3>
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/20 p-2 rounded-lg">
                  <User className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{selectedEmployee.name}</p>
                  <p className="text-[9px] text-slate-500 font-mono">{selectedEmployee.role}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500 font-bold uppercase">Current Load</span>
                  <span className="text-white font-mono">{selectedEmployee.current_load} / {selectedEmployee.max_capacity}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className={clsx(
                      "h-full transition-all duration-500",
                      selectedEmployee.workload_percentage > 100 ? "bg-red-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min(selectedEmployee.workload_percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="p-6 border-t border-slate-800 bg-slate-950/30">
        <div className="flex items-center gap-2 text-amber-500/80">
          <AlertCircle className="w-3 h-3" />
          <span className="text-[9px] font-bold uppercase tracking-tighter">O(log n) Telemetry Active</span>
        </div>
      </div>
    </aside>
  );
};
