import { useState, useEffect } from 'react';
import { Plus, Dumbbell, Loader2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useFollows } from '@/hooks/useFollows';
import { useUnreadDMs } from '@/hooks/useUnreadDMs';
import { useNavigate } from 'react-router-dom';
import { StoriesBar } from '@/components/social/StoriesBar';
import { UserSuggestions } from '@/components/social/UserSuggestions';
import { PostCard } from '@/components/social/PostCard';
import { CommentsSheet } from '@/components/social/CommentsSheet';
import { CreatePostModal } from '@/components/social/CreatePostModal';
import { motion } from 'framer-motion';

interface Post {
  id: string;
  user_id: string;
  post_type: string;
  caption: string | null;
  exercise_name: string | null;
  weight: number | null;
  reps: number | null;
  estimated_1rm: number | null;
  is_pr: boolean;
  likes_count: number;
  comments_count: number;
  media_urls: string[] | null;
  media_type?: string | null;
  location?: string | null;
  created_at: string;
  profiles?: { display_name: string | null; username: string | null; avatar_url: string | null; email: string | null };
}

export default function SocialFeedPage() {
  const { user } = useAuth();
  const { followingIds, toggleFollow } = useFollows();
  const { unreadCount } = useUnreadDMs();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [feedMode, setFeedMode] = useState<'following' | 'all'>('following');

  useEffect(() => { loadFeed(); loadLikes(); }, [user, followingIds, feedMode]);

  const loadFeed = async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(50);
    if (feedMode === 'following' && followingIds.size > 0) {
      query = query.in('user_id', [...followingIds, user.id]);
    }
    const { data: postsData } = await query;
    if (!postsData) { setLoading(false); return; }
    const userIds = [...new Set(postsData.map(p => p.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles').select('user_id, display_name, username, avatar_url, email').in('user_id', userIds);
    const profileMap = new Map((profilesData || []).map(p => [p.user_id, p]));
    setPosts(postsData.map(p => ({ ...p, profiles: profileMap.get(p.user_id) || null })) as any);
    setLoading(false);
  };

  const loadLikes = async () => {
    if (!user) return;
    const { data } = await supabase.from('likes').select('post_id').eq('user_id', user.id);
    if (data) setLikedPosts(new Set(data.map(l => l.post_id)));
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const isLiked = likedPosts.has(postId);
    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
      setLikedPosts(prev => { const n = new Set(prev); n.delete(postId); return n; });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p));
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
      setLikedPosts(prev => new Set(prev).add(postId));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p));
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return;
    await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id);
    setPosts(prev => prev.filter(p => p.id !== postId));
    toast.success('Post excluído');
  };

  const handleCommentAdded = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
  };

  const showSuggestions = followingIds.size === 0 || (feedMode === 'following' && posts.length === 0);

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-1 mb-4">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Feed</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/direct')} className="relative w-10 h-10 rounded-full bg-secondary text-foreground flex items-center justify-center">
            <MessageCircle className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button onClick={() => setShowCreate(true)}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Stories */}
      <div className="mb-4">
        <StoriesBar followingIds={followingIds} />
      </div>

      {/* Feed mode */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 mb-4">
        {(['following', 'all'] as const).map(mode => (
          <button key={mode} onClick={() => setFeedMode(mode)}
            className={cn("flex-1 py-2 rounded-lg text-xs font-medium transition-colors",
              feedMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}>
            {mode === 'following' ? 'Seguindo' : 'Todos'}
          </button>
        ))}
      </div>

      {/* Suggestions */}
      {showSuggestions && <UserSuggestions followingIds={followingIds} onToggleFollow={toggleFollow} />}

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">
            {feedMode === 'following' ? 'Siga atletas ou mude para "Todos".' : 'Nenhum post ainda. Seja o primeiro!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} isLiked={likedPosts.has(post.id)}
              onToggleLike={toggleLike} onOpenComments={setCommentsPostId}
              onDeletePost={deletePost} isOwn={post.user_id === user?.id} />
          ))}
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setShowCreate(true)}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:scale-105 transition-transform sm:hidden">
        <Plus className="w-6 h-6" />
      </button>

      {/* Create Post Modal */}
      <CreatePostModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={loadFeed} />

      {/* Comments Sheet */}
      <CommentsSheet postId={commentsPostId} onClose={() => setCommentsPostId(null)} onCommentAdded={handleCommentAdded} />
    </div>
  );
}
