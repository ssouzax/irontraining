import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SocialNotification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  reference_id: string | null;
  reference_type: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  actor_profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export function useSocialNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SocialNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!data) { setLoading(false); return; }

    const actorIds = [...new Set(data.map(n => n.actor_id).filter(Boolean))] as string[];
    let profileMap = new Map<string, any>();
    if (actorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', actorIds);
      profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    }

    const enriched = data.map(n => ({
      ...n,
      actor_profile: n.actor_id ? profileMap.get(n.actor_id) || null : null,
    }));

    setNotifications(enriched);
    setUnreadCount(enriched.filter(n => !n.is_read).length);
    setLoading(false);
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, async (payload) => {
        const n = payload.new as any;
        let actor_profile = null;
        if (n.actor_id) {
          const { data } = await supabase
            .from('profiles')
            .select('user_id, display_name, username, avatar_url')
            .eq('user_id', n.actor_id)
            .single();
          actor_profile = data;
        }
        setNotifications(prev => [{ ...n, actor_profile }, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return { notifications, unreadCount, loading, markAllAsRead, markAsRead, refresh: load };
}

// Helper to create a notification (call from client after actions)
export async function createNotification(params: {
  user_id: string;
  actor_id: string;
  type: string;
  reference_id?: string;
  reference_type?: string;
  message: string;
}) {
  if (params.user_id === params.actor_id) return; // Don't notify self
  await supabase.from('notifications').insert({
    user_id: params.user_id,
    actor_id: params.actor_id,
    type: params.type,
    reference_id: params.reference_id || null,
    reference_type: params.reference_type || null,
    message: params.message,
  });
}
