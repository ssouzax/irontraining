import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Send, Trophy, Dumbbell, Plus, Image, X, Loader2, UserPlus, UserMinus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  created_at: string;
  profiles?: { display_name: string | null; username: string | null; avatar_url: string | null; email: string | null };
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { display_name: string | null; username: string | null; email: string | null };
}

export default function SocialFeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [caption, setCaption] = useState('');
  const [postType, setPostType] = useState('update');
  const [exerciseName, setExerciseName] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState('');
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFeed();
    loadLikes();
    loadFollowing();
  }, [user]);

  const loadFeed = async () => {
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!postsData) { setLoading(false); return; }
    
    // Load profiles for post authors
    const userIds = [...new Set(postsData.map(p => p.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url, email')
      .in('user_id', userIds);
    
    const profileMap = new Map((profilesData || []).map(p => [p.user_id, p]));
    
    const enriched = postsData.map(p => ({
      ...p,
      profiles: profileMap.get(p.user_id) || null,
    }));
    
    setPosts(enriched as any);
    setLoading(false);
  };

  const loadLikes = async () => {
    if (!user) return;
    const { data } = await supabase.from('likes').select('post_id').eq('user_id', user.id);
    if (data) setLikedPosts(new Set(data.map(l => l.post_id)));
  };

  const loadFollowing = async () => {
    if (!user) return;
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
    if (data) setFollowingIds(new Set(data.map(f => f.following_id)));
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

  const toggleFollow = async (targetId: string) => {
    if (!user || targetId === user.id) return;
    const isFollowing = followingIds.has(targetId);

    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
      setFollowingIds(prev => { const n = new Set(prev); n.delete(targetId); return n; });
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
      setFollowingIds(prev => new Set(prev).add(targetId));
    }
  };

  const loadComments = async (postId: string) => {
    const { data: commentsData } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    
    if (!commentsData) return;
    
    const userIds = [...new Set(commentsData.map(c => c.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, email')
      .in('user_id', userIds);
    
    const profileMap = new Map((profilesData || []).map(p => [p.user_id, p]));
    
    const enriched = commentsData.map(c => ({
      ...c,
      profiles: profileMap.get(c.user_id) || null,
    }));
    
    setComments(prev => ({ ...prev, [postId]: enriched as any }));
  };

  const submitComment = async (postId: string) => {
    if (!user || !commentText.trim()) return;
    await supabase.from('comments').insert({ post_id: postId, user_id: user.id, content: commentText.trim() });
    setCommentText('');
    loadComments(postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
  };

  const createPost = async () => {
    if (!user) return;
    setPosting(true);
    try {
      const e1rm = weight && reps ? Math.round(parseFloat(weight) * (1 + parseInt(reps) / 30) * 10) / 10 : null;
      await supabase.from('posts').insert({
        user_id: user.id,
        post_type: postType,
        caption: caption || null,
        exercise_name: exerciseName || null,
        weight: weight ? parseFloat(weight) : null,
        reps: reps ? parseInt(reps) : null,
        estimated_1rm: e1rm,
        is_pr: postType === 'pr',
      });
      toast.success('Post publicado!');
      setShowCreate(false);
      setCaption('');
      setExerciseName('');
      setWeight('');
      setReps('');
      loadFeed();
    } catch {
      toast.error('Erro ao publicar');
    } finally {
      setPosting(false);
    }
  };

  const getProfileName = (post: Post) => {
    return post.profiles?.display_name || post.profiles?.username || post.profiles?.email?.split('@')[0] || 'Atleta';
  };

  const getAvatar = (post: Post) => {
    const name = getProfileName(post);
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Feed</h1>
          <p className="text-muted-foreground mt-1">Atividade da comunidade</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-5 sm:p-6 w-full max-w-md card-elevated space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Novo Post</h3>
                <button onClick={() => setShowCreate(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2">
                {[
                  { value: 'update', label: 'Atualização' },
                  { value: 'pr', label: '🏆 PR' },
                  { value: 'workout', label: '💪 Treino' },
                ].map(t => (
                  <button
                    key={t.value}
                    onClick={() => setPostType(t.value)}
                    className={cn("text-xs px-3 py-1.5 rounded-lg transition-colors",
                      postType === t.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    )}
                  >{t.label}</button>
                ))}
              </div>

              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="O que você quer compartilhar?"
                rows={3}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />

              {(postType === 'pr' || postType === 'workout') && (
                <div className="space-y-3">
                  <input
                    value={exerciseName}
                    onChange={e => setExerciseName(e.target.value)}
                    placeholder="Exercício (ex: Agachamento)"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      placeholder="Peso (kg)"
                      className="bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="number"
                      value={reps}
                      onChange={e => setReps(e.target.value)}
                      placeholder="Reps"
                      className="bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={createPost}
                disabled={posting || (!caption.trim() && !exerciseName)}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Publicar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando feed...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum post ainda. Seja o primeiro!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border card-elevated overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {getAvatar(post)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{getProfileName(post)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
                {user && post.user_id !== user.id && (
                  <button
                    onClick={() => toggleFollow(post.user_id)}
                    className={cn("text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors",
                      followingIds.has(post.user_id) 
                        ? "bg-secondary text-muted-foreground" 
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {followingIds.has(post.user_id) ? <UserMinus className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                    {followingIds.has(post.user_id) ? 'Seguindo' : 'Seguir'}
                  </button>
                )}
              </div>

              {/* PR/Workout data */}
              {post.is_pr && post.exercise_name && (
                <div className="mx-4 mb-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-warning/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-warning" />
                    <span className="text-xs font-bold uppercase tracking-wider text-warning">NOVO PR!</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{post.exercise_name}</p>
                  <div className="flex gap-4 mt-1">
                    {post.weight && <span className="text-sm text-foreground font-mono">{post.weight}kg</span>}
                    {post.reps && <span className="text-sm text-muted-foreground">×{post.reps}</span>}
                    {post.estimated_1rm && <span className="text-xs text-primary">E1RM: {post.estimated_1rm}kg</span>}
                  </div>
                </div>
              )}

              {!post.is_pr && post.exercise_name && (
                <div className="mx-4 mb-3 p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{post.exercise_name}</span>
                  </div>
                  <div className="flex gap-3 mt-1">
                    {post.weight && <span className="text-xs text-muted-foreground font-mono">{post.weight}kg</span>}
                    {post.reps && <span className="text-xs text-muted-foreground">×{post.reps}</span>}
                  </div>
                </div>
              )}

              {/* Caption */}
              {post.caption && (
                <p className="px-4 pb-3 text-sm text-foreground leading-relaxed">{post.caption}</p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 px-4 py-3 border-t border-border">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={cn("flex items-center gap-1.5 text-sm transition-colors",
                    likedPosts.has(post.id) ? "text-destructive" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Heart className={cn("w-4 h-4", likedPosts.has(post.id) && "fill-current")} />
                  {post.likes_count > 0 && post.likes_count}
                </button>
                <button
                  onClick={() => {
                    if (expandedComments === post.id) {
                      setExpandedComments(null);
                    } else {
                      setExpandedComments(post.id);
                      loadComments(post.id);
                    }
                  }}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  {post.comments_count > 0 && post.comments_count}
                </button>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Comments */}
              <AnimatePresence>
                {expandedComments === post.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      {(comments[post.id] || []).map(c => (
                        <div key={c.id} className="flex gap-2">
                          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                            {(c.profiles?.display_name || c.profiles?.email || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">
                              {c.profiles?.display_name || c.profiles?.username || c.profiles?.email?.split('@')[0]}
                            </p>
                            <p className="text-xs text-muted-foreground">{c.content}</p>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && submitComment(post.id)}
                          placeholder="Comentar..."
                          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          onClick={() => submitComment(post.id)}
                          disabled={!commentText.trim()}
                          className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
