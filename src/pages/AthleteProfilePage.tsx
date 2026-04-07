import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { User, MapPin, Trophy, Dumbbell, Heart, MessageCircle, UserPlus, UserMinus, Instagram, Globe, Loader2, ArrowLeft, Edit3, Grid3x3, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFollows } from '@/hooks/useFollows';
import { EditProfileModal } from '@/components/social/EditProfileModal';
import { FollowersListModal } from '@/components/social/FollowersListModal';

interface Profile {
  user_id: string;
  display_name: string | null;
  username: string | null;
  email: string | null;
  bio: string | null;
  location: string | null;
  body_weight: number | null;
  avatar_url: string | null;
  cover_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  website_url: string | null;
  profile_public: boolean;
  show_bodyweight: boolean;
  show_prs: boolean;
}

interface Post {
  id: string;
  post_type: string;
  caption: string | null;
  exercise_name: string | null;
  weight: number | null;
  reps: number | null;
  estimated_1rm: number | null;
  is_pr: boolean | null;
  likes_count: number | null;
  comments_count: number | null;
  media_urls: string[] | null;
  created_at: string;
}

interface Achievement { title: string; type: string; icon: string | null; unlocked_at: string; }

export default function AthleteProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { followingIds, toggleFollow, isFollowing: checkFollowing } = useFollows();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [tab, setTab] = useState<'posts' | 'prs' | 'achievements'>('posts');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<{ squat_pr: number; bench_pr: number; deadlift_pr: number; total: number; dots_score: number } | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showFollowersList, setShowFollowersList] = useState<'followers' | 'following' | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const isOwnProfile = user?.id === userId;

  useEffect(() => { if (userId) loadProfile(); }, [userId]);

  const loadProfile = async () => {
    if (!userId) return;
    setLoading(true);
    const [profileRes, postsRes, achievementsRes, followersRes, followingRes, lbRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase.from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      supabase.from('achievements').select('title, type, icon, unlocked_at').eq('user_id', userId),
      supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', userId),
      supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', userId),
      supabase.from('leaderboard_scores').select('squat_pr, bench_pr, deadlift_pr, total, dots_score').eq('user_id', userId).maybeSingle(),
    ]);
    if (profileRes.data) setProfile(profileRes.data as Profile);
    if (postsRes.data) setPosts(postsRes.data as Post[]);
    if (achievementsRes.data) setAchievements(achievementsRes.data as Achievement[]);
    setFollowersCount(followersRes.count || 0);
    setFollowingCount(followingRes.count || 0);
    if (lbRes.data) setLeaderboard(lbRes.data as any);
    setLoading(false);
  };

  const handleFollow = async () => {
    if (!userId) return;
    const wasFollowing = checkFollowing(userId);
    await toggleFollow(userId);
    setFollowersCount(c => wasFollowing ? c - 1 : c + 1);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!profile) return <div className="text-center py-20"><p className="text-muted-foreground">Perfil não encontrado</p></div>;

  const name = profile.display_name || profile.username || profile.email?.split('@')[0] || 'Atleta';
  const prPosts = posts.filter(p => p.is_pr);
  const displayPosts = tab === 'prs' ? prPosts : posts;

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border card-elevated overflow-hidden">
        {/* Cover */}
        <div className="h-24 sm:h-32 bg-gradient-to-r from-primary/20 to-accent/10 overflow-hidden">
          {profile.cover_url && <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />}
        </div>

        <div className="px-5 pb-5">
          <div className="flex items-end gap-4 -mt-10">
            <div className="w-20 h-20 rounded-full bg-primary/10 border-4 border-card flex items-center justify-center shrink-0 overflow-hidden">
              {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : <User className="w-10 h-10 text-primary" />}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <p className="font-bold text-foreground text-lg truncate">{name}</p>
              {profile.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            {isOwnProfile ? (
              <button onClick={() => setShowEditProfile(true)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-secondary/50 transition-colors flex items-center justify-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" /> Editar perfil
              </button>
            ) : (
              <>
                <button onClick={handleFollow}
                  className={cn("flex-1 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors",
                    checkFollowing(userId!) ? "bg-secondary text-muted-foreground hover:bg-destructive/10 hover:text-destructive" : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}>
                  {checkFollowing(userId!) ? <><UserMinus className="w-3.5 h-3.5" /> Seguindo</> : <><UserPlus className="w-3.5 h-3.5" /> Seguir</>}
                </button>
                <button onClick={() => navigate(`/feed`)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-secondary/50 transition-colors">
                  Mensagem
                </button>
              </>
            )}
          </div>

          {/* Stats row - clickable */}
          <div className="flex justify-around mt-4 py-3 border-y border-border">
            <div className="text-center">
              <p className="font-bold text-foreground text-sm">{posts.length}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <button onClick={() => setShowFollowersList('followers')} className="text-center">
              <p className="font-bold text-foreground text-sm">{followersCount}</p>
              <p className="text-xs text-muted-foreground">Seguidores</p>
            </button>
            <button onClick={() => setShowFollowersList('following')} className="text-center">
              <p className="font-bold text-foreground text-sm">{followingCount}</p>
              <p className="text-xs text-muted-foreground">Seguindo</p>
            </button>
          </div>

          {/* Bio */}
          {profile.bio && <p className="text-sm text-foreground/80 mt-3">{profile.bio}</p>}
          <div className="flex items-center gap-3 mt-2">
            {profile.location && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" /> {profile.location}
              </span>
            )}
            {profile.website_url && (
              <a href={profile.website_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate max-w-[180px]">
                {profile.website_url.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>

          {/* Social links */}
          <div className="flex gap-2 mt-2">
            {profile.instagram_url && (
              <a href={profile.instagram_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground">
                <Instagram className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </motion.div>

      {/* Strength Stats */}
      {profile.show_prs && leaderboard && (
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: 'Agachamento', val: leaderboard.squat_pr },
            { label: 'Supino', val: leaderboard.bench_pr },
            { label: 'Terra', val: leaderboard.deadlift_pr },
            { label: 'DOTS', val: leaderboard.dots_score },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-3 text-center card-elevated">
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold text-foreground">{s.val}<span className="text-xs text-muted-foreground">{s.label !== 'DOTS' ? 'kg' : ''}</span></p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 mt-4">
        {[
          { key: 'posts' as const, label: 'Posts' },
          { key: 'prs' as const, label: `PRs (${prPosts.length})` },
          { key: 'achievements' as const, label: `Conquistas (${achievements.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("flex-1 py-2 rounded-lg text-xs font-medium transition-colors",
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}>{t.label}</button>
        ))}
      </div>

      {/* View mode toggle */}
      {tab !== 'achievements' && (
        <div className="flex justify-end gap-1 mt-3">
          <button onClick={() => setViewMode('grid')} className={cn("p-1.5 rounded-lg", viewMode === 'grid' ? "bg-primary/10 text-primary" : "text-muted-foreground")}>
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')} className={cn("p-1.5 rounded-lg", viewMode === 'list' ? "bg-primary/10 text-primary" : "text-muted-foreground")}>
            <List className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="mt-3">
        {tab === 'achievements' ? (
          <div className="space-y-2">
            {achievements.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhuma conquista ainda</p>
            ) : achievements.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border card-elevated">
                <span className="text-xl">{a.icon || '🏆'}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.unlocked_at), { addSuffix: true, locale: ptBR })}</p>
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          /* Instagram-style 3-column grid */
          <div className="grid grid-cols-3 gap-0.5 rounded-xl overflow-hidden">
            {displayPosts.length === 0 ? (
              <p className="col-span-3 text-center text-sm text-muted-foreground py-12">Nenhum post ainda</p>
            ) : displayPosts.map(post => (
              <button key={post.id} onClick={() => setSelectedPost(post)}
                className="aspect-square bg-secondary relative group overflow-hidden">
                {post.media_urls && post.media_urls.length > 0 ? (
                  <img src={post.media_urls[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/5">
                    {post.is_pr ? <Trophy className="w-6 h-6 text-warning" /> : <Dumbbell className="w-6 h-6 text-primary/30" />}
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <span className="flex items-center gap-1 text-white text-sm font-medium">
                    <Heart className="w-4 h-4 fill-white" /> {post.likes_count || 0}
                  </span>
                  <span className="flex items-center gap-1 text-white text-sm font-medium">
                    <MessageCircle className="w-4 h-4 fill-white" /> {post.comments_count || 0}
                  </span>
                </div>
                {post.is_pr && (
                  <div className="absolute top-1 right-1">
                    <Trophy className="w-3.5 h-3.5 text-warning drop-shadow" />
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          /* List view */
          <div className="space-y-3">
            {displayPosts.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhum post ainda</p>
            ) : displayPosts.map(post => (
              <div key={post.id} className="bg-card rounded-xl border border-border card-elevated p-4">
                {post.exercise_name && (
                  <div className={cn("p-3 rounded-lg mb-2", post.is_pr ? "bg-gradient-to-r from-primary/10 to-warning/10 border border-primary/20" : "bg-secondary/30")}>
                    <div className="flex items-center gap-2">
                      {post.is_pr ? <Trophy className="w-4 h-4 text-warning" /> : <Dumbbell className="w-4 h-4 text-primary" />}
                      <span className="text-sm font-medium text-foreground">{post.exercise_name}</span>
                    </div>
                    <div className="flex gap-3 mt-1">
                      {post.weight && <span className="text-xs font-mono text-foreground">{post.weight}kg</span>}
                      {post.reps && <span className="text-xs text-muted-foreground">×{post.reps}</span>}
                      {post.estimated_1rm && <span className="text-xs text-primary">E1RM: {post.estimated_1rm}kg</span>}
                    </div>
                  </div>
                )}
                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="rounded-lg overflow-hidden mb-2">
                    <img src={post.media_urls[0]} alt="" className="w-full max-h-64 object-cover" />
                  </div>
                )}
                {post.caption && <p className="text-sm text-foreground">{post.caption}</p>}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes_count || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.comments_count || 0}</span>
                  <span className="ml-auto">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Detail Modal (from grid) */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedPost(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
              {selectedPost.media_urls && selectedPost.media_urls.length > 0 && (
                <img src={selectedPost.media_urls[0]} alt="" className="w-full max-h-96 object-cover" />
              )}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <span className="text-xs text-muted-foreground ml-auto">{formatDistanceToNow(new Date(selectedPost.created_at), { addSuffix: true, locale: ptBR })}</span>
                </div>
                {selectedPost.exercise_name && (
                  <div className={cn("p-3 rounded-lg", selectedPost.is_pr ? "bg-gradient-to-r from-primary/10 to-warning/10 border border-primary/20" : "bg-secondary/30")}>
                    <div className="flex items-center gap-2">
                      {selectedPost.is_pr ? <Trophy className="w-4 h-4 text-warning" /> : <Dumbbell className="w-4 h-4 text-primary" />}
                      <span className="text-sm font-medium text-foreground">{selectedPost.exercise_name}</span>
                    </div>
                    <div className="flex gap-3 mt-1">
                      {selectedPost.weight && <span className="text-sm font-mono text-foreground">{selectedPost.weight}kg</span>}
                      {selectedPost.reps && <span className="text-sm text-muted-foreground">×{selectedPost.reps}</span>}
                    </div>
                  </div>
                )}
                {selectedPost.caption && <p className="text-sm text-foreground">{selectedPost.caption}</p>}
                <div className="flex items-center gap-4 pt-2 border-t border-border text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {selectedPost.likes_count || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {selectedPost.comments_count || 0}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && profile && (
          <EditProfileModal
            profile={{
              display_name: profile.display_name || '',
              username: profile.username || '',
              bio: profile.bio || '',
              website_url: profile.website_url || '',
              avatar_url: profile.avatar_url || '',
              profile_public: profile.profile_public ?? true,
            }}
            onClose={() => setShowEditProfile(false)}
            onSave={(updated) => setProfile(p => p ? { ...p, ...updated } : p)}
          />
        )}
      </AnimatePresence>

      {/* Followers/Following List */}
      <AnimatePresence>
        {showFollowersList && userId && (
          <FollowersListModal
            userId={userId}
            type={showFollowersList}
            onClose={() => setShowFollowersList(null)}
            followingIds={followingIds}
            onToggleFollow={toggleFollow}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
