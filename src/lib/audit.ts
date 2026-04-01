import { supabase } from './supabase';
import { UserRole } from './types';

/**
 * Logs a system action to the Supabase audit_logs table.
 * This is used for compliance and tracking the "Neural Routing" history.
 */
export const logAction = async (
  action: string,
  entityType: string,
  actorRole: UserRole,
  entityId?: string,
  oldValue?: any,
  newValue?: any
) => {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      action,
      entity_type: entityType,
      entity_id: entityId,
      actor_role: actorRole,
      old_value: oldValue,
      new_value: newValue
    });
    
    if (error) {
      console.warn('Audit Log insertion failed:', error.message);
    }
  } catch (err) {
    console.error('Audit Log critical error:', err);
  }
};
