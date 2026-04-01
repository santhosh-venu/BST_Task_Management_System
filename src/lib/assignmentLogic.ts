import { TaskBST } from './bst';
import { Task, AssignmentResult, Employee, EmployeeWithStats } from './types';
import { supabase } from './supabase';

const BASE_LOAD_CAPACITY = 20;
const EXPERIENCE_FACTOR = 15;
const RELAXATION_MULTIPLIER = 1.2;

export const calculateMaxLoad = (experience: number): number => {
  return BASE_LOAD_CAPACITY + (experience * EXPERIENCE_FACTOR);
};

/**
 * findTaskForEmployee: Multi-Constraint Search (BST Algorithm)
 * O(log n) - Pure greedy fit for maximum cognitive load within capacity.
 */
export const findTaskForEmployee = (
  bst: TaskBST, 
  employee: Employee
): AssignmentResult => {
  const start = performance.now();
  let currentCapacity = calculateMaxLoad(employee.experience);
  let task: Task | null = null;
  let iterations = 0;
  const maxIterations = 20;

  while (!task && iterations < maxIterations) {
    iterations++;
    task = bst.findMaxLessThanOrEqual(currentCapacity, employee.skills);

    if (task) {
      const end = performance.now();
      return {
        success: true,
        task,
        message: `BST selected "${task.title}". Reason: Largest cognitive load (${task.cognitive_load}) that perfectly fits the capacity constraint (${Math.round(currentCapacity)}).`,
        iterations,
        finalCapacity: currentCapacity,
        executionTimeMs: end - start
      };
    }
    
    currentCapacity *= RELAXATION_MULTIPLIER;
  }

  const end = performance.now();
  return {
    success: false,
    message: "BST: No compatible packets (skill match) available in the neural tree.",
    executionTimeMs: end - start
  };
};

/**
 * findTaskWithAI: AI Greedy Scoring Algorithm
 * O(n) - Evaluates urgency, fairness, and effort efficiency.
 */
export const findTaskWithAI = (
  tasks: Task[], 
  employee: EmployeeWithStats
): AssignmentResult => {
  const start = performance.now();
  let bestTask: Task | null = null;
  let bestScore = -Infinity;
  let reason = "AI: No compatible packets found.";

  const maxCapacity = calculateMaxLoad(employee.experience);
  const availableCapacity = Math.max(0, maxCapacity - employee.current_load);

  for (const task of tasks) {
    // Hard constraint: Skills
    const hasSkills = task.required_skills.every(s => employee.skills.includes(s));
    if (!hasSkills) continue;

    // Scoring factors
    // 1. Load Fit: Prefer tasks that fit within available capacity, penalize exceeding it heavily.
    const loadFit = task.cognitive_load <= availableCapacity 
      ? (task.cognitive_load / availableCapacity) // Closer to 1 is better
      : -((task.cognitive_load - availableCapacity) / maxCapacity); // Negative penalty

    // 2. Urgency Bonus: High urgency gets a massive boost
    const urgencyBonus = (task.urgency / 10) * 2; 

    // 3. Fairness/Burnout protection: If employee is overloaded, prefer smaller tasks
    const fairnessScore = employee.workload_percentage > 80 
      ? -(task.cognitive_load / maxCapacity) 
      : 0;

    // AI Score formula
    const score = loadFit + urgencyBonus + fairnessScore;

    if (score > bestScore) {
      bestScore = score;
      bestTask = task;
      
      let primaryReason = '';
      if (urgencyBonus > 1.5) primaryReason = `Critical urgency (${task.urgency}/10)`;
      else if (fairnessScore < 0) primaryReason = `Workload protection (Node at ${employee.workload_percentage}%)`;
      else primaryReason = `Optimal capacity utilization`;

      reason = `AI selected "${task.title}". Reason: Prioritized due to ${primaryReason}, balancing holistic network health over pure load matching.`;
    }
  }

  const end = performance.now();

  if (bestTask) {
    return {
      success: true,
      task: bestTask,
      message: reason,
      finalCapacity: maxCapacity,
      executionTimeMs: end - start,
      steps: tasks.length // O(n) scan
    };
  }

  return { 
    success: false, 
    message: reason,
    executionTimeMs: end - start,
    steps: tasks.length
  };
};

export const suggestRebalance = (employees: EmployeeWithStats[]) => {
  const overloaded = employees.filter(e => e.workload_percentage > 100);
  const underloaded = employees.filter(e => e.workload_percentage < 60);

  if (overloaded.length === 0 || underloaded.length === 0) return null;

  for (const source of overloaded) {
    for (const task of source.assigned_tasks) {
      const target = underloaded.find(e => {
        const potentialLoad = e.current_load + task.cognitive_load;
        const skillMatch = task.required_skills.every(s => e.skills.includes(s));
        return potentialLoad <= e.max_capacity && skillMatch;
      });

      if (target) {
        return {
          task,
          source,
          target,
          reason: `Transferring "${task.title}" to compatible node ${target.name} will reduce ${source.name}'s load.`
        };
      }
    }
  }
  return null;
};

export const commitAssignment = async (task: Task, employee: Employee, result: AssignmentResult) => {
  const { error: taskError } = await supabase
    .from('tasks')
    .update({ status: 'assigned' })
    .eq('id', task.id);

  if (taskError) throw taskError;

  const { error: assignError } = await supabase
    .from('assignments')
    .insert({
      task_id: task.id,
      employee_id: employee.id,
      final_capacity_used: Math.round(result.finalCapacity || 0),
      justification: result.message
    });

  if (assignError) throw assignError;
};

export const transferTask = async (taskId: string, sourceEmployeeId: string, targetEmployeeId: string) => {
  const { error: delError } = await supabase
    .from('assignments')
    .delete()
    .eq('task_id', taskId)
    .eq('employee_id', sourceEmployeeId);

  if (delError) throw delError;

  const { error: insError } = await supabase
    .from('assignments')
    .insert({
      task_id: taskId,
      employee_id: targetEmployeeId,
      final_capacity_used: 0,
      justification: "System-initiated Neural Rebalance"
    });

  if (insError) throw insError;
};
