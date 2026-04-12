import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadDMs() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    loadUnread();

    const channel = supabase
      .channel('dm-unread')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        loadUnread();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadUnread = async () => {
    if (!user) return;
    // Get conversations user is part of
    const { data: parts } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);
    if (!parts || parts.length === 0) { setUnreadCount(0); return; }
    const convIds = parts.map(p => p.conversation_id);
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .neq('sender_id', user.id)
      .eq('is_read', false);
    setUnreadCount(count || 0);
  };

  return { unreadCount, refresh: loadUnread };
}
