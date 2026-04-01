import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Task, Department, Skill } from '../lib/types';
import { Loader2, Zap, Activity, Building2, Code2 } from 'lucide-react';
import clsx from 'clsx';

interface TaskFormProps {
  onTaskAdded: (task: Task) => void;
  onDraftChange?: (draft: Partial<Task>) => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onTaskAdded, onDraftChange }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    effort: 5,
    urgency: 5,
    duration: 60,
    department: 'Engineering' as Department,
    required_skills: [] as Skill[]
  });

  const departments: Department[] = ['Engineering', 'DevOps', 'Design', 'Marketing', 'HR', 'General'];
  const availableSkills: Skill[] = ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'UI/UX', 'AWS', 'Python', 'Security'];
  
  const cognitiveLoad = formData.effort * formData.urgency * formData.duration;

  // Sync draft state to parent for live preview
  useEffect(() => {
    if (onDraftChange) {
      onDraftChange({
        title: formData.title || 'DRAFT_PACKET',
        cognitive_load: cognitiveLoad,
        required_skills: formData.required_skills,
        department: formData.department,
        effort: formData.effort,
        urgency: formData.urgency,
        duration: formData.duration
      });
    }
  }, [formData, cognitiveLoad, onDraftChange]);

  const toggleSkill = (skill: Skill) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.includes(skill)
        ? prev.required_skills.filter(s => s !== skill)
        : [...prev.required_skills, skill]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.effort < 1 || formData.effort > 10 || formData.urgency < 1 || formData.urgency > 10) {
      alert('Effort and Urgency must be between 1 and 10.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: formData.title,
          description: formData.description,
          effort: formData.effort,
          urgency: formData.urgency,
          duration: formData.duration,
          department: formData.department,
          required_skills: formData.required_skills
        }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        onTaskAdded(data as Task);
        setFormData({ 
          title: '', 
          description: '', 
          effort: 5, 
          urgency: 5, 
          duration: 60,
          department: 'Engineering',
          required_skills: []
        });
      }
    } catch (err) {
      console.error('Task Insertion Error:', err);
      alert('Failed to inject packet.');
    } finally {
      setLoading(false);
    }
  };

  const handleNumberChange = (field: string, value: string) => {
    let val = parseInt(value) || 0;
    if (field === 'effort' || field === 'urgency') {
      if (val > 10) val = 10;
    }
    setFormData({ ...formData, [field]: val });
  };

  return (
    <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl h-full flex flex-col">
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 shrink-0">
        <Activity className="w-4 h-4 text-indigo-500" />
        Packet Injection
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
        <div className="space-y-1 shrink-0">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Task Identifier</label>
          <input
            required
            type="text"
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            placeholder="e.g. DATA_SYNC_V2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 shrink-0">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Department
            </label>
            <select
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs"
              value={formData.department}
              onChange={e => setFormData({...formData, department: e.target.value as Department})}
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
              <Code2 className="w-3 h-3" /> Skills Required
            </label>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1.5 bg-slate-800 border border-slate-700 rounded-xl custom-scrollbar">
              {availableSkills.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={clsx(
                    "px-1.5 py-0.5 rounded text-[7px] font-bold uppercase transition-all",
                    formData.required_skills.includes(skill)
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                  )}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 shrink-0">
          {[
            { id: 'effort', label: 'Effort (1-10)', min: 1, max: 10 },
            { id: 'urgency', label: 'Urgency (1-10)', min: 1, max: 10 },
            { id: 'duration', label: 'Dur (Min)', min: 1, max: 1440 }
          ].map((field) => (
            <div key={field.id}>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1 ml-1">{field.label}</label>
              <input
                type="number"
                min={field.min}
                max={field.max}
                required
                className="w-full px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs text-center focus:border-indigo-500 outline-none transition-colors"
                value={formData[field.id as keyof typeof formData]}
                onChange={e => handleNumberChange(field.id, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4 shrink-0">
          <div className="bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/20 group hover:bg-indigo-500/10 transition-colors mb-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] text-slate-500 uppercase font-bold">Payload Weight</span>
              </div>
              <span className="text-lg font-mono font-bold text-indigo-400 group-hover:scale-110 transition-transform">{cognitiveLoad}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-900/20 flex justify-center items-center gap-2 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Inject into Neural Tree'}
          </button>
        </div>
      </form>
    </div>
  );
};
