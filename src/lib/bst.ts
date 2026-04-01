import { Task, VisualNode, SimulationStep, Skill } from './types';

class TreeNode {
  task: Task;
  left: TreeNode | null = null;
  right: TreeNode | null = null;
  height: number = 1;
  x: number = 0;
  y: number = 0;
  level: number = 0;
  minX: number = 0;
  maxX: number = 1000;

  constructor(task: Task) {
    this.task = task;
  }
}

export interface BSTMetrics {
  comparisons: number;
  height: number;
  nodes: number;
  efficiency: number;
}

export class TaskBST {
  root: TreeNode | null = null;
  isAVL: boolean = true;
  lastRotations: SimulationStep[] = [];
  private lastOpComparisons = 0;

  private getHeight(node: TreeNode | null): number {
    return node ? node.height : 0;
  }

  private getBalance(node: TreeNode | null): number {
    return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
  }

  private rightRotate(y: TreeNode): TreeNode {
    const x = y.left!;
    const T2 = x.right;
    x.right = y;
    y.left = T2;
    y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;
    x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;
    return x;
  }

  private leftRotate(x: TreeNode): TreeNode {
    const y = x.right!;
    const T2 = y.left;
    y.left = x;
    x.right = T2;
    x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;
    y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;
    return y;
  }

  insert(task: Task, silent = false): void {
    this.lastRotations = [];
    this.root = this._insert(this.root, task);
    this.updateLayout();
    if (silent) this.lastRotations = [];
  }

  private _insert(node: TreeNode | null, task: Task): TreeNode {
    if (!node) return new TreeNode(task);

    if (task.cognitive_load < node.task.cognitive_load) {
      node.left = this._insert(node.left, task);
    } else {
      node.right = this._insert(node.right, task);
    }

    node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
    
    if (!this.isAVL) return node;

    const balance = this.getBalance(node);

    if (balance > 1 && task.cognitive_load < node.left!.task.cognitive_load) {
      this.lastRotations.push({
        nodeId: node.task.id,
        type: 'rotate',
        message: 'LL Imbalance detected: Performing Right Rotation.',
        rotatingNodes: [node.task.id, node.left!.task.id]
      });
      return this.rightRotate(node);
    }
    if (balance < -1 && task.cognitive_load >= node.right!.task.cognitive_load) {
      this.lastRotations.push({
        nodeId: node.task.id,
        type: 'rotate',
        message: 'RR Imbalance detected: Performing Left Rotation.',
        rotatingNodes: [node.task.id, node.right!.task.id]
      });
      return this.leftRotate(node);
    }
    if (balance > 1 && task.cognitive_load >= node.left!.task.cognitive_load) {
      this.lastRotations.push({
        nodeId: node.task.id,
        type: 'rotate',
        message: 'LR Imbalance detected: Performing Left-Right Rotation.',
        rotatingNodes: [node.task.id, node.left!.task.id, node.left!.right!.task.id]
      });
      node.left = this.leftRotate(node.left!);
      return this.rightRotate(node);
    }
    if (balance < -1 && task.cognitive_load < node.right!.task.cognitive_load) {
      this.lastRotations.push({
        nodeId: node.task.id,
        type: 'rotate',
        message: 'RL Imbalance detected: Performing Right-Left Rotation.',
        rotatingNodes: [node.task.id, node.right!.task.id, node.right!.left!.task.id]
      });
      node.right = this.rightRotate(node.right!);
      return this.leftRotate(node);
    }

    return node;
  }

  getInsertionPath(task: Task): SimulationStep[] {
    const steps: SimulationStep[] = [];
    let curr = this.root;
    this.lastOpComparisons = 0;
    
    while (curr) {
      this.lastOpComparisons++;
      const comparison = `${task.cognitive_load} ${task.cognitive_load < curr.task.cognitive_load ? '<' : '>='} ${curr.task.cognitive_load}`;
      steps.push({
        nodeId: curr.task.id,
        type: 'compare',
        message: `Routing Packet: ${comparison}`,
        comparison
      });

      if (task.cognitive_load < curr.task.cognitive_load) {
        if (!curr.left) break;
        curr = curr.left;
      } else {
        if (!curr.right) break;
        curr = curr.right;
      }
    }
    return steps;
  }

