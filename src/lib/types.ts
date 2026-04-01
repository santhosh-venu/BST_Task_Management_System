export type UserRole = 'CEO' | 'MD' | 'HR' | 'Team Leader' | 'Employee';

export type Department = 'Engineering' | 'DevOps' | 'Design' | 'Marketing' | 'HR' | 'General';

export type Skill = 'React' | 'TypeScript' | 'Node.js' | 'PostgreSQL' | 'UI/UX' | 'AWS' | 'Python' | 'Security';

export interface Task {
  id: string;
  title: string;
  description: string;
  effort: number;
  urgency: number;
  duration: number;
  cognitive_load: number;
  department: Department;
  required_skills: Skill[];
  status: 'pending' | 'assigned' | 'completed';
  created_at: string;
}

export interface Employee {
  id: string;
  name: string;
  experience: number;
  role: string;
  department: Department;
  skills: Skill[];
  created_at?: string;
}

export interface AssignmentRecord {
  id: string;
  task_id: string;
  employee_id: string;
  assigned_at: string;
  final_capacity_used: number;
  justification: string;
  tasks?: Task;
  employees?: Employee;
}

export interface EmployeeWithStats extends Employee {
  current_load: number;
  max_capacity: number;
  workload_percentage: number;
  assigned_tasks: Task[];
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  actor_role: UserRole;
  old_value?: any;
  new_value?: any;
  created_at: string;
}

export interface VisualNode {
  id: string;
  task: Task;
  x: number;
  y: number;
  leftId: string | null;
  rightId: string | null;
  level: number;
  height: number;
  balanceFactor?: number;
  isPreview?: boolean;
  parentId?: string;
}

export interface SimulationStep {
  nodeId: string;
  type: 'visit' | 'compare' | 'match' | 'reject' | 'candidate' | 'skill_mismatch' | 'rotate';
  message: string;
  comparison?: string;
  rotatingNodes?: string[];
}

export interface AssignmentResult {
  success: boolean;
  task?: Task;
  message: string;
  iterations?: number;
  finalCapacity?: number;
  executionTimeMs?: number;
  steps?: number;
}

export interface BenchmarkRecord {
  id: string;
  timestamp: number;
  algorithm: 'BST' | 'AVL' | 'AI';
  executionTimeMs: number;
  steps: number;
  nodes: number;
  treeHeight: number;
}
