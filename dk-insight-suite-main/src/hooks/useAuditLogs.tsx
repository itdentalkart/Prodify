import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';

type AuditLogRow = Database['public']['Tables']['audit_logs']['Row'];

export interface AuditLogWithUser extends AuditLogRow {
  profiles?: {
    display_name: string | null;
    email: string;
  } | null;
}

export function useAuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLogWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: logsData, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false, nullsFirst: false })
        .limit(200);

      if (logsError) throw logsError;

      if (!logsData || logsData.length === 0) {
        setLogs([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for user_ids
      const userIds = [...new Set(logsData.filter(l => l.user_id).map(l => l.user_id as string))];
      let profilesMap: Record<string, { display_name: string | null; email: string }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, email')
          .in('user_id', userIds);

        profiles?.forEach(p => {
          profilesMap[p.user_id] = { display_name: p.display_name, email: p.email };
        });
      }

      const logsWithUsers: AuditLogWithUser[] = logsData.map(log => ({
        ...log,
        profiles: log.user_id ? profilesMap[log.user_id] || null : null,
      }));

      setLogs(logsWithUsers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  return { logs, loading, error, refetch: fetchLogs };
}