  getPreviewNode(task: Partial<Task>): VisualNode | null {
    if (task.cognitive_load === undefined) return null;

    let curr = this.root;
    let parent: TreeNode | null = null;
    let isLeft = false;

    while (curr) {
      parent = curr;
      if (task.cognitive_load < curr.task.cognitive_load) {
        isLeft = true;
        curr = curr.left;
      } else {
        isLeft = false;
        curr = curr.right;
      }
    }

    let x = 500, y = 80, level = 0;
    if (parent) {
      y = parent.y + 140;
      level = parent.level + 1;
      if (isLeft) {
        x = (parent.minX + parent.x) / 2;
      } else {
        x = (parent.x + parent.maxX) / 2;
      }
    }

    return {
      id: 'preview-node',
      task: {
        id: 'preview-node',
        title: task.title || 'DRAFT_PACKET',
        cognitive_load: task.cognitive_load,
        required_skills: task.required_skills || [],
        department: task.department || 'General',
        effort: task.effort || 0,
        urgency: task.urgency || 0,
        duration: task.duration || 0,
        status: 'pending',
        created_at: new Date().toISOString()
      } as Task,
      x, y, level, height: 1, leftId: null, rightId: null,
      balanceFactor: 0,
      isPreview: true,
      parentId: parent ? parent.task.id : undefined
    };
  }

  findMaxLTEWithSteps(capacity: number, requiredSkills?: Skill[]): { task: Task | null; steps: SimulationStep[] } {
    const steps: SimulationStep[] = [];
    this.lastOpComparisons = 0;
    const result = this._findMaxLTE(this.root, capacity, steps, requiredSkills);
    return { task: result, steps };
  }

  findMaxLessThanOrEqual(capacity: number, requiredSkills?: Skill[]): Task | null {
    this.lastOpComparisons = 0;
    return this._findMaxLTE(this.root, capacity, [], requiredSkills);
  }

  private _findMaxLTE(node: TreeNode | null, capacity: number, steps: SimulationStep[], requiredSkills?: Skill[]): Task | null {
    if (!node) return null;
    this.lastOpComparisons++;

    const comparison = `${node.task.cognitive_load} <= ${Math.round(capacity)}`;
    const hasRequiredSkills = !requiredSkills || requiredSkills.length === 0 || 
      node.task.required_skills.every(skill => requiredSkills.includes(skill));

    steps.push({
      nodeId: node.task.id,
      type: 'visit',
      message: `Inspecting Node: ${comparison}${!hasRequiredSkills ? ' (Skill Mismatch)' : ''}`,
      comparison
    });

    if (node.task.cognitive_load === capacity && hasRequiredSkills) {
      steps.push({ nodeId: node.task.id, type: 'match', message: 'Exact match found!', comparison: 'MATCH' });
      return node.task;
    }

    if (node.task.cognitive_load > capacity) {
      steps.push({ 
        nodeId: node.task.id, 
        type: 'reject', 
        message: 'Load too high, routing left.',
        comparison: `${node.task.cognitive_load} > ${Math.round(capacity)}`
      });
      return this._findMaxLTE(node.left, capacity, steps, requiredSkills);
    }

    if (!hasRequiredSkills) {
      steps.push({ 
        nodeId: node.task.id, 
        type: 'skill_mismatch', 
        message: 'Load valid but skill mismatch. Checking children...',
        comparison: 'SKILL ERR'
      });
      const rightBest = this._findMaxLTE(node.right, capacity, steps, requiredSkills);
      if (rightBest) return rightBest;
      return this._findMaxLTE(node.left, capacity, steps, requiredSkills);
    }

    steps.push({ 
      nodeId: node.task.id, 
      type: 'candidate', 
      message: 'Candidate found, checking right for better fit.',
      comparison: 'VALID'
    });
    
    const rightBest = this._findMaxLTE(node.right, capacity, steps, requiredSkills);
    if (rightBest) return rightBest;
    
    steps.push({ 
      nodeId: node.task.id, 
      type: 'match', 
      message: 'Optimal fit confirmed.',
      comparison: 'BEST FIT'
    });
    return node.task;
  }

  updateLayout(width: number = 1000, height: number = 600): void {
    if (!this.root) return;
    this._calculatePosition(this.root, 50, width - 50, 80, 0);
  }

  private _calculatePosition(node: TreeNode, minX: number, maxX: number, y: number, level: number): void {
    const midX = (minX + maxX) / 2;
    node.x = midX;
    node.y = y;
    node.level = level;
    node.minX = minX;
    node.maxX = maxX;
    if (node.left) this._calculatePosition(node.left, minX, midX, y + 140, level + 1);
    if (node.right) this._calculatePosition(node.right, midX, maxX, y + 140, level + 1);
  }

