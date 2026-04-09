import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Eye, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface Story {
  id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  views_count?: number;
}

interface StoryGroup {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  stories: Story[];
}

interface StoryViewerProps {
  groups: StoryGroup[];
  initialGroupIdx: number;
  onClose: () => void;
}

const STORY_DURATION = 5000;

export function StoryViewer({ groups, initialGroupIdx, onClose }: StoryViewerProps) {
  const { user } = useAuth();
  const [groupIdx, setGroupIdx] = useState(initialGroupIdx);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<{ display_name: string | null; username: string | null; avatar_url: string | null }[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const elapsedRef = useRef(0);

  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];
  const isOwn = user?.id === group?.user_id;

  const markViewed = useCallback(async (storyId: string) => {
    if (!user || isOwn) return;
    await supabase.from('story_views').upsert(
      { story_id: storyId, viewer_id: user.id } as any,
      { onConflict: 'story_id,viewer_id' }
    );
  }, [user, isOwn]);

  const startTimer = useCallback(() => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    startTimeRef.current = Date.now() - elapsedRef.current;

    const tick = () => {
      if (paused) return;
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(elapsed / STORY_DURATION, 1);
      setProgress(pct);
      if (pct >= 1) {
        nextStory();
        return;
      }
      timerRef.current = requestAnimationFrame(tick);
    };
    timerRef.current = requestAnimationFrame(tick);
  }, [paused]);

  useEffect(() => {
    elapsedRef.current = 0;
    setProgress(0);
    if (story) markViewed(story.id);
    if (!paused) startTimer();
    return () => { if (timerRef.current) cancelAnimationFrame(timerRef.current); };
  }, [groupIdx, storyIdx]);

  useEffect(() => {
    if (paused) {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      elapsedRef.current = Date.now() - startTimeRef.current;
    } else {
      startTimer();
    }
  }, [paused]);

  const nextStory = () => {
    if (storyIdx < group.stories.length - 1) {
      setStoryIdx(i => i + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(i => i + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (storyIdx > 0) {
      setStoryIdx(i => i - 1);
    } else if (groupIdx > 0) {
      setGroupIdx(i => i - 1);
      setStoryIdx(groups[groupIdx - 1].stories.length - 1);
    }
  };

  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.3) prevStory();
    else nextStory();
  };

  const loadViewers = async () => {
    if (!story) return;
    const { data: viewsData } = await supabase
      .from('story_views').select('viewer_id').eq('story_id', story.id);
    if (!viewsData || viewsData.length === 0) { setViewers([]); return; }
    const ids = viewsData.map((v: any) => v.viewer_id);
    const { data: profiles } = await supabase
      .from('profiles').select('user_id, display_name, username, avatar_url').in('user_id', ids);
    setViewers((profiles || []) as any);
  };

  useEffect(() => {
    if (showViewers && isOwn) loadViewers();
  }, [showViewers, storyIdx]);

  if (!group || !story) return null;
  const name = group.display_name || group.username || 'Atleta';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
        {group.stories.map((_, i) => (
          <div key={i} className="flex-1 h-[3px] rounded-full bg-white/25 overflow-hidden">
            <div className="h-full rounded-full bg-white transition-none"
              style={{ width: i < storyIdx ? '100%' : i === storyIdx ? `${progress * 100}%` : '0%' }} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-5 left-3 right-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 overflow-hidden">
            {group.avatar_url && <img src={group.avatar_url} alt="" className="w-full h-full object-cover" />}
          </div>
          <div>
            <span className="text-white text-sm font-medium">{name}</span>
            <span className="text-white/50 text-xs ml-2">
              {formatDistanceToNow(new Date(story.created_at), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPaused(!paused)} className="text-white/80 hover:text-white">
            {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Media area - tap zones */}
      <div className="absolute inset-0 z-10" onClick={handleTap}>
        {story.media_type === 'video' ? (
          <video src={story.media_url} autoPlay playsInline muted={false} className="w-full h-full object-contain" />
        ) : (
          <img src={story.media_url} alt="" className="w-full h-full object-contain" />
        )}
      </div>

      {/* Gradient overlays */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" />

      {/* Caption */}
      {story.caption && (
        <div className="absolute bottom-16 left-4 right-4 z-20 text-white text-sm text-center bg-black/30 backdrop-blur-sm rounded-xl p-3">
          {story.caption}
        </div>
      )}

      {/* Viewers (own stories) */}
      {isOwn && (
        <button onClick={() => { setPaused(true); setShowViewers(true); }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 text-white/70 text-xs">
          <Eye className="w-4 h-4" /> {story.views_count || 0} visualizações
        </button>
      )}

      {/* Viewers panel */}
      <AnimatePresence>
        {showViewers && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="absolute bottom-0 left-0 right-0 z-30 bg-card rounded-t-2xl max-h-[50vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h4 className="text-sm font-semibold text-foreground">Visualizações</h4>
              <button onClick={() => { setShowViewers(false); setPaused(false); }} className="text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {viewers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma visualização ainda</p>
              ) : viewers.map((v, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center text-xs font-bold text-primary">
                    {v.avatar_url ? <img src={v.avatar_url} alt="" className="w-full h-full object-cover" /> : (v.display_name || 'A').charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{v.display_name || v.username || 'Atleta'}</p>
                    {v.username && <p className="text-xs text-muted-foreground">@{v.username}</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe arrows for desktop */}
      {groupIdx > 0 && (
        <button onClick={(e) => { e.stopPropagation(); setGroupIdx(i => i - 1); setStoryIdx(0); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hidden sm:flex">
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {groupIdx < groups.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); setGroupIdx(i => i + 1); setStoryIdx(0); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hidden sm:flex">
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </motion.div>
  );
}
