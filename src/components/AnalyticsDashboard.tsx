import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Task, EmployeeWithStats, Skill } from '../lib/types';
import { BarChart3, TrendingUp, Activity, Building2, ShieldAlert, Target } from 'lucide-react';

interface AnalyticsDashboardProps {
  employees: EmployeeWithStats[];
  tasks: Task[];
  bstStats: { comparisons: number, height: number, nodes: number, efficiency: number };
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ employees, tasks, bstStats }) => {
  
  const saturationStats = useMemo(() => {
    const totalCapacity = employees.reduce((sum, e) => sum + e.max_capacity, 0);
    const totalLoad = employees.reduce((sum, e) => sum + e.current_load, 0);
    const saturation = totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0;
    return { saturation, totalCapacity, totalLoad };
  }, [employees]);

  const skillGapOption = useMemo(() => {
    const allSkills: Skill[] = ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'UI/UX', 'AWS', 'Python', 'Security'];
    
    const skillSupply = allSkills.map(skill => 
      employees.filter(e => e.skills.includes(skill)).length
    );
    
    const skillDemand = allSkills.map(skill => 
      tasks.filter(t => t.required_skills.includes(skill)).length
    );

    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      legend: { data: ['Supply (Nodes)', 'Demand (Packets)'], textStyle: { color: '#94a3b8', fontSize: 10 }, bottom: 0 },
      radar: {
        indicator: allSkills.map(s => ({ name: s, max: Math.max(...skillSupply, ...skillDemand, 1) })),
        splitArea: { show: false },
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLine: { lineStyle: { color: '#1e293b' } }
      },
      series: [{
        type: 'radar',
        data: [
          { value: skillSupply, name: 'Supply (Nodes)', itemStyle: { color: '#6366f1' }, areaStyle: { opacity: 0.1 } },
          { value: skillDemand, name: 'Demand (Packets)', itemStyle: { color: '#f59e0b' }, areaStyle: { opacity: 0.1 } }
        ]
      }]
    };
  }, [employees, tasks]);

  const workloadOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: employees.map(e => e.name.split(' ')[0]),
      axisLabel: { color: '#64748b', fontSize: 10 },
      axisLine: { lineStyle: { color: '#1e293b' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#64748b', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1e293b' } }
    },
    series: [{
      data: employees.map(e => e.workload_percentage),
      type: 'bar',
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: '#6366f1' }, { offset: 1, color: '#4f46e5' }]
        },
        borderRadius: [4, 4, 0, 0]
      }
    }]
  };

  const saturationOption = {
    backgroundColor: 'transparent',
    series: [{
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      center: ['50%', '75%'],
      radius: '100%',
      min: 0, max: 100,
      axisLine: {
        lineStyle: { width: 6, color: [[0.6, '#10b981'], [0.85, '#f59e0b'], [1, '#ef4444']] }
      },
      pointer: { icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z', length: '12%', width: 10, offsetCenter: [0, '-60%'], itemStyle: { color: 'auto' } },
      detail: { fontSize: 24, offsetCenter: [0, '-10%'], valueAnimation: true, formatter: '{value}%', color: 'inherit' },
      data: [{ value: saturationStats.saturation }]
    }]
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 lg:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-500/20 p-2 rounded-lg">
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">System Saturation</h3>
          </div>
          <div className="h-[200px]">
            <ReactECharts option={saturationOption} style={{ height: '100%' }} />
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-500/20 p-2 rounded-lg">
              <Target className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Predictive Skill Gap Analysis</h3>
          </div>
          <div className="h-[250px]">
            <ReactECharts option={skillGapOption} style={{ height: '100%' }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-500/20 p-2 rounded-lg">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Workload Distribution (%)</h3>
          </div>
          <ReactECharts option={workloadOption} style={{ height: '250px' }} />
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-red-500/20 p-2 rounded-lg">
              <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Structural Health (AVL)</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Efficiency Factor</p>
              <p className="text-2xl font-mono text-white mt-1">{Math.round((bstStats.efficiency || 0) * 100)}%</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Search Latency</p>
              <p className="text-2xl font-mono text-white mt-1">{bstStats.comparisons} <span className="text-xs text-slate-600">Ops</span></p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Node Count</p>
              <p className="text-2xl font-mono text-white mt-1">{bstStats.nodes}</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Tree Height</p>
              <p className="text-2xl font-mono text-white mt-1">{bstStats.height}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
