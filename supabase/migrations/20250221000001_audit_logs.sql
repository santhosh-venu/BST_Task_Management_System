/*
# Audit Log System
Tracks all administrative and algorithmic actions within the Neural Router.

## Metadata:
- Schema-Category: Structural
- Impact-Level: Low (Additive)
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: audit_logs
- Columns: id, action, entity_type, entity_id, actor_role, old_value, new_value, created_at
*/

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  actor_role text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE RLS;
CREATE POLICY "Allow public access to audit_logs" ON audit_logs FOR ALL USING (true);
