import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Employee, AssignmentResult, Department, EmployeeWithStats, BenchmarkRecord } from '../lib/types';
import { TaskBST } from '../lib/bst';
import { findTaskForEmployee, findTaskWithAI, commitAssignment, calculateMaxLoad } from '../lib/assignmentLogic';
import { Cpu, CheckCircle2, XCircle, ArrowRight, Filter, BrainCircuit, GitCompare, Network } from 'lucide-react';
import clsx from 'clsx';

interface AssignmentPanelProps {
  bst: TaskBST;
  onAssignmentComplete: () => void;
  onStartSim: (capacity: number, emp: EmployeeWithStats) => Promise<void>;
  onBenchmarkRecorded: (records: BenchmarkRecord[]) => void;
}

export const AssignmentPanel: React.FC<AssignmentPanelProps> = ({ bst, onAssignmentComplete, onStartSim, onBenchmarkRecorded }) => {
  const [employees, setEmployees] = useState<EmployeeWithStats[]>([]);
  const [selectedDept, setSelectedDept] = useState<Department | 'All'>('All');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  
  const [bstResult, setBstResult] = useState<AssignmentResult | null>(null);
  const [aiResult, setAiResult] = useState<AssignmentResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [loading, setLoading] = useState(false);

  const departments: (Department | 'All')[] = ['All', 'Engineering', 'DevOps', 'Design', 'Marketing', 'HR', 'General'];

  useEffect(() => {
    const fetchEmployees = async () => {
      let query = supabase.from('employees').select(`*, assignments (*, tasks (*))`).order('experience', { ascending: true });
      if (selectedDept !== 'All') {
        query = query.eq('department', selectedDept);
      }
      const { data } = await query;
      if (data) {
        const processed: EmployeeWithStats[] = data.map((emp: any) => {
          const assignedTasks = emp.assignments?.map((a: any) => a.tasks).filter((t: any) => t !== null && t.status === 'assigned') || [];
          const currentLoad = assignedTasks.reduce((sum: number, t: any) => sum + (t.cognitive_load || 0), 0);
          const maxCapacity = calculateMaxLoad(emp.experience);
          return { ...emp, current_load: currentLoad, max_capacity: maxCapacity, workload_percentage: Math.round((currentLoad / maxCapacity) * 100), assigned_tasks: assignedTasks };
        });
        setEmployees(processed);
      }
    };
    fetchEmployees();
  }, [selectedDept]);

  const handleCompare = async () => {
    if (!selectedEmployeeId) return;
    setLoading(true);
    setBstResult(null);
    setAiResult(null);
    setIsComparing(true);

    const employee = employees.find(e => e.id === selectedEmployeeId);
    if (!employee) return;

    const initialCapacity = calculateMaxLoad(employee.experience);

    // Trigger Visual Simulation for BST (O(log n) path)
    await onStartSim(initialCapacity, employee);

    // Run BST Algorithm
    const bRes = findTaskForEmployee(bst, employee);
    const bstSteps = bst.getStats().comparisons; // Get exact comparisons from the tree
    
    // Run AI Greedy Algorithm (O(n) scan)
    const allTasks = bst.inorderTraversal();
    const aRes = findTaskWithAI(allTasks, employee);

    setBstResult(bRes);
    setAiResult(aRes);

    // Record Benchmarks
    const timestamp = Date.now();
    const bstStats = bst.getStats();
    
    const newBenchmarks: BenchmarkRecord[] = [
      {
        id: crypto.randomUUID(),
        timestamp,
        algorithm: bst.isAVL ? 'AVL' : 'BST',
        executionTimeMs: bRes.executionTimeMs || 0,
        steps: bstSteps,
        nodes: bstStats.nodes,
        treeHeight: bstStats.height
      },
      {
        id: crypto.randomUUID(),
        timestamp,
        algorithm: 'AI',
        executionTimeMs: aRes.executionTimeMs || 0,
        steps: aRes.steps || allTasks.length,
        nodes: bstStats.nodes,
        treeHeight: bstStats.height
      }
    ];
    
    onBenchmarkRecorded(newBenchmarks);
    setLoading(false);
  };

  const handleCommit = async (result: AssignmentResult, algorithmName: string) => {
    const employee = employees.find(e => e.id === selectedEmployeeId);
    if (!employee || !result.success || !result.task) return;

    setLoading(true);
    try {
      // Append which algorithm was used to the justification
      const finalResult = { ...result, message: `[${algorithmName}] ${result.message}` };
      await commitAssignment(result.task, employee, finalResult);
      bst.deleteByTask(result.task);
      
      // Reset state
      setIsComparing(false);
      setBstResult(null);
      setAiResult(null);
      setSelectedEmployeeId('');
      
      onAssignmentComplete();
    } catch (err) {
      console.error(err);
      alert("Routing Error: Persistence failed.");
    } finally {
      setLoading(false);
    }
  };

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const algorithmsAgreed = bstResult?.success && aiResult?.success && bstResult.task?.id === aiResult.task?.id;

  return (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl max-h-[85vh] overflow-y-auto custom-scrollbar">
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
        <GitCompare className="w-4 h-4 text-emerald-500" />
        Algorithmic Routing Engine
      </h2>

      {!isComparing ? (
        <div className="space-y-4 animate-in fade-in">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Department Filter
            </label>
            <select
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-xs"
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value as Department | 'All');
                setSelectedEmployeeId('');
              }}
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Target Node (Employee)</label>
            <select
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <option value="">Select Target Node</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.department})
                </option>
              ))}
            </select>
          </div>

          {selectedEmployee && (
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 animate-in slide-in-from-top-2 duration-300 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Capacity Profile</span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                  {selectedEmployee.department}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-slate-700/50">
                <span className="text-slate-400">Max Load:</span>
                <span className="text-white font-mono">{calculateMaxLoad(selectedEmployee.experience)}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleCompare}
            disabled={!selectedEmployee || loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex justify-center items-center gap-2 text-sm"
          >
            {loading ? 'Analyzing Options...' : 'Analyze Routing Options'}
            {!loading && <GitCompare className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-in slide-in-from-right-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-white">Comparison Results</h3>
            <button 
              onClick={() => setIsComparing(false)}
              className="text-[10px] text-slate-400 hover:text-white uppercase font-bold"
            >
              Cancel
            </button>
          </div>

          {algorithmsAgreed && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Algorithmic Consensus</p>
                <p className="text-[10px] text-emerald-500/80 mt-0.5">Both models selected the same optimal packet.</p>
              </div>
            </div>
          )}

          {!algorithmsAgreed && bstResult?.success && aiResult?.success && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center gap-3">
              <GitCompare className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Divergent Routing</p>
                <p className="text-[10px] text-amber-500/80 mt-0.5">Models disagree. Review reasoning below.</p>
              </div>
            </div>
          )}

          {/* BST Result Card */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-indigo-500/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">BST Model O(log n)</h4>
              </div>
              <span className="text-[9px] font-mono text-slate-500">{bstResult?.executionTimeMs?.toFixed(3)}ms</span>
            </div>
            
            {bstResult?.success ? (
              <>
                <p className="text-sm font-bold text-white mb-1">{bstResult.task?.title}</p>
                <p className="text-[10px] text-slate-400 leading-relaxed mb-4">{bstResult.message}</p>
                <button 
                  onClick={() => handleCommit(bstResult, 'BST')}
                  disabled={loading}
                  className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-bold rounded-lg transition-colors border border-indigo-500/30"
                >
                  Execute BST Route
                </button>
              </>
            ) : (
              <p className="text-xs text-slate-500 italic">{bstResult?.message}</p>
            )}
          </div>

          {/* AI Result Card */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-fuchsia-500/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-fuchsia-500" />
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-fuchsia-400" />
                <h4 className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest">AI Greedy Model O(n)</h4>
              </div>
              <span className="text-[9px] font-mono text-slate-500">{aiResult?.executionTimeMs?.toFixed(3)}ms</span>
            </div>
            
            {aiResult?.success ? (
              <>
                <p className="text-sm font-bold text-white mb-1">{aiResult.task?.title}</p>
                <p className="text-[10px] text-slate-400 leading-relaxed mb-4">{aiResult.message}</p>
                <button 
                  onClick={() => handleCommit(aiResult, 'AI')}
                  disabled={loading}
                  className="w-full py-2 bg-fuchsia-600/20 hover:bg-fuchsia-600/40 text-fuchsia-300 text-xs font-bold rounded-lg transition-colors border border-fuchsia-500/30"
                >
                  Execute AI Route
                </button>
              </>
            ) : (
              <p className="text-xs text-slate-500 italic">{aiResult?.message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
