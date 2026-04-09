import { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { StoryViewer } from './StoryViewer';

interface StoryGroup {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  stories: { id: string; media_url: string; media_type: string; caption: string | null; created_at: string; views_count?: number }[];
}

export function StoriesBar({ followingIds }: { followingIds: Set<string> }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [viewingIdx, setViewingIdx] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { loadStories(); }, [user, followingIds]);

  const loadStories = async () => {
    if (!user) return;
    const targetIds = [...followingIds, user.id];
    if (targetIds.length === 0) return;

    const { data: stories } = await supabase
      .from('stories').select('*')
      .in('user_id', targetIds)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (!stories || stories.length === 0) { setGroups([]); return; }

    const userIds = [...new Set(stories.map((s: any) => s.user_id))];
    const { data: profiles } = await supabase
      .from('profiles').select('user_id, display_name, username, avatar_url')
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

  if (groups.length === 0 && !uploading) {
    return (
      <div className="flex gap-3 pb-2">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <label className="cursor-pointer">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center bg-primary/5">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <input type="file" accept="image/*,video/*" className="hidden" onChange={e => e.target.files?.[0] && addStory(e.target.files[0])} />
          </label>
          <span className="text-[10px] text-muted-foreground">Seu story</span>
        </div>
      </div>
    );
  }

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

        {groups.map((g, idx) => (
          <button key={g.user_id} onClick={() => setViewingIdx(idx)} className="flex flex-col items-center gap-1 shrink-0">
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
      {viewingIdx !== null && (
        <StoryViewer groups={groups} initialGroupIdx={viewingIdx} onClose={() => setViewingIdx(null)} />
      )}
    </>
  );
}
