import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './lib/supabase';
import { TaskBST } from './lib/bst';
import { Task, EmployeeWithStats, UserRole, VisualNode, SimulationStep, BenchmarkRecord } from './lib/types';
import { calculateMaxLoad, commitAssignment } from './lib/assignmentLogic';
import { logAction } from './lib/audit';
import { Sidebar } from './components/Sidebar';
import { Inspector } from './components/Inspector';
import { VisualBST } from './components/VisualBST';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { AssignmentPanel } from './components/AssignmentPanel';
import { EmployeeManager } from './components/EmployeeManager';
import { AuditLog } from './components/AuditLog';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { BenchmarkDashboard } from './components/BenchmarkDashboard';
import { MyTasks } from './components/MyTasks';
import { RoleSwitcher } from './components/RoleSwitcher';
import { TaskEditModal } from './components/TaskEditModal';
import { AssignmentDashboard } from './components/AssignmentDashboard';
import { Activity, Network, Shield, Zap, Loader2, Search, Bell, Settings, List } from 'lucide-react';
import clsx from 'clsx';

function App() {
  const bstRef = useRef<TaskBST>(new TaskBST());
  const isSyncing = useRef(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithStats[]>([]);
  const [visualNodes, setVisualNodes] = useState<VisualNode[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'visual' | 'data' | 'hr' | 'audit' | 'analytics' | 'benchmarks' | 'my-tasks'>('dashboard');
  const [role, setRole] = useState<UserRole>('CEO');
  const [loading, setLoading] = useState(true);
  const [bstVersion, setBstVersion] = useState(0);
  const [bstStats, setBstStats] = useState({ comparisons: 0, height: 0, nodes: 0, efficiency: 1 });
  const [isAVLMode, setIsAVLMode] = useState(true);
  const [benchmarks, setBenchmarks] = useState<BenchmarkRecord[]>([]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithStats | null>(null);
  const [isEditingTask, setIsEditingTask] = useState<Task | null>(null);
  const [simSteps, setSimSteps] = useState<SimulationStep[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [packetPos, setPacketPos] = useState<{ x: number, y: number } | null>(null);
  const [simSpeed, setSimSpeed] = useState(600);
  
  const [previewNode, setPreviewNode] = useState<VisualNode | null>(null);

  const loadData = useCallback(async (showLoading = true) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    if (showLoading) setLoading(true);
    
    try {
      const { data: taskData } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (taskData) {
        bstRef.current.clear();
        taskData.forEach((t: Task) => bstRef.current.insert(t, true));
        setTasks(bstRef.current.inorderTraversal());
        setVisualNodes(bstRef.current.getVisualNodes());
        setBstStats(bstRef.current.getStats());
      }

      const { data: empData } = await supabase
        .from('employees')
        .select(`*, assignments (*, tasks (*))`);

      if (empData) {
        const processed: EmployeeWithStats[] = empData.map((emp: any) => {
          const assignedTasks = emp.assignments
            ?.map((a: any) => a.tasks)
            .filter((t: any) => t !== null && t.status === 'assigned') || [];
          
          const currentLoad = assignedTasks.reduce((sum: number, t: Task) => sum + (t.cognitive_load || 0), 0);
          const maxCapacity = calculateMaxLoad(emp.experience);
          
          return { 
            ...emp, 
            current_load: currentLoad, 
            max_capacity: maxCapacity, 
            workload_percentage: Math.round((currentLoad / maxCapacity) * 100), 
            assigned_tasks: assignedTasks 
          };
        });
        setEmployees(processed);
      }
      setBstVersion(v => v + 1);
    } catch (error) {
      console.error('Neural Sync Error:', error);
    } finally {
      setLoading(false);
      isSyncing.current = false;
    }
  }, []);

  useEffect(() => {
    loadData();

    const taskChannel = supabase.channel('neural-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => loadData(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => loadData(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => loadData(false))
      .subscribe();

    return () => {
      supabase.removeChannel(taskChannel);
    };
  }, [loadData]);

  const toggleAVLMode = () => {
    const newMode = !isAVLMode;
    setIsAVLMode(newMode);
    bstRef.current.isAVL = newMode;
    bstRef.current.clear();
    tasks.forEach(t => bstRef.current.insert(t, true));
    setVisualNodes(bstRef.current.getVisualNodes());
    setBstStats(bstRef.current.getStats());
  };

  const runSimulation = async (steps: SimulationStep[]) => {
    setSimSteps(steps);
    setCurrentStepIdx(-1);
    setPacketPos({ x: 500, y: 0 });

    for (let i = 0; i < steps.length; i++) {
      setCurrentStepIdx(i);
      const node = bstRef.current.getVisualNodes().find(n => n.id === steps[i].nodeId);
      if (node && steps[i].type !== 'rotate') {
        setPacketPos({ x: node.x, y: node.y });
        setSelectedTask(node.task);
      }
      await new Promise(resolve => setTimeout(resolve, simSpeed));
    }
    
    setTimeout(() => {
      setPacketPos(null);
      setCurrentStepIdx(-1);
      setSimSteps([]);
    }, 1500);
  };

  const handleTaskAdded = async (task: Task) => {
    const oldNodes = bstRef.current.getVisualNodes();
    const routingSteps = bstRef.current.getInsertionPath(task);
    
    bstRef.current.insert(task);
    const newNodes = bstRef.current.getVisualNodes();
    const rotationSteps = [...bstRef.current.lastRotations];
    
    if (activeTab === 'visual' || activeTab === 'data') {
      setVisualNodes(oldNodes);
      await runSimulation(routingSteps);
      
      setVisualNodes(newNodes);
      setBstStats(bstRef.current.getStats());
      
      if (rotationSteps.length > 0) {
        await runSimulation(rotationSteps);
      }
    } else {
      setVisualNodes(newNodes);
      setBstStats(bstRef.current.getStats());
    }
    
    await logAction('INJECT_PACKET', 'TASK', role, task.id, null, task);
    loadData(false);
  };

  const handleAssignmentStart = async (capacity: number, emp: EmployeeWithStats) => {
    setSelectedEmployee(emp);
    const { steps, task } = bstRef.current.findMaxLTEWithSteps(capacity, emp.skills);
    setBstStats(bstRef.current.getStats());
    
    if ((activeTab === 'visual' || activeTab === 'data') && steps.length > 0) {
      await runSimulation(steps);
    }
    
    if (task) {
      await logAction('ROUTE_PACKET', 'ASSIGNMENT', role, task.id, null, { employee: emp.name });
    }
  };

  const handleAssignmentComplete = async () => {
    const rotationSteps = [...bstRef.current.lastRotations];
    setVisualNodes(bstRef.current.getVisualNodes());
    setBstStats(bstRef.current.getStats());
    
    if (rotationSteps.length > 0 && (activeTab === 'visual' || activeTab === 'data')) {
      await runSimulation(rotationSteps);
    }
    loadData(false);
  };

  const handleTaskUpdated = async (oldTask: Task, newTask: Task) => {
    await logAction('UPDATE_PACKET', 'TASK', role, newTask.id, oldTask, newTask);
    loadData(false);
  };

  const handleTaskDeleted = async (task: Task) => {
    const { error } = await supabase.from('tasks').delete().eq('id', task.id);
    if (!error) {
      bstRef.current.deleteByTask(task);
      const newNodes = bstRef.current.getVisualNodes();
      const rotationSteps = [...bstRef.current.lastRotations];
      
      setVisualNodes(newNodes);
      setBstStats(bstRef.current.getStats());
      
      if (rotationSteps.length > 0 && (activeTab === 'visual' || activeTab === 'data')) {
        await runSimulation(rotationSteps);
      }
      
      await logAction('PURGE_PACKET', 'TASK', role, task.id, task, null);
      loadData(false);
    }
  };

  const handleStatusUpdate = async (task: Task, status: 'pending' | 'assigned' | 'completed') => {
    const { error } = await supabase.from('tasks').update({ status }).eq('id', task.id);
    if (!error) {
      await logAction('STATUS_CHANGE', 'TASK', role, task.id, { status: task.status }, { status });
      loadData(false);
    }
  };

  const handleDraftChange = useCallback((draft: Partial<Task>) => {
    setPreviewNode(bstRef.current.getPreviewNode(draft));
  }, []);

  if (loading && bstVersion === 0) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-indigo-500/20 rounded-full" />
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <Network className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-400" />
        </div>
        <div className="text-center">
          <h2 className="text-white font-bold text-xl uppercase tracking-[0.3em]">Neural Router</h2>
          <p className="text-slate-500 text-xs font-mono mt-2">Hydrating Tree from Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={role} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between px-8 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sync Active</span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
              <Activity className="w-3 h-3 text-indigo-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                Efficiency: {Math.round(bstStats.efficiency * 100)}%
              </span>
            </div>
            <button 
              onClick={toggleAVLMode}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
                isAVLMode ? "bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-400" : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
              )}
              title="Toggle AVL Self-Balancing"
            >
              <Network className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">
                {isAVLMode ? 'AVL Mode: ON' : 'BST Mode: OFF'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search Packets..." 
                className="bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
              />
            </div>
            <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
              <Bell className="w-4 h-4" />
            </button>
            <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
              <Settings className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-800 mx-2" />
            <RoleSwitcher currentRole={role} onRoleChange={setRole} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === 'dashboard' && (
            <AssignmentDashboard 
              employees={employees} 
              pendingTasks={tasks} 
              role={role}
              onRefresh={() => loadData(false)}
            />
          )}

          {activeTab === 'visual' && (
            <div className="h-full flex flex-col gap-6">
              <div className="flex justify-between items-center shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-white">Neural Tree Visualization</h2>
                  <p className="text-slate-500 text-sm mt-1">Real-time routing simulation</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-900 p-2 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase ml-2">Routing Speed</span>
                  <input 
                    type="range" min="100" max="2000" step="100"
                    className="accent-indigo-500 w-32"
                    value={simSpeed}
                    onChange={e => setSimSpeed(parseInt(e.target.value))}
                  />
                  <span className="text-[10px] font-mono text-indigo-400 w-12 text-right">{simSpeed}ms</span>
                </div>
              </div>
              <div className="flex-1 min-h-[600px]">
                <VisualBST 
                  nodes={visualNodes} 
                  activeSteps={simSteps} 
                  currentStepIndex={currentStepIdx}
                  packetPos={packetPos}
                  simSpeed={simSpeed}
                />
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
              <div className="lg:col-span-4 flex flex-col gap-4 h-full overflow-hidden">
                <div className="shrink-0">
                  <TaskForm onTaskAdded={handleTaskAdded} onDraftChange={handleDraftChange} />
                </div>
                <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 p-4 overflow-hidden flex flex-col">
                  <TaskList 
                    tasks={tasks} 
                    role={role}
                    onEdit={setIsEditingTask}
                    onDelete={handleTaskDeleted}
                    onStatusUpdate={handleStatusUpdate}
                  />
                </div>
              </div>
              
              <div className="lg:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-center mb-4 shrink-0">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Network className="w-4 h-4 text-indigo-500" />
                    Live Neural Tree Preview
                  </h3>
                  <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Ghost Node Active</span>
                  </div>
                </div>
                <div className="flex-1 min-h-[400px] rounded-xl overflow-hidden border border-slate-800/50">
                  <VisualBST 
                    nodes={visualNodes} 
                    previewNode={previewNode}
                    activeSteps={simSteps} 
                    currentStepIndex={currentStepIdx}
                    packetPos={packetPos}
                    simSpeed={simSpeed}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hr' && <EmployeeManager />}
          
          {activeTab === 'audit' && <AuditLog />}
          
          {activeTab === 'analytics' && (
            <AnalyticsDashboard 
              employees={employees} 
              tasks={tasks} 
              bstStats={bstStats} 
            />
          )}

          {activeTab === 'benchmarks' && (
            <BenchmarkDashboard 
              benchmarks={benchmarks} 
              bstStats={bstStats}
              bst={bstRef.current}
              employees={employees}
              onBenchmarkRecorded={(records) => setBenchmarks(prev => [...prev, ...records])}
            />
          )}

          {activeTab === 'my-tasks' && <MyTasks />}
        </main>
      </div>

      <Inspector 
        selectedTask={selectedTask} 
        selectedEmployee={selectedEmployee} 
        activeStep={simSteps[currentStepIdx]}
        bstStats={bstStats}
      />

      {['CEO', 'MD', 'Team Leader'].includes(role) && activeTab !== 'my-tasks' && (
        <div className="fixed bottom-8 right-88 z-20 w-80 animate-in slide-in-from-bottom-8">
          <AssignmentPanel 
            bst={bstRef.current} 
            onAssignmentComplete={handleAssignmentComplete}
            onStartSim={handleAssignmentStart}
            onBenchmarkRecorded={(records) => setBenchmarks(prev => [...prev, ...records])}
          />
        </div>
      )}

      {isEditingTask && (
        <TaskEditModal 
          task={isEditingTask} 
          onClose={() => setIsEditingTask(null)}
          onUpdated={handleTaskUpdated}
        />
      )}
    </div>
  );
}

export default App;
