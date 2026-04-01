import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AssignmentRecord, Task } from '../lib/types';
import { ClipboardList, Clock, Zap, CheckCircle, Loader2 } from 'lucide-react';

export const MyTasks: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyTasks = async () => {
      // In a real app, we'd filter by the logged-in user's ID
      // For this simulation, we'll show all assigned tasks to demonstrate the view
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          tasks (*)
        `)
        .order('assigned_at', { ascending: false });

      if (data) setAssignments(data);
      setLoading(false);
    };
    fetchMyTasks();
  }, []);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-indigo-500" />
            My Workspace
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">Viewing assigned cognitive load packets</p>
        </div>
        <div className="bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Role: Employee</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-slate-500 text-sm font-mono">Decrypting task stream...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 font-bold">No active assignments</p>
          <p className="text-slate-600 text-xs mt-1">The routing engine has not assigned any packets to your node yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[550px] pr-2 custom-scrollbar">
          {assignments.map((item) => (
            <div key={item.id} className="bg-slate-800/30 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg">{item.tasks?.title}</h3>
                  <p className="text-slate-500 text-xs mt-1 line-clamp-1">{item.tasks?.description || 'No description provided.'}</p>
                </div>
                <div className="bg-indigo-500/10 p-2 rounded-lg">
                  <Zap className="w-4 h-4 text-indigo-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Cognitive Load</p>
                  <p className="text-lg font-mono text-white">{item.tasks?.cognitive_load}</p>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Duration</p>
                  <p className="text-lg font-mono text-white">{item.tasks?.duration}m</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                  <Clock className="w-3 h-3" />
                  {new Date(item.assigned_at).toLocaleDateString()}
                </div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Status: Assigned
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
