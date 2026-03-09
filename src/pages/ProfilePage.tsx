import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { User, Camera, MapPin, Dumbbell, Target, Save, Instagram, Globe, Youtube, Edit3, Trophy, Shield, Loader2, X, Crown } from 'lucide-react';
import SubscriptionManager from '@/components/SubscriptionManager';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTraining } from '@/contexts/TrainingContext';
import { calculate1RM } from '@/data/defaultProfile';
import { usePlayerLevel } from '@/hooks/usePlayerLevel';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
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
  whatsapp: string;
  body_weight: number | null;
  profile_public: boolean;
  show_bodyweight: boolean;
  show_prs: boolean;
  gym_class: string | null;
  coach_personality: string;
}

interface GymClass {
  id: string;
  name: string;
  description: string;
  icon: string;
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

const GYM_CLASS_ICONS: Record<string, string> = {
  powerlifter: '🏋️', bodybuilder: '💪', powerbuilder: '⚡', hybrid: '🔥', strength: '🎯',
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile: trainingProfile } = useTraining();
  const { playerLevel } = usePlayerLevel();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    display_name: '', username: '', bio: '', location: '',
    avatar_url: '', cover_url: '', instagram_url: '', youtube_url: '',
    tiktok_url: '', website_url: '', whatsapp: '', body_weight: null,
    profile_public: true, show_bodyweight: true, show_prs: true,
    gym_class: null, coach_personality: 'motivational',
  });
  const [gymClasses, setGymClasses] = useState<GymClass[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [achievementsCount, setAchievementsCount] = useState(0);
  const [tab, setTab] = useState<'posts' | 'prs' | 'stats' | 'plan'>('posts');
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const squat1RM = calculate1RM(trainingProfile.currentLifts.squat.weight, trainingProfile.currentLifts.squat.reps);
  const bench1RM = calculate1RM(trainingProfile.currentLifts.bench.weight, trainingProfile.currentLifts.bench.reps);
  const deadlift1RM = calculate1RM(trainingProfile.currentLifts.deadlift.weight, trainingProfile.currentLifts.deadlift.reps);
  const total = squat1RM + bench1RM + deadlift1RM;

  useEffect(() => { if (user) loadAll(); }, [user]);

  const loadAll = async () => {
    if (!user) return;
    const [profileRes, classesRes, postsRes, followersRes, followingRes, achRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('gym_classes').select('*'),
      supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', user.id),
      supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', user.id),
      supabase.from('achievements').select('id', { count: 'exact' }).eq('user_id', user.id),
    ]);

    if (profileRes.data) {
      const p = profileRes.data as any;
      setProfile({
        display_name: p.display_name || '',
        username: p.username || '',
        bio: p.bio || '',
        location: p.location || '',
        avatar_url: p.avatar_url || '',
        cover_url: p.cover_url || '',
        instagram_url: p.instagram_url || '',
        youtube_url: p.youtube_url || '',
        tiktok_url: p.tiktok_url || '',
        website_url: p.website_url || '',
        body_weight: p.body_weight,
        profile_public: p.profile_public ?? true,
        show_bodyweight: p.show_bodyweight ?? true,
        show_prs: p.show_prs ?? true,
        gym_class: p.gym_class || null,
        coach_personality: p.coach_personality || 'motivational',
      });
    }
    if (classesRes.data) setGymClasses(classesRes.data as GymClass[]);
    if (postsRes.data) setPosts(postsRes.data as Post[]);
    setFollowersCount(followersRes.count || 0);
    setFollowingCount(followingRes.count || 0);
    setAchievementsCount(achRes.count || 0);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      display_name: profile.display_name || null,
      username: profile.username || null,
      bio: profile.bio || null,
      location: profile.location || null,
      instagram_url: profile.instagram_url || null,
      youtube_url: profile.youtube_url || null,
      tiktok_url: profile.tiktok_url || null,
      website_url: profile.website_url || null,
      whatsapp: profile.whatsapp || null,
      body_weight: profile.body_weight,
      profile_public: profile.profile_public,
      show_bodyweight: profile.show_bodyweight,
      show_prs: profile.show_prs,
      gym_class: profile.gym_class,
      coach_personality: profile.coach_personality,
    }).eq('user_id', user.id);

    setSaving(false);
    if (error) toast.error('Erro ao salvar perfil');
    else { toast.success('Perfil salvo!'); setEditing(false); }
  };

  const uploadFile = async (file: File, type: 'avatar' | 'cover') => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${type}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('social-media').upload(path, file, { upsert: true });
    if (uploadError) { toast.error('Erro no upload'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('social-media').getPublicUrl(path);
    const field = type === 'avatar' ? 'avatar_url' : 'cover_url';
    await supabase.from('profiles').update({ [field]: publicUrl }).eq('user_id', user.id);
    setProfile(p => ({ ...p, [field]: publicUrl }));
    setUploading(false);
    toast.success(`${type === 'avatar' ? 'Foto' : 'Capa'} atualizada!`);
  };

  const name = profile.display_name || profile.username || user?.email?.split('@')[0] || 'Atleta';
  const prPosts = posts.filter(p => p.is_pr);
  const displayPosts = tab === 'prs' ? prPosts : posts;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], 'avatar')} />
      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], 'cover')} />

      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border card-elevated overflow-hidden">
        {/* Cover */}
        <div className="relative h-28 sm:h-36 bg-gradient-to-r from-primary/20 to-accent/10 overflow-hidden group cursor-pointer"
          onClick={() => coverRef.current?.click()}>
          {profile.cover_url && <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="flex items-end gap-4 -mt-10">
            {/* Avatar */}
            <div className="relative group cursor-pointer shrink-0" onClick={() => avatarRef.current?.click()}>
              <div className="w-20 h-20 rounded-full bg-primary/10 border-4 border-card flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-primary" />
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {uploading && <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-white" /></div>}
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <p className="font-bold text-foreground text-lg truncate">{name}</p>
              {profile.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
            </div>

            <button onClick={() => editing ? handleSave() : setEditing(true)}
              disabled={saving}
              className={cn("px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0",
                editing ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              )}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editing ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              {editing ? 'Salvar' : 'Editar'}
            </button>
          </div>

          {/* Gym Class Badge */}
          {profile.gym_class && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <span>{GYM_CLASS_ICONS[profile.gym_class] || '🏋️'}</span>
              <span className="text-xs font-medium text-primary">{gymClasses.find(c => c.id === profile.gym_class)?.name || profile.gym_class}</span>
            </div>
          )}

          {/* Player Level */}
          {playerLevel && (
            <div className="mt-2 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">Nível {playerLevel.player_level}</span>
              <span className="text-xs text-muted-foreground">• {playerLevel.title}</span>
            </div>
          )}

          {profile.bio && !editing && <p className="text-sm text-muted-foreground mt-3">{profile.bio}</p>}
          {profile.location && !editing && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
              <MapPin className="w-3 h-3" /> {profile.location}
            </span>
          )}

          {/* Stats row */}
          <div className="flex gap-6 mt-3">
            <div><span className="font-bold text-foreground text-sm">{followersCount}</span> <span className="text-xs text-muted-foreground">seguidores</span></div>
            <div><span className="font-bold text-foreground text-sm">{followingCount}</span> <span className="text-xs text-muted-foreground">seguindo</span></div>
            <div><span className="font-bold text-foreground text-sm">{posts.length}</span> <span className="text-xs text-muted-foreground">posts</span></div>
            <div><span className="font-bold text-foreground text-sm">{achievementsCount}</span> <span className="text-xs text-muted-foreground">conquistas</span></div>
          </div>

          {/* Social Links */}
          {!editing && (
            <div className="flex gap-2 mt-3">
              {profile.instagram_url && <a href={profile.instagram_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground"><Instagram className="w-4 h-4" /></a>}
              {profile.youtube_url && <a href={profile.youtube_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground"><Youtube className="w-4 h-4" /></a>}
              {profile.website_url && <a href={profile.website_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground"><Globe className="w-4 h-4" /></a>}
            </div>
          )}
        </div>
      </motion.div>

      {/* Edit Form */}
      {editing && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-5 card-elevated space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Editar Perfil</h3>
            <button onClick={() => setEditing(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
              <input value={profile.display_name} onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="Seu nome" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Username</label>
              <input value={profile.username} onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="@username" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
            <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none" placeholder="Conte sobre você..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Localização</label>
              <input value={profile.location} onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="São Paulo, BR" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Peso Corporal (kg)</label>
              <input type="number" value={profile.body_weight || ''} onChange={e => setProfile(p => ({ ...p, body_weight: e.target.value ? Number(e.target.value) : null }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Redes Sociais</p>
            <div className="grid grid-cols-1 gap-2">
              <input value={profile.instagram_url} onChange={e => setProfile(p => ({ ...p, instagram_url: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="https://instagram.com/..." />
              <input value={profile.youtube_url} onChange={e => setProfile(p => ({ ...p, youtube_url: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="https://youtube.com/..." />
              <input value={profile.tiktok_url} onChange={e => setProfile(p => ({ ...p, tiktok_url: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="https://tiktok.com/..." />
              <input value={profile.website_url} onChange={e => setProfile(p => ({ ...p, website_url: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="https://seusite.com" />
            </div>
          </div>

          {/* Gym Class Selector */}
          <div>
            <p className="text-xs font-medium text-foreground mb-2">Classe de Treino</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {gymClasses.map(gc => (
                <button key={gc.id} onClick={() => setProfile(p => ({ ...p, gym_class: p.gym_class === gc.id ? null : gc.id }))}
                  className={cn("p-3 rounded-xl border text-left transition-colors",
                    profile.gym_class === gc.id ? "border-primary bg-primary/10" : "border-border bg-secondary hover:border-primary/30"
                  )}>
                  <span className="text-lg">{gc.icon}</span>
                  <p className="text-xs font-medium text-foreground mt-1">{gc.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{gc.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Privacidade</p>
            {[
              { key: 'profile_public', label: 'Perfil público' },
              { key: 'show_bodyweight', label: 'Mostrar peso corporal' },
              { key: 'show_prs', label: 'Mostrar PRs' },
            ].map(opt => (
              <label key={opt.key} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={(profile as any)[opt.key]}
                  onChange={e => setProfile(p => ({ ...p, [opt.key]: e.target.checked }))}
                  className="rounded border-border" />
                {opt.label}
              </label>
            ))}
          </div>
        </motion.div>
      )}

      {/* Strength Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Agachamento', val: squat1RM },
          { label: 'Supino', val: bench1RM },
          { label: 'Terra', val: deadlift1RM },
          { label: 'Total', val: total },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-3 text-center card-elevated">
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
            <p className="text-lg font-bold text-foreground">{s.val}<span className="text-xs text-muted-foreground">kg</span></p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
        {([
          { key: 'posts' as const, label: `Posts (${posts.length})` },
          { key: 'prs' as const, label: `PRs (${prPosts.length})` },
          { key: 'stats' as const, label: 'Dados' },
          { key: 'plan' as const, label: '👑 Plano' },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("flex-1 py-2 rounded-lg text-xs font-medium transition-colors",
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'plan' ? (
        <SubscriptionManager />
      ) : tab === 'stats' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border border-border p-5 card-elevated space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Objetivos
          </h3>
          <p className="text-sm text-muted-foreground">{trainingProfile.goals}</p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Agachamento → {trainingProfile.targetProgression.squat}</p>
            <p className="text-xs text-muted-foreground">Terra → {trainingProfile.targetProgression.deadlift}</p>
            <p className="text-xs text-muted-foreground">Supino → {trainingProfile.targetProgression.bench}</p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {displayPosts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              {tab === 'prs' ? 'Nenhum PR postado ainda' : 'Nenhum post ainda'}
            </p>
          ) : displayPosts.map(post => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border card-elevated p-4">
              {post.exercise_name && (
                <div className={cn("p-3 rounded-lg mb-2",
                  post.is_pr ? "bg-gradient-to-r from-primary/10 to-yellow-500/10 border border-primary/20" : "bg-secondary/30"
                )}>
                  <div className="flex items-center gap-2">
                    {post.is_pr ? <Trophy className="w-4 h-4 text-yellow-400" /> : <Dumbbell className="w-4 h-4 text-primary" />}
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
                <div className="flex gap-2 mb-2 overflow-x-auto">
                  {post.media_urls.map((url, i) => (
                    <img key={i} src={url} alt="" className="h-32 rounded-lg object-cover" />
                  ))}
                </div>
              )}
              {post.caption && <p className="text-sm text-foreground">{post.caption}</p>}
              <p className="text-xs text-muted-foreground mt-2">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
