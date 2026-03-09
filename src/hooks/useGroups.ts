import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  is_private: boolean;
  created_by: string;
  member_count: number;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch all visible groups (public + private user is member of)
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('member_count', { ascending: false });
      if (error) throw error;
      setGroups(data || []);

      // Fetch groups user is member of
      const { data: memberData, error: mErr } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);
      if (mErr) throw mErr;

      const myGroupIds = new Set((memberData || []).map(m => m.group_id));
      setMyGroups((data || []).filter(g => myGroupIds.has(g.id)));
    } catch (err: any) {
      console.error('Error fetching groups:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const createGroup = async (name: string, description: string, isPrivate: boolean) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('groups')
        .insert({ name, description, is_private: isPrivate, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      toast.success('Grupo criado!');
      await fetchGroups();
      return data;
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar grupo');
      return null;
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: user.id });
      if (error) throw error;
      toast.success('Entrou no grupo!');
      await fetchGroups();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao entrar no grupo');
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Saiu do grupo');
      await fetchGroups();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao sair do grupo');
    }
  };

  const isMember = (groupId: string) => myGroups.some(g => g.id === groupId);

  return { groups, myGroups, loading, createGroup, joinGroup, leaveGroup, isMember, refetch: fetchGroups };
}
