import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useSavedPosts() {
  const { user } = useAuth();
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('saved_posts').select('post_id').eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setSavedPostIds(new Set(data.map(s => s.post_id)));
        setLoading(false);
      });
  }, [user]);

  const toggleSave = useCallback(async (postId: string, collection?: string) => {
    if (!user) return;
    const isSaved = savedPostIds.has(postId);
    if (isSaved) {
      await supabase.from('saved_posts').delete().eq('user_id', user.id).eq('post_id', postId);
      setSavedPostIds(prev => { const n = new Set(prev); n.delete(postId); return n; });
    } else {
      await supabase.from('saved_posts').insert({
        user_id: user.id,
        post_id: postId,
        collection_name: collection || 'Salvos',
      });
      setSavedPostIds(prev => new Set(prev).add(postId));
    }
  }, [user, savedPostIds]);

  const isSaved = useCallback((postId: string) => savedPostIds.has(postId), [savedPostIds]);

  return { savedPostIds, toggleSave, isSaved, loading };
}
