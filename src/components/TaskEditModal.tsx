import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Task } from '../lib/types';
import { X, Save, Zap, AlertCircle, Loader2 } from 'lucide-react';

interface TaskEditModalProps {
  task: Task;
  onClose: () => void;
  onUpdated: (oldTask: Task, newTask: Task) => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({ task, onClose, onUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    effort: task.effort,
    urgency: task.urgency,
    duration: task.duration,
    status: task.status
  });

  const cognitiveLoad = formData.effort * formData.urgency * formData.duration;

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
        .update({
          title: formData.title,
          description: formData.description,
          effort: formData.effort,
          urgency: formData.urgency,
          duration: formData.duration,
          status: formData.status
        })
        .eq('id', task.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        onUpdated(task, data as Task);
        onClose();
      }
    } catch (err) {
      console.error('Update Error:', err);
      alert('Failed to update packet. Ensure Effort and Urgency are between 1-10.');
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Reconfigure Packet</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Identifier</label>
            <input
              required
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'effort', label: 'Effort (1-10)', min: 1, max: 10 },
              { id: 'urgency', label: 'Urgency (1-10)', min: 1, max: 10 },
              { id: 'duration', label: 'Dur (Min)', min: 1, max: 1440 }
            ].map((field) => (
              <div key={field.id}>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">{field.label}</label>
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  required
                  className="w-full px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs text-center focus:border-indigo-500 outline-none"
                  value={formData[field.id as keyof typeof formData]}
                  onChange={e => handleNumberChange(field.id, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Lifecycle Status</label>
            <select
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as any})}
            >
              <option value="pending">Pending (In BST)</option>
              <option value="assigned">Assigned</option>
              <option value="completed">Completed (Prune from BST)</option>
            </select>
          </div>

          <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/20">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] text-slate-500 uppercase font-bold">New Payload Weight</span>
              </div>
              <span className="text-lg font-mono font-bold text-indigo-400">{cognitiveLoad}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-xs font-bold uppercase hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-xl uppercase transition-all shadow-lg shadow-indigo-900/20 flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Commit Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
