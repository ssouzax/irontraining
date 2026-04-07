import { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface StoryGroup {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  stories: { id: string; media_url: string; media_type: string; caption: string | null; created_at: string }[];
}

export function StoriesBar({ followingIds }: { followingIds: Set<string> }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [viewingGroup, setViewingGroup] = useState<StoryGroup | null>(null);
  const [viewIdx, setViewIdx] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadStories();
  }, [user, followingIds]);

  const loadStories = async () => {
    if (!user) return;
    const targetIds = [...followingIds, user.id];
    if (targetIds.length === 0) return;

    const { data: stories } = await supabase
      .from('stories')
      .select('*')
      .in('user_id', targetIds)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (!stories || stories.length === 0) return;

    const userIds = [...new Set(stories.map((s: any) => s.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url')
      .in('user_id', userIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    const grouped = new Map<string, StoryGroup>();
    for (const s of stories as any[]) {
      if (!grouped.has(s.user_id)) {
        const p = profileMap.get(s.user_id);
        grouped.set(s.user_id, {
          user_id: s.user_id,
          display_name: p?.display_name || null,
          username: p?.username || null,
          avatar_url: p?.avatar_url || null,
          stories: [],
        });
      }
      grouped.get(s.user_id)!.stories.push(s);
    }

    // Put own story first
    const result: StoryGroup[] = [];
    if (grouped.has(user.id)) { result.push(grouped.get(user.id)!); grouped.delete(user.id); }
    result.push(...grouped.values());
    setGroups(result);
  };

  const addStory = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('stories-media').upload(path, file, { upsert: true });
    if (error) { toast.error('Erro no upload'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('stories-media').getPublicUrl(path);
    const mediaType = file.type.startsWith('video') ? 'video' : 'photo';
    await supabase.from('stories').insert({ user_id: user.id, media_url: publicUrl, media_type: mediaType } as any);
    toast.success('Story publicado!');
    setUploading(false);
    loadStories();
  };

  const viewStory = async (group: StoryGroup) => {
    setViewingGroup(group);
    setViewIdx(0);
    if (user && group.user_id !== user.id) {
      for (const s of group.stories) {
        await supabase.from('story_views').upsert({ story_id: s.id, viewer_id: user.id } as any, { onConflict: 'story_id,viewer_id' });
      }
    }
  };

  const nextStory = () => {
    if (!viewingGroup) return;
    if (viewIdx < viewingGroup.stories.length - 1) {
      setViewIdx(i => i + 1);
    } else {
      setViewingGroup(null);
    }
  };

  if (groups.length === 0 && !uploading) return null;

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {/* Add story button */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <label className="cursor-pointer">
            <div className={cn("w-16 h-16 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center bg-primary/5",
              uploading && "opacity-50 pointer-events-none")}>
              {uploading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
            </div>
            <input type="file" accept="image/*,video/*" className="hidden" onChange={e => e.target.files?.[0] && addStory(e.target.files[0])} />
          </label>
          <span className="text-[10px] text-muted-foreground">Seu story</span>
        </div>

        {groups.map(g => (
          <button key={g.user_id} onClick={() => viewStory(g)} className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-br from-primary to-accent">
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                {g.avatar_url ? <img src={g.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-sm font-bold text-primary">{(g.display_name || g.username || 'A').charAt(0).toUpperCase()}</span>}
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground truncate max-w-[64px]">
              {g.user_id === user?.id ? 'Você' : (g.display_name || g.username || 'Atleta')}
            </span>
          </button>
        ))}
      </div>

      {/* Story Viewer */}
      <AnimatePresence>
        {viewingGroup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={nextStory}>
            <button onClick={(e) => { e.stopPropagation(); setViewingGroup(null); }}
              className="absolute top-4 right-4 z-10 text-white/80 hover:text-white text-2xl">✕</button>
            {/* Progress bars */}
            <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
              {viewingGroup.stories.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30">
                  <div className={cn("h-full rounded-full bg-white transition-all", i <= viewIdx ? "w-full" : "w-0")} />
                </div>
              ))}
            </div>
            {/* User info */}
            <div className="absolute top-6 left-4 flex items-center gap-2 z-10">
              <div className="w-8 h-8 rounded-full bg-white/20 overflow-hidden">
                {viewingGroup.avatar_url && <img src={viewingGroup.avatar_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <span className="text-white text-sm font-medium">{viewingGroup.display_name || viewingGroup.username}</span>
            </div>
            {/* Media */}
            {viewingGroup.stories[viewIdx]?.media_type === 'video' ? (
              <video src={viewingGroup.stories[viewIdx].media_url} autoPlay className="max-w-full max-h-full object-contain" />
            ) : (
              <img src={viewingGroup.stories[viewIdx]?.media_url} alt="" className="max-w-full max-h-full object-contain" />
            )}
            {viewingGroup.stories[viewIdx]?.caption && (
              <div className="absolute bottom-12 left-4 right-4 text-white text-sm text-center bg-black/40 rounded-lg p-2">
                {viewingGroup.stories[viewIdx].caption}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
