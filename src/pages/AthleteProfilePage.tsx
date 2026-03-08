import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { User, MapPin, Trophy, Dumbbell, Heart, MessageCircle, UserPlus, UserMinus, Instagram, Globe, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  created_at: string;
}

interface Achievement {
  title: string;
  type: string;
  icon: string | null;
  unlocked_at: string;
}

export default function AthleteProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [tab, setTab] = useState<'posts' | 'prs' | 'achievements'>('posts');
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<{ squat_pr: number; bench_pr: number; deadlift_pr: number; total: number; dots_score: number } | null>(null);

  useEffect(() => {
    if (userId) loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    if (!userId) return;
    setLoading(true);

    const [profileRes, postsRes, achievementsRes, followersRes, followingRes, followCheckRes, lbRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase.from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      supabase.from('achievements').select('title, type, icon, unlocked_at').eq('user_id', userId),
      supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', userId),
      supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', userId),
      user ? supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', userId).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from('leaderboard_scores').select('squat_pr, bench_pr, deadlift_pr, total, dots_score').eq('user_id', userId).maybeSingle(),
    ]);

    if (profileRes.data) setProfile(profileRes.data as Profile);
    if (postsRes.data) setPosts(postsRes.data as Post[]);
    if (achievementsRes.data) setAchievements(achievementsRes.data as Achievement[]);
    setFollowersCount(followersRes.count || 0);
    setFollowingCount(followingRes.count || 0);
    setIsFollowing(!!followCheckRes.data);
    if (lbRes.data) setLeaderboard(lbRes.data as any);
    setLoading(false);
  };

  const toggleFollow = async () => {
    if (!user || !userId || userId === user.id) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
      setIsFollowing(false);
      setFollowersCount(c => c - 1);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: userId });
      setIsFollowing(true);
      setFollowersCount(c => c + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Perfil não encontrado</p>
      </div>
    );
  }

  const name = profile.display_name || profile.username || profile.email?.split('@')[0] || 'Atleta';
  const prPosts = posts.filter(p => p.is_pr);
  const displayPosts = tab === 'prs' ? prPosts : posts;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border card-elevated overflow-hidden">
        {/* Cover */}
        <div className="h-24 sm:h-32 bg-gradient-to-r from-primary/20 to-accent/10" />

        <div className="px-5 pb-5">
          <div className="flex items-end gap-4 -mt-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 border-4 border-card flex items-center justify-center shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <p className="font-bold text-foreground text-lg truncate">{name}</p>
              {profile.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
            </div>
            {user && userId !== user.id && (
              <button
                onClick={toggleFollow}
                className={cn("px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0",
                  isFollowing ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground"
                )}
              >
                {isFollowing ? <UserMinus className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                {isFollowing ? 'Seguindo' : 'Seguir'}
              </button>
            )}
          </div>

          {profile.bio && <p className="text-sm text-muted-foreground mt-3">{profile.bio}</p>}

          <div className="flex items-center gap-4 mt-3">
            {profile.location && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" /> {profile.location}
              </span>
            )}
            {profile.show_bodyweight && profile.body_weight && (
              <span className="text-xs text-muted-foreground">{profile.body_weight}kg</span>
            )}
          </div>

          <div className="flex gap-6 mt-3">
            <div><span className="font-bold text-foreground text-sm">{followersCount}</span> <span className="text-xs text-muted-foreground">seguidores</span></div>
            <div><span className="font-bold text-foreground text-sm">{followingCount}</span> <span className="text-xs text-muted-foreground">seguindo</span></div>
            <div><span className="font-bold text-foreground text-sm">{posts.length}</span> <span className="text-xs text-muted-foreground">posts</span></div>
          </div>

          {/* Social Links */}
          <div className="flex gap-2 mt-3">
            {profile.instagram_url && (
              <a href={profile.instagram_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground">
                <Instagram className="w-4 h-4" />
              </a>
            )}
            {profile.website_url && (
              <a href={profile.website_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground">
                <Globe className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </motion.div>

      {/* Strength Stats */}
      {profile.show_prs && leaderboard && (
        <div className="grid grid-cols-4 gap-2">
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
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
        {[
          { key: 'posts' as const, label: 'Posts' },
          { key: 'prs' as const, label: `PRs (${prPosts.length})` },
          { key: 'achievements' as const, label: `Conquistas (${achievements.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn("flex-1 py-2 rounded-lg text-xs font-medium transition-colors",
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >{t.label}</button>
        ))}
      </div>

      {/* Content */}
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
      ) : (
        <div className="space-y-3">
          {displayPosts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhum post ainda</p>
          ) : displayPosts.map(post => (
            <div key={post.id} className="bg-card rounded-xl border border-border card-elevated p-4">
              {post.exercise_name && (
                <div className={cn("p-3 rounded-lg mb-2",
                  post.is_pr ? "bg-gradient-to-r from-primary/10 to-warning/10 border border-primary/20" : "bg-secondary/30"
                )}>
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
  );
}
