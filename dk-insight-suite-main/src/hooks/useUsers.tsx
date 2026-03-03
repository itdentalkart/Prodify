import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface UserWithRole {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  org_id: string | null;
  role: 'admin' | 'it' | 'employee' | 'super_admin';
  device_count: number;
}

export function useUsers() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchUsers = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // First get current user's profile to check org_id
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch profiles - this will return profiles in same org due to RLS
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error('Profile fetch error:', profilesError);
        // If RLS blocks, at least show current user
        if (currentProfile) {
          const { data: ownProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (ownProfile) {
            const { data: ownRole } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .maybeSingle();
            
            setUsers([{
              id: ownProfile.id,
              user_id: ownProfile.user_id,
              email: ownProfile.email,
              display_name: ownProfile.display_name,
              org_id: ownProfile.org_id,
              role: ownRole?.role || 'employee',
              device_count: 0,
            }]);
            setLoading(false);
            return;
          }
        }
        throw profilesError;
      }

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      // Fetch device counts per user
      const { data: devices, error: devicesError } = await supabase
        .from('devices')
        .select('assigned_user_id');

      // Map roles by user_id
      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
      
      // Count devices per user
      const deviceCounts = new Map<string, number>();
      devices?.forEach(d => {
        if (d.assigned_user_id) {
          deviceCounts.set(d.assigned_user_id, (deviceCounts.get(d.assigned_user_id) || 0) + 1);
        }
      });

      // Combine data
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        email: profile.email,
        display_name: profile.display_name,
        org_id: profile.org_id,
        role: rolesMap.get(profile.user_id) || 'employee',
        device_count: deviceCounts.get(profile.user_id) || 0,
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'it' | 'employee' | 'super_admin') => {
    try {
      // Check if role exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });
      
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  return { users, loading, fetchUsers, updateUserRole };
}