  getVisualNodes(): VisualNode[] {
    const nodes: VisualNode[] = [];
    const traverse = (node: TreeNode | null) => {
      if (!node) return;
      nodes.push({
        id: node.task.id,
        task: node.task,
        x: node.x,
        y: node.y,
        level: node.level,
        height: node.height,
        balanceFactor: this.getBalance(node),
        leftId: node.left?.task.id || null,
        rightId: node.right?.task.id || null
      });
      traverse(node.left);
      traverse(node.right);
    };
    traverse(this.root);
    return nodes;
  }

  getStats(): BSTMetrics {
    let count = 0;
    const traverse = (node: TreeNode | null) => {
      if (!node) return;
      count++;
      traverse(node.left);
      traverse(node.right);
    };
    traverse(this.root);
    const height = this.getHeight(this.root);
    const idealHeight = Math.ceil(Math.log2(count + 1));
    const efficiency = count === 0 ? 1 : Math.min(idealHeight / height, 1);

    return { 
      comparisons: this.lastOpComparisons, 
      height, 
      nodes: count,
      efficiency
    };
  }

  deleteByTask(task: Task, silent = false): void {
    this.lastRotations = [];
    this.root = this._delete(this.root, task.cognitive_load, task.id);
    this.updateLayout();
    if (silent) this.lastRotations = [];
  }

  private _delete(node: TreeNode | null, load: number, id: string): TreeNode | null {
    if (!node) return null;

    if (load < node.task.cognitive_load) {
      node.left = this._delete(node.left, load, id);
    } else if (load > node.task.cognitive_load) {
      node.right = this._delete(node.right, load, id);
    } else {
      if (id === node.task.id) {
        if (!node.left || !node.right) {
          node = node.left ? node.left : node.right;
        } else {
          const temp = this._findMin(node.right);
          node.task = temp.task;
          node.right = this._delete(node.right, temp.task.cognitive_load, temp.task.id);
        }
      } else {
        node.right = this._delete(node.right, load, id);
      }
    }

    if (!node) return null;
    node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
    
    if (!this.isAVL) return node;

    const balance = this.getBalance(node);

    if (balance > 1 && this.getBalance(node.left) >= 0) {
      this.lastRotations.push({
        nodeId: node.task.id,
        type: 'rotate',
        message: 'LL Imbalance after deletion: Right Rotation applied.',
        rotatingNodes: [node.task.id, node.left!.task.id]
      });
      return this.rightRotate(node);
    }
    if (balance > 1 && this.getBalance(node.left) < 0) {
      this.lastRotations.push({
        nodeId: node.task.id,
        type: 'rotate',
        message: 'LR Imbalance after deletion: Left-Right Rotation applied.',
        rotatingNodes: [node.task.id, node.left!.task.id, node.left!.right!.task.id]
      });
      node.left = this.leftRotate(node.left!);
      return this.rightRotate(node);
    }
    if (balance < -1 && this.getBalance(node.right) <= 0) {
      this.lastRotations.push({
        nodeId: node.task.id,
        type: 'rotate',
        message: 'RR Imbalance after deletion: Left Rotation applied.',
        rotatingNodes: [node.task.id, node.right!.task.id]
      });
      return this.leftRotate(node);
    }
    if (balance < -1 && this.getBalance(node.right) > 0) {
      this.lastRotations.push({
        nodeId: node.task.id,
        type: 'rotate',
        message: 'RL Imbalance after deletion: Right-Left Rotation applied.',
        rotatingNodes: [node.task.id, node.right!.task.id, node.right!.left!.task.id]
      });
      node.right = this.rightRotate(node.right!);
      return this.leftRotate(node);
    }
    return node;
  }

  private _findMin(node: TreeNode): TreeNode {
    while (node.left) node = node.left;
    return node;
  }

  inorderTraversal(): Task[] {
    const result: Task[] = [];
    this._inorder(this.root, result);
    return result;
  }

  private _inorder(node: TreeNode | null, result: Task[]): void {
    if (node) {
      this._inorder(node.left, result);
      result.push(node.task);
      this._inorder(node.right, result);
    }
  }

  clear(): void {
    this.root = null;
  }
}
