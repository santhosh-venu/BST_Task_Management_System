import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VisualNode, SimulationStep } from '../lib/types';
import { Activity } from 'lucide-react';

interface VisualBSTProps {
  nodes: VisualNode[];
  previewNode?: VisualNode | null;
  activeSteps: SimulationStep[];
  currentStepIndex: number;
  packetPos?: { x: number, y: number } | null;
  simSpeed: number;
}

export const VisualBST: React.FC<VisualBSTProps> = ({ nodes, previewNode, activeSteps, currentStepIndex, packetPos, simSpeed }) => {
  const activeNodeId = activeSteps[currentStepIndex]?.nodeId;
  
  const allNodes = useMemo(() => {
    return previewNode ? [...nodes, previewNode] : nodes;
  }, [nodes, previewNode]);

  const edges = useMemo(() => {
    const lines: { x1: number, y1: number, x2: number, y2: number, id: string, isPreview?: boolean }[] = [];
    
    nodes.forEach(node => {
      if (node.leftId) {
        const left = nodes.find(n => n.id === node.leftId);
        if (left) lines.push({ x1: node.x, y1: node.y, x2: left.x, y2: left.y, id: `${node.id}-${left.id}` });
      }
      if (node.rightId) {
        const right = nodes.find(n => n.id === node.rightId);
        if (right) lines.push({ x1: node.x, y1: node.y, x2: right.x, y2: right.y, id: `${node.id}-${right.id}` });
      }
    });

    if (previewNode && previewNode.parentId) {
      const parent = nodes.find(n => n.id === previewNode.parentId);
      if (parent) {
        lines.push({
          x1: parent.x, y1: parent.y, x2: previewNode.x, y2: previewNode.y,
          id: `preview-edge-${parent.id}`,
          isPreview: true
        });
      }
    }

    return lines;
  }, [nodes, previewNode]);

  const getNodeState = (nodeId: string) => {
    if (nodeId === 'preview-node') return 'preview';
    const step = activeSteps.find((s, idx) => s.nodeId === nodeId && idx <= currentStepIndex);
    if (!step) return 'idle';
    const currentStep = activeSteps[currentStepIndex];
    if (currentStep?.nodeId === nodeId) return currentStep.type;
    
    const historicalSteps = activeSteps.slice(0, currentStepIndex);
    const lastState = historicalSteps.reverse().find(s => s.nodeId === nodeId);
    return lastState?.type || 'visit';
  };

  const colors = {
    idle: '#1e293b', 
    visit: '#eab308', 
    compare: '#eab308', 
    match: '#22c55e', 
    reject: '#ef4444', 
    candidate: '#3b82f6',
    skill_mismatch: '#f97316',
    preview: '#6366f1',
    rotate: '#d946ef' // Fuchsia for AVL rotations
  };

  const cardWidth = 120;
  const cardHeight = 70;

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <svg className="w-full h-full" viewBox="0 0 1000 750">
        <defs>
          <filter id="glow-node" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Edges */}
        {edges.map(edge => (
          <g key={edge.id}>
            <line
              x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2}
              stroke={edge.isPreview ? "#6366f1" : "#1e293b"}
              strokeWidth="2"
              strokeDasharray={edge.isPreview ? "6 6" : "4 4"}
              opacity={edge.isPreview ? 0.5 : 1}
            />
            {edge.isPreview && (
              <motion.line
                x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2}
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray="6 6"
                initial={{ strokeDashoffset: 12 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                opacity={0.8}
              />
            )}
            {!edge.isPreview && activeSteps.some((s, i) => i <= currentStepIndex && (s.nodeId === edge.id.split('-')[0] || s.nodeId === edge.id.split('-')[1])) && (
              <motion.line
                x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2}
                stroke="#4f46e5"
                strokeWidth="3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </g>
        ))}

        {/* Nodes as Task Cards */}
        <AnimatePresence>
          {allNodes.map(node => {
            const currentStep = activeSteps[currentStepIndex];
            const isRotating = currentStep?.type === 'rotate' && currentStep?.rotatingNodes?.includes(node.id);
            const isActive = node.id === activeNodeId || isRotating;
            
            const state = isRotating ? 'rotate' : getNodeState(node.id);
            const color = colors[state as keyof typeof colors];
            
            const bf = node.balanceFactor || 0;
            const bfColor = bf === 0 ? '#22c55e' : Math.abs(bf) === 1 ? '#eab308' : '#ef4444';
            
            return (
              <g key={node.id}>
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: node.isPreview ? 0.7 : 1,
                    filter: isActive || node.isPreview ? 'url(#glow-node)' : 'none'
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                  <rect
                    x={node.x - cardWidth / 2}
                    y={node.y - cardHeight / 2}
                    width={cardWidth}
                    height={cardHeight}
                    rx="12"
                    fill="#0f172a"
                    stroke={color}
                    strokeWidth={isActive ? 3 : 1.5}
                    strokeDasharray={node.isPreview ? "4 4" : "none"}
                    className="transition-colors duration-300"
                  />
                  
                  <rect
                    x={node.x - cardWidth / 2}
                    y={node.y - cardHeight / 2}
                    width={cardWidth}
                    height="20"
                    rx="12"
                    fill={color}
                    fillOpacity={node.isPreview ? "0.2" : "0.1"}
                  />

                  {/* Balance Factor Badge */}
                  {!node.isPreview && (
                    <g transform={`translate(${node.x + cardWidth / 2 - 12}, ${node.y - cardHeight / 2 + 12})`}>
                      <title>Balance Factor</title>
                      <circle cx="0" cy="0" r="8" fill="#0f172a" stroke={bfColor} strokeWidth="1.5" />
                      <text x="0" y="3" fontSize="8" fill={bfColor} textAnchor="middle" fontWeight="bold">
                        {bf > 0 ? `+${bf}` : bf}
                      </text>
                    </g>
                  )}

                  <text
                    x={node.x}
                    y={node.y - 18}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill={color}
                    className="uppercase tracking-widest font-mono pointer-events-none"
                  >
                    {node.isPreview ? 'GHOST NODE' : (node.task.title.length > 15 ? node.task.title.slice(0, 13) + '..' : node.task.title)}
                  </text>

                  <text
                    x={node.x}
                    y={node.y + 12}
                    textAnchor="middle"
                    fontSize="18"
                    fontWeight="900"
                    fill="#fff"
                    className="font-mono pointer-events-none"
                  >
                    {node.task.cognitive_load}
                  </text>

                  {/* Skills Preview */}
                  <g transform={`translate(${node.x - cardWidth/2 + 10}, ${node.y + 22})`}>
                    {node.task.required_skills.slice(0, 2).map((skill, i) => (
                      <text
                        key={skill}
                        x={i * 45}
                        y={0}
                        fontSize="6"
                        fill={node.isPreview ? "#818cf8" : "#6366f1"}
                        fontWeight="bold"
                        className="uppercase"
                      >
                        {skill}
                      </text>
                    ))}
                  </g>
                </motion.g>

                <AnimatePresence>
                  {isActive && activeSteps[currentStepIndex]?.comparison && (
                    <motion.g
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: -cardHeight / 2 - 25 }}
                      exit={{ opacity: 0 }}
                    >
                      <rect 
                        x={node.x - 45} y={-12} width="90" height="18" rx="6" 
                        fill="#1e1b4b" stroke="#4338ca" strokeWidth="1"
                      />
                      <text
                        x={node.x}
                        y={1}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#a5b4fc"
                        fontWeight="bold"
                        className="font-mono"
                      >
                        {activeSteps[currentStepIndex].comparison}
                      </text>
                    </motion.g>
                  )}
                </AnimatePresence>
              </g>
            );
          })}
        </AnimatePresence>

        {/* Packet Simulation */}
        <AnimatePresence>
          {packetPos && (
            <g>
              <motion.circle
                cx={packetPos.x}
                cy={packetPos.y}
                r="12"
                fill="#6366f1"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.4, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                style={{ filter: 'blur(4px)' }}
              />
              <motion.circle
                cx={packetPos.x}
                cy={packetPos.y}
                r="6"
                fill="#fff"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                style={{ filter: 'drop-shadow(0 0 10px #6366f1)' }}
              />
            </g>
          )}
        </AnimatePresence>
      </svg>

      <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between pointer-events-none">
        <div className="bg-slate-900/95 backdrop-blur-2xl p-5 rounded-3xl border border-slate-800 shadow-2xl max-w-lg w-full pointer-events-auto ring-1 ring-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/20 p-2 rounded-xl">
                <Activity className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Neural Router Status</h4>
                <p className="text-[9px] text-slate-600 font-medium">Awaiting operations</p>
              </div>
            </div>
            {activeSteps.length > 0 && (
              <div className="flex gap-2">
                <div className="px-2 py-1 bg-slate-800 rounded-lg border border-slate-700">
                  <span className="text-[9px] font-mono text-indigo-400">STEP {currentStepIndex + 1}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50">
            <p className="text-sm font-mono text-slate-200 leading-relaxed min-h-[40px] flex items-center">
              {activeSteps[currentStepIndex]?.message || 'System Standby. Awaiting packet injection or routing trigger...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
