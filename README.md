# Experience-Aware Cognitive Load Task Assignment System

## The Problem
In industrial environments, assigning tasks manually leads to two major issues:
1. **Overload:** Juniors receiving tasks beyond their capability.
2. **Starvation:** Complex tasks being ignored because they are "too hard", leading to project bottlenecks.

Traditional systems use simple Priority Queues (Heaps) or sorted lists. While efficient for finding the *absolute* highest priority, they struggle with "Best Fit" scenarios where we need the highest priority *within a specific capacity limit*.

## The BST Solution
This system uses a **Binary Search Tree (BST)** as the core engine. 
- **Key:** Cognitive Load (Effort × Urgency × Duration).
- **Search:** The BST allows us to perform a `findMaxLessThanOrEqual` search in **O(log n)** time.
- **Adaptability:** If no task fits an employee's current capacity, the system "relaxes" the constraint (simulating supervision), ensuring that **all tasks are eventually assigned**.

## Why BST over Heaps?
While Heaps are $O(1)$ for the absolute maximum, searching for a value *less than or equal to X* in a Heap is $O(n)$. In our BST, this remains **O(log n)**, making it the superior choice for experience-based assignment.

## Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS.
- **Algorithm:** Handwritten BST (In-Memory).
- **Persistence:** Supabase (PostgreSQL).

## How to use
1. **Add Tasks:** Input effort, urgency, and duration.
2. **Assign:** Select an employee. The system calculates their capacity based on years of experience.
3. **Observe:** The BST logic finds the most challenging task they can handle.
