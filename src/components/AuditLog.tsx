import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuditLog as AuditLogType } from '../lib/types';
import { History, Clock, Terminal, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching audit logs:', error);
      } else if (data) {
        setLogs(data);
      }
      setLoading(false);
    };

    fetchLogs();

    // Real-time listener for new logs
    const channel = supabase.channel('audit-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
        setLogs(prev => [payload.new as AuditLogType, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Accessing Audit Vault...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/20 p-2 rounded-lg">
            <History className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">System Audit Trail</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Immutable Transaction Log</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
          <Shield className="w-3 h-3 text-indigo-400" />
          <span className="text-[9px] font-bold text-slate-400 uppercase">Compliance Active</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
        {logs.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl">
            <Terminal className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-600 text-xs font-bold uppercase">No transactions recorded</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="relative pl-8 pb-6 border-l border-slate-800 last:border-0">
              <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-slate-700 border-2 border-slate-900" />
              
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 font-bold uppercase">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                      via {log.actor_role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(log.created_at))} ago
                  </span>
                </div>
                
                <p className="text-xs text-slate-300 mb-3">
                  <span className="text-slate-500 font-bold">{log.entity_type}</span> transaction identified 
                  {log.entity_id && <span className="text-[10px] font-mono text-slate-600 ml-1">[{log.entity_id.slice(0, 8)}]</span>}
                </p>

                {(log.old_value || log.new_value) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                    <div>
                      <p className="text-[8px] text-slate-600 font-bold uppercase mb-1">Pre-State</p>
                      <pre className="text-[9px] text-slate-500 font-mono overflow-hidden text-ellipsis">
                        {log.old_value ? JSON.stringify(log.old_value, null, 1) : 'NULL'}
                      </pre>
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-600 font-bold uppercase mb-1">Post-State</p>
                      <pre className="text-[9px] text-indigo-400 font-mono overflow-hidden text-ellipsis">
                        {log.new_value ? JSON.stringify(log.new_value, null, 1) : 'NULL'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
