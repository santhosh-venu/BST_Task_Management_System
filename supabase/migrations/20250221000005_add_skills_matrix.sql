/*
# Neural Skill Matrix Upgrade
Adds skill-based routing capabilities to the neural network.

## Query Description:
This operation adds array columns for skills to both tasks and employees. 
It allows the routing engine to filter packets not just by load, but by technical compatibility.

## Metadata:
- Schema-Category: Structural
- Impact-Level: Medium
- Requires-Backup: true
- Reversible: true

## Structure Details:
- tasks: added required_skills (text array)
- employees: added skills (text array)
*/

-- Add skills to tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS required_skills text[] DEFAULT '{}';

-- Add skills to employees
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';

-- Update RLS for the new columns (inherited from table level)
-- No additional policies needed as existing ones cover the whole table
