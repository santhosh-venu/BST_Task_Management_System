import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Employee, EmployeeWithStats, Task, Skill } from '../lib/types';
import { calculateMaxLoad } from '../lib/assignmentLogic';
import { 
  Users, 
  Plus, 
  Trash2, 
  Briefcase, 
  Award, 
  Loader2, 
  Edit2, 
  Save, 
  X, 
  ChevronDown, 
  ChevronUp,
  Activity,
  Building2,
  Zap,
  Code2
} from 'lucide-react';
import clsx from 'clsx';

export const EmployeeManager: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const availableSkills: Skill[] = ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'UI/UX', 'AWS', 'Python', 'Security'];

  const [newEmp, setNewEmp] = useState({ 
    name: '', 
    experience: 1, 
    role: 'Junior Engineer',
    department: 'Engineering',
    skills: [] as Skill[]
  });

  const [editForm, setEditForm] = useState<Partial<Employee>>({});

  const fetchEmployees = async () => {
    setLoading(true);
    const { data: empData, error: empError } = await supabase
      .from('employees')
      .select(`
        *,
        assignments (
          *,
          tasks (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (empError) {
      console.error(empError);
    } else if (empData) {
      const processed: EmployeeWithStats[] = empData.map((emp: any) => {
        const assignedTasks = emp.assignments
          ?.map((a: any) => a.tasks)
          .filter((t: any) => t !== null && t.status === 'assigned') || [];
        
        const currentLoad = assignedTasks.reduce((sum: number, t: Task) => sum + t.cognitive_load, 0);
        const maxCapacity = calculateMaxLoad(emp.experience);
        
        return {
          ...emp,
          current_load: currentLoad,
          max_capacity: maxCapacity,
          workload_percentage: Math.min(Math.round((currentLoad / maxCapacity) * 100), 150),
          assigned_tasks: assignedTasks
        };
      });
      setEmployees(processed);
    }
    setLoading(false);
  };

  useEffect(() => { fetchEmployees(); }, []);

  const toggleSkill = (skill: Skill, isEdit = false) => {
    if (isEdit) {
      setEditForm(prev => ({
        ...prev,
        skills: prev.skills?.includes(skill)
          ? prev.skills.filter(s => s !== skill)
          : [...(prev.skills || []), skill]
      }));
    } else {
      setNewEmp(prev => ({
        ...prev,
        skills: prev.skills.includes(skill)
          ? prev.skills.filter(s => s !== skill)
          : [...prev.skills, skill]
      }));
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('employees').insert([newEmp]);
    if (!error) {
      setIsAdding(false);
      setNewEmp({ name: '', experience: 1, role: 'Junior Engineer', department: 'Engineering', skills: [] });
      fetchEmployees();
    }
  };

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('employees')
      .update(editForm)
      .eq('id', id);
    
    if (!error) {
      setEditingId(null);
      fetchEmployees();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Critical: Terminating this node will orphan its assigned packets. Proceed?')) return;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (!error) fetchEmployees();
  };

  const startEditing = (emp: EmployeeWithStats) => {
    setEditingId(emp.id);
    setEditForm({
      name: emp.name,
      experience: emp.experience,
      role: emp.role,
      department: emp.department,
      skills: emp.skills || []
    });
  };

  return (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-pink-500/20 p-2 rounded-lg">
            <Users className="w-4 h-4 text-pink-500" />
          </div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Human Resources
          </h2>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={clsx(
            "p-2 rounded-lg transition-all",
            isAdding ? "bg-slate-800 text-slate-400" : "bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30"
          )}
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Full Name</label>
            <input 
              required placeholder="e.g. Alan Turing"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
              value={newEmp.name}
              onChange={e => setNewEmp({...newEmp, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Experience (Yrs)</label>
              <input 
                type="number" min="0" max="50"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                value={newEmp.experience}
                onChange={e => setNewEmp({...newEmp, experience: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Department</label>
              <input 
                placeholder="e.g. DevOps"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                value={newEmp.department}
                onChange={e => setNewEmp({...newEmp, department: e.target.value})}
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
              <Code2 className="w-2.5 h-2.5" /> Skill Matrix
            </label>
            <div className="flex flex-wrap gap-1 p-2 bg-slate-900 rounded-lg border border-slate-700">
              {availableSkills.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={clsx(
                    "px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all",
                    newEmp.skills.includes(skill)
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                  )}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Designation</label>
            <input 
              placeholder="e.g. Senior Architect"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
              value={newEmp.role}
              onChange={e => setNewEmp({...newEmp, role: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold py-2.5 rounded-lg uppercase tracking-widest transition-colors shadow-lg shadow-indigo-900/20">
            Register Node
          </button>
        </form>
      )}

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Scanning Network...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
            <p className="text-xs text-slate-600">No active nodes in HR registry.</p>
          </div>
        ) : employees.map(emp => (
          <div key={emp.id} className={clsx(
            "group border rounded-xl transition-all overflow-hidden",
            expandedId === emp.id ? "bg-slate-800/50 border-slate-700" : "bg-slate-800/20 border-slate-800 hover:border-slate-700"
          )}>
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400">
                    {emp.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className={clsx(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900",
                    emp.workload_percentage > 90 ? "bg-red-500" : emp.workload_percentage > 60 ? "bg-amber-500" : "bg-green-500"
                  )} />
                </div>
                
                {editingId === emp.id ? (
                  <div className="space-y-2">
                    <input 
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-32"
                      value={editForm.name}
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                    />
                    <div className="flex flex-wrap gap-1 max-w-[200px] mt-1">
                      {availableSkills.map(skill => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill, true)}
                          className={clsx(
                            "px-1.5 py-0.5 rounded text-[7px] font-bold uppercase",
                            editForm.skills?.includes(skill) ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-600"
                          )}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)} className="cursor-pointer">
                    <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">{emp.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-slate-500 flex items-center gap-1">
                        <Briefcase className="w-2.5 h-2.5" /> {emp.role}
                      </span>
                      <span className="text-[9px] text-indigo-400 flex items-center gap-1 font-bold">
                        <Award className="w-2.5 h-2.5" /> {emp.experience}y
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {editingId === emp.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => handleUpdate(emp.id)} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg">
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-500 hover:bg-slate-500/10 rounded-lg">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => startEditing(emp)} className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(emp.id)} className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)} className="p-1.5 text-slate-500 hover:text-white rounded-lg">
                      {expandedId === emp.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Skills Preview */}
            {!editingId && emp.skills && emp.skills.length > 0 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1">
                {emp.skills.map(skill => (
                  <span key={skill} className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[7px] font-bold uppercase rounded border border-indigo-500/20">
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {/* Workload Progress Bar */}
            <div className="px-3 pb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Current Workload</span>
                <span className={clsx(
                  "text-[9px] font-mono font-bold",
                  emp.workload_percentage > 90 ? "text-red-400" : "text-indigo-400"
                )}>{emp.workload_percentage}%</span>
              </div>
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={clsx(
                    "h-full transition-all duration-500",
                    emp.workload_percentage > 90 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-indigo-500"
                  )}
                  style={{ width: `${Math.min(emp.workload_percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Expanded Task Breakdown */}
            {expandedId === emp.id && (
              <div className="bg-slate-900/50 border-t border-slate-800 p-3 space-y-2 animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5" /> Routed Packets
                  </h4>
                  <span className="text-[9px] text-slate-600 font-mono">
                    {emp.current_load} / {emp.max_capacity} Units
                  </span>
                </div>
                
                {emp.assigned_tasks.length === 0 ? (
                  <p className="text-[10px] text-slate-700 italic py-2 text-center">No active tasks assigned.</p>
                ) : (
                  <div className="space-y-1.5">
                    {emp.assigned_tasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between bg-slate-800/40 p-2 rounded-lg border border-slate-700/50">
                        <div className="flex items-center gap-2">
                          <Zap className="w-2.5 h-2.5 text-indigo-400" />
                          <span className="text-[10px] text-slate-300 font-medium">{task.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-indigo-400 font-bold">{task.cognitive_load}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 mt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                    <Building2 className="w-2.5 h-2.5" /> {emp.department || 'N/A'}
                  </div>
                  <div className="text-[9px] text-slate-500 text-right">
                    Joined {new Date(emp.created_at!).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
