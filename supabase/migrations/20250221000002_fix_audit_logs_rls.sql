/*
# Fix Audit Logs Schema and RLS
Corrects the syntax error in the previous migration and establishes the audit_logs table.

## Query Description:
This operation creates the audit_logs table with correct Row Level Security syntax. 
It is a structural update that enables the system to track all neural routing transactions.

## Metadata:
- Schema-Category: Structural
- Impact-Level: Low
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: audit_logs
- Columns: id, action, entity_type, entity_id, actor_role, old_value, new_value, created_at
- Security: RLS Enabled with public access policy
*/

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    actor_role TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Correct syntax for enabling RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (consistent with existing project patterns)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'audit_logs' AND policyname = 'Allow public access to audit_logs'
    ) THEN
        CREATE POLICY "Allow public access to audit_logs" ON public.audit_logs
        FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
