import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Send, Trophy, Dumbbell, Loader2, Zap, TrendingUp, BarChart3, Target, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { MobileStreakCard } from './MobileStreakCard';
import { MobileDailyGoals } from './MobileDailyGoals';
import { MobileDailyChallenges } from './MobileDailyChallenges';
import { MobileSeasonalEvents } from './MobileSeasonalEvents';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { usePlayerLevel } from '@/hooks/usePlayerLevel';

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
  media_urls: string[] | null;
  profiles?: { display_name: string | null; username: string | null; avatar_url: string | null; email: string | null };
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { display_name: string | null; username: string | null; email: string | null };
}

export function MobileHomeFeed() {
  const { user } = useAuth();
  const { profile } = useTraining();
  const { playerLevel } = usePlayerLevel();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState('');
  const [heartAnimPost, setHeartAnimPost] = useState<string | null>(null);
  const [powerScore, setPowerScore] = useState<number>(0);

  const squat1RM = calculate1RM(profile.currentLifts.squat.weight, profile.currentLifts.squat.reps);
  const bench1RM = calculate1RM(profile.currentLifts.bench.weight, profile.currentLifts.bench.reps);
  const deadlift1RM = calculate1RM(profile.currentLifts.deadlift.weight, profile.currentLifts.deadlift.reps);
  const myTotal = squat1RM + bench1RM + deadlift1RM;

  useEffect(() => {
    loadFeed();
    loadLikes();
    loadFollowing();
    loadPowerScore();
  }, [user]);

  const loadPowerScore = async () => {
    if (!user) return;
    const { data } = await supabase.from('power_scores').select('power_score').eq('user_id', user.id).single();
    if (data) setPowerScore(data.power_score);
  };

  const loadFeed = async () => {
    const { data: postsData } = await supabase
      .from('posts').select('*').order('created_at', { ascending: false }).limit(50);
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
      setHeartAnimPost(postId);
      setTimeout(() => setHeartAnimPost(null), 800);
      await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
      setLikedPosts(prev => new Set(prev).add(postId));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p));
    }
  };

  const toggleFollow = async (targetId: string) => {
    if (!user || targetId === user.id) return;
    if (followingIds.has(targetId)) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
      setFollowingIds(prev => { const n = new Set(prev); n.delete(targetId); return n; });
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
      setFollowingIds(prev => new Set(prev).add(targetId));
    }
  };

  const loadComments = async (postId: string) => {
    const { data: commentsData } = await supabase
      .from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });
    if (!commentsData) return;
    const userIds = [...new Set(commentsData.map(c => c.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles').select('user_id, display_name, username, email').in('user_id', userIds);
    const profileMap = new Map((profilesData || []).map(p => [p.user_id, p]));
    setComments(prev => ({ ...prev, [postId]: commentsData.map(c => ({ ...c, profiles: profileMap.get(c.user_id) || null })) as any }));
  };

  const submitComment = async (postId: string) => {
    if (!user || !commentText.trim()) return;
    await supabase.from('comments').insert({ post_id: postId, user_id: user.id, content: commentText.trim() });
    setCommentText('');
    loadComments(postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
  };

  const getName = (post: Post) => post.profiles?.display_name || post.profiles?.username || post.profiles?.email?.split('@')[0] || 'Atleta';
  const getInitial = (post: Post) => getName(post).charAt(0).toUpperCase();

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      {/* Hero Dashboard */}
      <div className="px-4 pt-4 pb-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl glass border border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Seus Números</p>
              <p className="text-2xl font-extrabold text-foreground mt-0.5">
                {myTotal > 0 ? `${Math.round(myTotal)}kg` : '—'}
                <span className="text-sm font-medium text-muted-foreground ml-1.5">Total</span>
              </p>
            </div>
            {playerLevel && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-sm">⚡</span>
                <div className="text-right">
                  <p className="text-xs font-bold text-primary">Lv. {playerLevel.player_level}</p>
                  <p className="text-[9px] text-primary/70">{playerLevel.title}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'SQT', val: squat1RM > 0 ? `${Math.round(squat1RM)}` : '—', icon: '🦵', color: 'from-blue-500/10 to-blue-500/5' },
              { label: 'BNC', val: bench1RM > 0 ? `${Math.round(bench1RM)}` : '—', icon: '💪', color: 'from-green-500/10 to-green-500/5' },
              { label: 'DL', val: deadlift1RM > 0 ? `${Math.round(deadlift1RM)}` : '—', icon: '🏋️', color: 'from-orange-500/10 to-orange-500/5' },
              { label: 'PWR', val: powerScore > 0 ? `${Math.round(powerScore)}` : '—', icon: '⚡', color: 'from-primary/10 to-primary/5' },
            ].map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05 }}
                className={cn("text-center p-2.5 rounded-xl bg-gradient-to-b border border-border/30", s.color)}>
                <span className="text-sm">{s.icon}</span>
                <p className="text-base font-extrabold text-foreground mt-0.5">{s.val}</p>
                <p className="text-[9px] text-muted-foreground font-semibold">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <MobileStreakCard />

      {/* Feed */}
      <div className="divide-y divide-border mt-3">
        {posts.length === 0 ? (
          <div className="text-center py-20 px-4">
            <Dumbbell className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Nenhum post ainda. Seja o primeiro!</p>
          </div>
        ) : posts.map((post, idx) => (
          <motion.div key={post.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
            className="bg-card relative">
            {/* Heart float animation */}
            <AnimatePresence>
              {heartAnimPost === post.id && (
                <motion.div
                  initial={{ opacity: 1, scale: 0.5, y: 0 }}
                  animate={{ opacity: 0, scale: 1.5, y: -80 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                >
                  <Heart className="w-12 h-12 fill-destructive text-destructive drop-shadow-lg" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-primary/20">
                  {post.profiles?.avatar_url ? (
                    <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary font-bold text-sm">{getInitial(post)}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{getName(post)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
              {user && post.user_id !== user.id && (
                <button onClick={() => toggleFollow(post.user_id)}
                  className={cn("text-xs px-3 py-1.5 rounded-full font-semibold transition-all",
                    followingIds.has(post.user_id) ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  )}>
                  {followingIds.has(post.user_id) ? 'Seguindo' : 'Seguir'}
                </button>
              )}
            </div>

            {/* Media */}
            {post.media_urls && post.media_urls.length > 0 && (
              <div className="relative">
                {post.media_urls[0].match(/\.(mp4|webm|mov)$/i) ? (
                  <video src={post.media_urls[0]} controls className="w-full max-h-[400px] object-cover bg-black" />
                ) : (
                  <img src={post.media_urls[0]} alt="" className="w-full max-h-[400px] object-cover" />
                )}
              </div>
            )}

            {/* PR / Workout Card */}
            {post.exercise_name && (
              <div className={cn("mx-4 mt-3 p-4 rounded-2xl relative overflow-hidden",
                post.is_pr ? "bg-gradient-to-br from-primary/15 via-accent/10 to-yellow-500/5 border border-primary/20" : "bg-secondary/40 border border-border/30"
              )}>
                {post.is_pr && (
                  <>
                    {/* Animated PR badge */}
                    <motion.div
                      initial={{ rotate: -12, scale: 0 }} animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                      className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                      <Trophy className="w-3 h-3 text-yellow-400" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-yellow-400">PR!</span>
                    </motion.div>
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]" />
                  </>
                )}
                <p className="text-base font-bold text-foreground">{post.exercise_name}</p>
                <div className="flex items-baseline gap-3 mt-1.5">
                  {post.weight && (
                    <span className="text-3xl font-black text-foreground tracking-tighter">{post.weight}<span className="text-sm font-medium text-muted-foreground ml-0.5">kg</span></span>
                  )}
                  {post.reps && (
                    <span className="text-lg text-muted-foreground font-medium">× {post.reps}</span>
                  )}
                </div>
                {post.estimated_1rm && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    <p className="text-xs text-primary font-semibold">E1RM: {post.estimated_1rm}kg</p>
                  </div>
                )}
              </div>
            )}

            {post.caption && (
              <p className="px-4 mt-3 text-sm text-foreground leading-relaxed">{post.caption}</p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 px-2 py-2 mt-2">
              <motion.button
                whileTap={{ scale: 1.3 }}
                onClick={() => toggleLike(post.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full transition-colors">
                <Heart className={cn("w-5 h-5 transition-all",
                  likedPosts.has(post.id) ? "fill-destructive text-destructive scale-110" : "text-muted-foreground"
                )} />
                <span className={cn("text-xs font-semibold",
                  likedPosts.has(post.id) ? "text-destructive" : "text-muted-foreground"
                )}>{post.likes_count}</span>
              </motion.button>
              <button onClick={() => {
                if (expandedComments === post.id) setExpandedComments(null);
                else { setExpandedComments(post.id); loadComments(post.id); }
              }} className="flex items-center gap-1.5 px-3 py-2 rounded-full transition-colors">
                <MessageCircle className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">{post.comments_count}</span>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-full transition-colors">
                <Share2 className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Comments */}
            <AnimatePresence>
              {expandedComments === post.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-border">
                  <div className="px-4 py-3 space-y-3 max-h-60 overflow-y-auto">
                    {(comments[post.id] || []).map(c => (
                      <div key={c.id} className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {(c.profiles?.display_name || c.profiles?.email?.split('@')[0] || 'A')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs">
                            <span className="font-semibold text-foreground">{c.profiles?.display_name || c.profiles?.email?.split('@')[0]}</span>{' '}
                            <span className="text-muted-foreground">{c.content}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 border-t border-border">
                    <input value={commentText} onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && submitComment(post.id)}
                      placeholder="Comentar..."
                      className="flex-1 bg-secondary rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
                    <button onClick={() => submitComment(post.id)} disabled={!commentText.trim()} className="p-2 text-primary disabled:opacity-30">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
