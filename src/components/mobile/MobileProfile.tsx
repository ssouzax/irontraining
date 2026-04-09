import { useState, useEffect, useRef } from 'react';
import { useGroups } from '@/hooks/useGroups';
import { User, Camera, MapPin, Save, Instagram, Youtube, Edit3, Trophy, Shield, Loader2, X, Award, Dumbbell, Globe, LogOut, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayerLevel } from '@/hooks/usePlayerLevel';
import { PRConfigSection } from './PRConfigSection';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProfileData {
  display_name: string;
  username: string;
  bio: string;
  location: string;
  avatar_url: string;
  cover_url: string;
  instagram_url: string;
  youtube_url: string;
  tiktok_url: string;
  website_url: string;
  body_weight: number | null;
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

type Tab = 'posts' | 'prs' | 'achievements' | 'workouts' | 'groups';

export function MobileProfile() {
  const { user, signOut } = useAuth();
  const { playerLevel } = usePlayerLevel();
  const { myGroups } = useGroups();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    display_name: '', username: '', bio: '', location: '',
    avatar_url: '', cover_url: '', instagram_url: '', youtube_url: '',
    tiktok_url: '', website_url: '', body_weight: null,
    profile_public: true, show_bodyweight: true, show_prs: true,
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [achievementsCount, setAchievementsCount] = useState(0);
  const [tab, setTab] = useState<Tab>('posts');
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  // Removed hardcoded lift calculations - PRs are now in PRConfigSection

  useEffect(() => { if (user) loadAll(); }, [user]);

  const loadAll = async () => {
    if (!user) return;
    const [profileRes, postsRes, followersRes, followingRes, achRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', user.id),
      supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', user.id),
      supabase.from('achievements').select('id', { count: 'exact' }).eq('user_id', user.id),
    ]);

    if (profileRes.data) {
      const p = profileRes.data as any;
      setProfile({
        display_name: p.display_name || '', username: p.username || '',
        bio: p.bio || '', location: p.location || '',
        avatar_url: p.avatar_url || '', cover_url: p.cover_url || '',
        instagram_url: p.instagram_url || '', youtube_url: p.youtube_url || '',
        tiktok_url: p.tiktok_url || '', website_url: p.website_url || '',
        body_weight: p.body_weight, profile_public: p.profile_public ?? true,
        show_bodyweight: p.show_bodyweight ?? true, show_prs: p.show_prs ?? true,
      });
    }
    if (postsRes.data) setPosts(postsRes.data as Post[]);
    setFollowersCount(followersRes.count || 0);
    setFollowingCount(followingRes.count || 0);
    setAchievementsCount(achRes.count || 0);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({
      display_name: profile.display_name || null,
      username: profile.username || null,
      bio: profile.bio || null,
      location: profile.location || null,
      instagram_url: profile.instagram_url || null,
      youtube_url: profile.youtube_url || null,
      tiktok_url: profile.tiktok_url || null,
      website_url: profile.website_url || null,
      body_weight: profile.body_weight,
      profile_public: profile.profile_public,
      show_bodyweight: profile.show_bodyweight,
      show_prs: profile.show_prs,
    }).eq('user_id', user.id);
    setSaving(false);
    toast.success('Perfil salvo!');
    setEditing(false);
  };

  const uploadFile = async (file: File, type: 'avatar' | 'cover') => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${type}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('social-media').upload(path, file, { upsert: true });
    if (error) { toast.error('Erro no upload'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('social-media').getPublicUrl(path);
    const field = type === 'avatar' ? 'avatar_url' : 'cover_url';
    await supabase.from('profiles').update({ [field]: publicUrl } as any).eq('user_id', user.id);
    setProfile(p => ({ ...p, [field]: publicUrl }));
    setUploading(false);
    toast.success('Foto atualizada!');
  };

  const name = profile.display_name || profile.username || user?.email?.split('@')[0] || 'Atleta';
  const prPosts = posts.filter(p => p.is_pr);
  const displayPosts = tab === 'prs' ? prPosts : posts;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="pb-4">
      <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], 'avatar')} />
      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], 'cover')} />

      {/* Cover */}
      <div className="relative h-32 bg-gradient-to-r from-primary/20 to-accent/10 overflow-hidden" onClick={() => coverRef.current?.click()}>
        {profile.cover_url && <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 active:bg-black/20 transition-colors">
          <Camera className="w-5 h-5 text-white/50" />
        </div>
      </div>

      {/* Avatar + Name */}
      <div className="px-4 -mt-12 relative z-10">
        <div className="flex items-end gap-3">
          <div className="relative" onClick={() => avatarRef.current?.click()}>
            <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-background flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-primary" />
              )}
            </div>
            {uploading && <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-white" /></div>}
          </div>
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-2">
              <button onClick={() => editing ? handleSave() : setEditing(true)}
                disabled={saving}
                className={cn("px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-colors",
                  editing ? "bg-primary text-primary-foreground" : "border border-border text-foreground"
                )}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : editing ? <Save className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                {editing ? 'Salvar' : 'Editar'}
              </button>
              <button onClick={signOut} className="px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground flex items-center gap-1">
                <LogOut className="w-3 h-3" /> Sair
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <p className="text-lg font-bold text-foreground">{name}</p>
          {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
          {profile.bio && !editing && <p className="text-sm text-foreground/80 mt-1">{profile.bio}</p>}
          {profile.location && !editing && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" /> {profile.location}
            </p>
          )}

          {/* Player Level */}
          {playerLevel && (
            <div className="flex items-center gap-2 mt-2">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">Nível {playerLevel.player_level}</span>
              <span className="text-xs text-muted-foreground">• {playerLevel.title}</span>
            </div>
          )}

          {/* Social Links */}
          {!editing && (
            <div className="flex gap-2 mt-2">
              {profile.instagram_url && <a href={profile.instagram_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-full bg-secondary text-muted-foreground"><Instagram className="w-4 h-4" /></a>}
              {profile.youtube_url && <a href={profile.youtube_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-full bg-secondary text-muted-foreground"><Youtube className="w-4 h-4" /></a>}
              {profile.website_url && <a href={profile.website_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-full bg-secondary text-muted-foreground"><Globe className="w-4 h-4" /></a>}
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-5 mt-3">
            <div><span className="font-bold text-foreground text-sm">{followersCount}</span> <span className="text-xs text-muted-foreground">seguidores</span></div>
            <div><span className="font-bold text-foreground text-sm">{followingCount}</span> <span className="text-xs text-muted-foreground">seguindo</span></div>
            <div><span className="font-bold text-foreground text-sm">{posts.length}</span> <span className="text-xs text-muted-foreground">posts</span></div>
          </div>
        </div>
      </div>

      {/* Customizable PRs Section */}
      <PRConfigSection />

      {/* Edit Form */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden px-4 mt-4">
            <div className="space-y-3 bg-card rounded-xl border border-border p-4">
              <input value={profile.display_name} onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))}
                className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground" placeholder="Nome" />
              <input value={profile.username} onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
                className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground" placeholder="@username" />
              <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3}
                className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground resize-none" placeholder="Bio" />
              <input value={profile.location} onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
                className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground" placeholder="Localização" />
              <input value={profile.instagram_url} onChange={e => setProfile(p => ({ ...p, instagram_url: e.target.value }))}
                className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground" placeholder="Instagram URL" />
              <input value={profile.youtube_url} onChange={e => setProfile(p => ({ ...p, youtube_url: e.target.value }))}
                className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground" placeholder="YouTube URL" />
              <input value={profile.tiktok_url} onChange={e => setProfile(p => ({ ...p, tiktok_url: e.target.value }))}
                className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground" placeholder="TikTok URL" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Tabs */}
      <div className="flex border-b border-border mt-4 overflow-x-auto">
        {([
          { key: 'posts' as Tab, label: 'Posts', icon: Dumbbell },
          { key: 'prs' as Tab, label: 'PRs', icon: Trophy },
          { key: 'groups' as Tab, label: 'Grupos', icon: Users },
          { key: 'achievements' as Tab, label: 'Conquistas', icon: Award },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors border-b-2 whitespace-nowrap min-w-0",
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            )}>
            <t.icon className="w-4 h-4 shrink-0" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Groups */}
      {tab === 'groups' && (
        <div className="px-4 mt-4 space-y-3">
          {myGroups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum grupo ainda</p>
            </div>
          ) : myGroups.map(g => (
            <div key={g.id} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{g.name}</p>
                <p className="text-xs text-muted-foreground">{g.member_count} membros</p>
              </div>
              {g.is_private && <span className="text-[10px] bg-warning/10 text-warning px-2 py-0.5 rounded-full">Privado</span>}
            </div>
          ))}
        </div>
      )}

      {/* Posts Grid */}
      {tab !== 'groups' && <div className="px-4 mt-4 space-y-3">
        {displayPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">Nenhum {tab === 'prs' ? 'PR' : 'post'} ainda</p>
          </div>
        ) : displayPosts.map(post => (
          <div key={post.id} className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center gap-2 mb-2">
              {post.is_pr && <Trophy className="w-3.5 h-3.5 text-warning" />}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
            {post.exercise_name && (
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-foreground">{post.exercise_name}</span>
                {post.weight && <span className="text-lg font-extrabold text-foreground">{post.weight}kg</span>}
                {post.reps && <span className="text-sm text-muted-foreground">× {post.reps}</span>}
              </div>
            )}
            {post.caption && <p className="text-sm text-foreground/80 mt-1">{post.caption}</p>}
            {post.media_urls && post.media_urls.length > 0 && (
              <div className="mt-2 rounded-lg overflow-hidden">
                <img src={post.media_urls[0]} alt="" className="w-full max-h-48 object-cover" />
              </div>
            )}
          </div>
        ))}
      </div>}
    </div>
  );
}
