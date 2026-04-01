import React from 'react';
import { Task, UserRole } from '../lib/types';
import { Clock, AlertTriangle, Zap, Edit2, Trash2, CheckCircle, Package } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  role: UserRole;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusUpdate: (task: Task, status: 'pending' | 'assigned' | 'completed') => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, role, onEdit, onDelete, onStatusUpdate }) => {
  const canManage = ['CEO', 'MD', 'HR', 'Team Leader'].includes(role);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="bg-slate-800/50 p-4 rounded-full mb-4">
          <Package className="w-6 h-6 text-slate-600" />
        </div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Neural Tree Empty</p>
        <p className="text-slate-600 text-[9px] mt-1">No pending packets available for routing.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            BST In-Order Stream
          </h3>
          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] rounded-full border border-indigo-500/20 font-mono">
            {tasks.length} Nodes
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
        {tasks.map((task) => (
          <div 
            key={task.id}
            className="bg-slate-800/30 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50 group-hover:bg-indigo-500 transition-colors" />
            
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold text-slate-200 text-xs truncate max-w-[150px]">{task.title}</h4>
                <p className="text-[8px] text-slate-500 font-mono mt-0.5">UID: {task.id.slice(0, 8)}</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-mono font-bold text-indigo-400">{task.cognitive_load}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mb-2">
              <div className="flex items-center gap-1 bg-slate-900/50 px-1.5 py-1 rounded-md border border-slate-800/50">
                <Zap className="w-2.5 h-2.5 text-amber-500" />
                <span className="text-[9px] text-slate-400">E:{task.effort}</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-900/50 px-1.5 py-1 rounded-md border border-slate-800/50">
                <AlertTriangle className="w-2.5 h-2.5 text-red-500" />
                <span className="text-[9px] text-slate-400">U:{task.urgency}</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-900/50 px-1.5 py-1 rounded-md border border-slate-800/50">
                <Clock className="w-2.5 h-2.5 text-indigo-500" />
                <span className="text-[9px] text-slate-400">{task.duration}m</span>
              </div>
            </div>

            {canManage && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onStatusUpdate(task, 'completed')}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-emerald-500/10 text-slate-500 hover:text-emerald-400 transition-all"
                  title="Mark as Completed"
                >
                  <CheckCircle className="w-3 h-3" />
                  <span className="text-[8px] font-bold uppercase">Complete</span>
                </button>
                <div className="flex gap-1">
                  <button 
                    onClick={() => onEdit(task)}
                    className="p-1 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-all"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => onDelete(task)}
                    className="p-1 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
