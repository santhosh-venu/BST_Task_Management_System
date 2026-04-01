import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { BenchmarkRecord, EmployeeWithStats, Task } from '../lib/types';
import { TaskBST } from '../lib/bst';
import { findTaskForEmployee, findTaskWithAI } from '../lib/assignmentLogic';
import { Gauge, Timer, Activity, BarChart2, Play, Loader2, Network } from 'lucide-react';

interface BenchmarkDashboardProps {
  benchmarks: BenchmarkRecord[];
  bstStats: { comparisons: number, height: number, nodes: number, efficiency: number };
  bst: TaskBST;
  employees: EmployeeWithStats[];
  onBenchmarkRecorded: (records: BenchmarkRecord[]) => void;
}

export const BenchmarkDashboard: React.FC<BenchmarkDashboardProps> = ({ 
  benchmarks, 
  bstStats, 
  bst, 
  employees,
  onBenchmarkRecorded 
}) => {
  const [isStressTesting, setIsStressTesting] = useState(false);

  const runStressTest = async () => {
    if (employees.length === 0 || bstStats.nodes === 0) {
      alert("Need at least 1 employee and 1 task in the system to run stress test.");
      return;
    }
    
    setIsStressTesting(true);
    
    // Simulate async work so UI can update to show loader
    await new Promise(resolve => setTimeout(resolve, 50));

    const ITERATIONS = 10000;
    const testEmployee = employees[0];
    const allTasks = bst.inorderTraversal();
    
    // Test BST/AVL
    const bstStart = performance.now();
    let bstSteps = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      const res = findTaskForEmployee(bst, testEmployee);
      if (i === 0) bstSteps = bst.getStats().comparisons;
    }
    const bstEnd = performance.now();
    const bstAvgTime = (bstEnd - bstStart) / ITERATIONS;

    // Test AI
    const aiStart = performance.now();
    let aiSteps = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      const res = findTaskWithAI(allTasks, testEmployee);
      if (i === 0) aiSteps = res.steps || allTasks.length;
    }
    const aiEnd = performance.now();
    const aiAvgTime = (aiEnd - aiStart) / ITERATIONS;

    const timestamp = Date.now();
    const newRecords: BenchmarkRecord[] = [
      {
        id: crypto.randomUUID(),
        timestamp,
        algorithm: bst.isAVL ? 'AVL' : 'BST',
        executionTimeMs: bstAvgTime,
        steps: bstSteps,
        nodes: bstStats.nodes,
        treeHeight: bstStats.height
      },
      {
        id: crypto.randomUUID(),
        timestamp,
        algorithm: 'AI',
        executionTimeMs: aiAvgTime,
        steps: aiSteps,
        nodes: bstStats.nodes,
        treeHeight: bstStats.height
      }
    ];

    onBenchmarkRecorded(newRecords);
    setIsStressTesting(false);
  };

  // Calculate Averages
  const averages = useMemo(() => {
    const bstRecords = benchmarks.filter(b => b.algorithm === 'BST');
    const avlRecords = benchmarks.filter(b => b.algorithm === 'AVL');
    const aiRecords = benchmarks.filter(b => b.algorithm === 'AI');

    const getAvg = (arr: BenchmarkRecord[], key: keyof BenchmarkRecord) => 
      arr.length ? arr.reduce((sum, r) => sum + (r[key] as number), 0) / arr.length : 0;

    return {
      BST: { time: getAvg(bstRecords, 'executionTimeMs'), steps: getAvg(bstRecords, 'steps') },
      AVL: { time: getAvg(avlRecords, 'executionTimeMs'), steps: getAvg(avlRecords, 'steps') },
      AI: { time: getAvg(aiRecords, 'executionTimeMs'), steps: getAvg(aiRecords, 'steps') }
    };
  }, [benchmarks]);

  const barChartOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', formatter: '{b}: {c} ms' },
    xAxis: {
      type: 'category',
      data: ['BST O(log n)', 'AVL O(log n)', 'AI Greedy O(n)'],
      axisLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
      axisLine: { lineStyle: { color: '#1e293b' } }
    },
    yAxis: {
      type: 'value',
      name: 'Time (ms)',
      nameTextStyle: { color: '#64748b', fontSize: 10 },
      axisLabel: { color: '#64748b', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1e293b' } }
    },
    series: [{
      data: [
        { value: averages.BST.time, itemStyle: { color: '#6366f1' } },
        { value: averages.AVL.time, itemStyle: { color: '#d946ef' } },
        { value: averages.AI.time, itemStyle: { color: '#f59e0b' } }
      ],
      type: 'bar',
      barWidth: '40%',
      borderRadius: [4, 4, 0, 0]
    }]
  }), [averages]);

  const stepsChartOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', formatter: '{b}: {c} steps' },
    xAxis: {
      type: 'category',
      data: ['BST', 'AVL', 'AI Greedy'],
      axisLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
      axisLine: { lineStyle: { color: '#1e293b' } }
    },
    yAxis: {
      type: 'value',
      name: 'Traversal Steps',
      nameTextStyle: { color: '#64748b', fontSize: 10 },
      axisLabel: { color: '#64748b', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1e293b' } }
    },
    series: [{
      data: [
        { value: averages.BST.steps, itemStyle: { color: '#6366f1' } },
        { value: averages.AVL.steps, itemStyle: { color: '#d946ef' } },
        { value: averages.AI.steps, itemStyle: { color: '#f59e0b' } }
      ],
      type: 'bar',
      barWidth: '40%',
      borderRadius: [4, 4, 0, 0]
    }]
  }), [averages]);

  const lineChartOption = useMemo(() => {
    // Group by timestamp to align the series
    const timestamps = Array.from(new Set(benchmarks.map(b => b.timestamp))).sort((a, b) => a - b).slice(-20); // last 20 runs
    
    const getSeriesData = (algo: string) => {
      return timestamps.map(ts => {
        const record = benchmarks.find(b => b.timestamp === ts && b.algorithm === algo);
        return record ? record.executionTimeMs : null;
      });
    };

    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      legend: { data: ['BST', 'AVL', 'AI'], textStyle: { color: '#94a3b8', fontSize: 10 }, bottom: 0 },
      xAxis: {
        type: 'category',
        data: timestamps.map((_, i) => `Run ${i + 1}`),
        axisLabel: { color: '#64748b', fontSize: 10 },
        axisLine: { lineStyle: { color: '#1e293b' } }
      },
      yAxis: {
        type: 'value',
        name: 'Time (ms)',
        nameTextStyle: { color: '#64748b', fontSize: 10 },
        axisLabel: { color: '#64748b', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      series: [
        { name: 'BST', type: 'line', smooth: true, data: getSeriesData('BST'), itemStyle: { color: '#6366f1' } },
        { name: 'AVL', type: 'line', smooth: true, data: getSeriesData('AVL'), itemStyle: { color: '#d946ef' } },
        { name: 'AI', type: 'line', smooth: true, data: getSeriesData('AI'), itemStyle: { color: '#f59e0b' } }
      ]
    };
  }, [benchmarks]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full overflow-y-auto custom-scrollbar pr-2">
      <div className="flex justify-between items-center bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Gauge className="w-6 h-6 text-indigo-500" />
            Algorithmic Benchmarking
          </h2>
          <p className="text-slate-500 text-sm mt-1">Empirical performance tracking for O(log n) vs O(n) routing.</p>
        </div>
        <button
          onClick={runStressTest}
          disabled={isStressTesting}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-900/20 flex items-center gap-2"
        >
          {isStressTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Run Stress Test (10,000x)
        </button>
      </div>

      {/* Real-time Metrics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Network className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Nodes</span>
          </div>
          <p className="text-2xl font-mono font-bold text-white">{bstStats.nodes}</p>
        </div>
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tree Height</span>
          </div>
          <p className="text-2xl font-mono font-bold text-white">{bstStats.height}</p>
        </div>
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="w-4 h-4 text-fuchsia-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg AVL Time</span>
          </div>
          <p className="text-2xl font-mono font-bold text-white">{averages.AVL.time.toFixed(4)}<span className="text-xs text-slate-500 ml-1">ms</span></p>
        </div>
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg AI Time</span>
          </div>
          <p className="text-2xl font-mono font-bold text-white">{averages.AI.time.toFixed(4)}<span className="text-xs text-slate-500 ml-1">ms</span></p>
        </div>
      </div>

      {/* Charts */}
      {benchmarks.length === 0 ? (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 flex flex-col items-center justify-center text-center">
          <Gauge className="w-12 h-12 text-slate-700 mb-4" />
          <h3 className="text-lg font-bold text-slate-300">No Benchmark Data Available</h3>
          <p className="text-slate-500 text-sm mt-2 max-w-md">
            Run an algorithmic comparison in the routing engine or click "Run Stress Test" to generate empirical performance data.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Execution Time Comparison</h3>
            <ReactECharts option={barChartOption} style={{ height: '300px' }} />
          </div>
          
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Traversal Steps (Depth)</h3>
            <ReactECharts option={stepsChartOption} style={{ height: '300px' }} />
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg lg:col-span-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Performance Trend Over Time</h3>
            <ReactECharts option={lineChartOption} style={{ height: '300px' }} />
          </div>
        </div>
      )}
    </div>
  );
};
