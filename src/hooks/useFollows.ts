import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useFollows() {
  const { user } = useAuth();
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('follows').select('following_id').eq('follower_id', user.id)
      .then(({ data }) => {
        if (data) setFollowingIds(new Set(data.map(f => f.following_id)));
        setLoading(false);
      });
  }, [user]);

  const toggleFollow = useCallback(async (targetId: string) => {
    if (!user || targetId === user.id) return;
    const isFollowing = followingIds.has(targetId);

    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
      setFollowingIds(prev => { const n = new Set(prev); n.delete(targetId); return n; });
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
      setFollowingIds(prev => new Set(prev).add(targetId));
    }
  }, [user, followingIds]);

  const isFollowing = useCallback((targetId: string) => followingIds.has(targetId), [followingIds]);

  return { followingIds, toggleFollow, isFollowing, loading };
}
