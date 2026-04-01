/*
  # Initial Schema for Cognitive Load Assignment System

  ## Query Description:
  Creates tables for tasks, employees, and assignments.
  - Tasks store the raw metrics (effort, urgency, duration) and computed cognitive load.
  - Employees store experience data.
  - Assignments track who did what and the load capacity used at that time.

  ## Metadata:
  - Schema-Category: Structural
  - Impact-Level: High
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Table: tasks
  - Table: employees
  - Table: assignments
*/

-- Create Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    effort INTEGER NOT NULL CHECK (effort >= 1 AND effort <= 10),
    urgency INTEGER NOT NULL CHECK (urgency >= 1 AND urgency <= 10),
    duration INTEGER NOT NULL, -- in minutes
    cognitive_load INTEGER GENERATED ALWAYS AS (effort * urgency * duration) STORED,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    experience INTEGER NOT NULL DEFAULT 0, -- years
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) NOT NULL,
    employee_id UUID REFERENCES public.employees(id) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    final_capacity_used INTEGER NOT NULL, -- The load threshold that finally accepted this task
    justification TEXT -- Explanation of why this assignment happened
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Create Policies (Public access for this internal tool demo)
CREATE POLICY "Allow public access to tasks" ON public.tasks FOR ALL USING (true);
CREATE POLICY "Allow public access to employees" ON public.employees FOR ALL USING (true);
CREATE POLICY "Allow public access to assignments" ON public.assignments FOR ALL USING (true);

-- Seed some initial data for demonstration
INSERT INTO public.employees (name, experience, role) VALUES
('Alice (Senior)', 8, 'Senior Engineer'),
('Bob (Junior)', 1, 'Junior Developer'),
('Charlie (Mid)', 4, 'System Architect');
