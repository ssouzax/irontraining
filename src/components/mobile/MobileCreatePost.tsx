import { useState } from 'react';
import { Image, X, Send, Loader2, Camera, Trophy, Dumbbell, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayerLevel } from '@/hooks/usePlayerLevel';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const POST_TYPES = [
  { value: 'update', label: 'Post', icon: FileText },
  { value: 'pr', label: 'PR', icon: Trophy },
  { value: 'workout', label: 'Treino', icon: Dumbbell },
  { value: 'photo', label: 'Foto', icon: Camera },
];

interface Props {
  onPostCreated: () => void;
}

export function MobileCreatePost({ onPostCreated }: Props) {
  const { user } = useAuth();
  const { addXP } = usePlayerLevel();
  const [postType, setPostType] = useState('update');
  const [caption, setCaption] = useState('');
  const [exerciseName, setExerciseName] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rir, setRir] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + mediaFiles.length > 4) {
      toast.error('Máximo 4 arquivos');
      return;
    }
    setMediaFiles(prev => [...prev, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = () => setMediaPreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeMedia = (idx: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== idx));
    setMediaPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const createPost = async () => {
    if (!user) return;
    setPosting(true);
    try {
      const mediaUrls: string[] = [];
      for (const file of mediaFiles) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('social-media').upload(path, file);
        if (!error) {
          const { data: urlData } = supabase.storage.from('social-media').getPublicUrl(path);
          mediaUrls.push(urlData.publicUrl);
        }
      }

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
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
      });

      const postXP = mediaUrls.length > 0 ? 60 : (postType === 'pr' ? 80 : 40);
      await addXP(postXP, 'social_post');
      toast.success(`Publicado! +${postXP} XP`);
      onPostCreated();
    } catch {
      toast.error('Erro ao publicar');
    } finally {
      setPosting(false);
    }
  };

  const showExerciseFields = postType === 'pr' || postType === 'workout';
  const canPost = caption.trim() || exerciseName || mediaFiles.length > 0;

  return (
    <div className="p-4 space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground">Criar Post</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Compartilhe seu treino</p>
      </motion.div>

      {/* Post Type Selector */}
      <div className="grid grid-cols-4 gap-2">
        {POST_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => setPostType(t.value)}
            className={cn(
              "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
              postType === t.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground"
            )}
          >
            <t.icon className="w-5 h-5" />
            <span className="text-[11px] font-medium">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Caption */}
      <textarea
        value={caption}
        onChange={e => setCaption(e.target.value)}
        placeholder="O que você quer compartilhar?"
        rows={4}
        className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
      />

      {/* Exercise Fields */}
      {showExerciseFields && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
          <input
            value={exerciseName}
            onChange={e => setExerciseName(e.target.value)}
            placeholder="Exercício (ex: Agachamento)"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Peso (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="0"
                className="w-full bg-card border border-border rounded-xl px-3 py-3 text-center text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Reps</label>
              <input
                type="number"
                value={reps}
                onChange={e => setReps(e.target.value)}
                placeholder="0"
                className="w-full bg-card border border-border rounded-xl px-3 py-3 text-center text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">RIR</label>
              <input
                type="number"
                value={rir}
                onChange={e => setRir(e.target.value)}
                placeholder="—"
                className="w-full bg-card border border-border rounded-xl px-3 py-3 text-center text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          {weight && reps && (
            <div className="text-center p-3 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground">E1RM Estimado</p>
              <p className="text-2xl font-extrabold text-primary">
                {Math.round(parseFloat(weight) * (1 + parseInt(reps) / 30) * 10) / 10}
                <span className="text-sm font-medium ml-0.5">kg</span>
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Media Previews */}
      {mediaPreviews.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {mediaPreviews.map((src, i) => (
            <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-border">
              {mediaFiles[i]?.type.startsWith('video') ? (
                <video src={src} className="w-full h-full object-cover" />
              ) : (
                <img src={src} alt="" className="w-full h-full object-cover" />
              )}
              <button onClick={() => removeMedia(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center">
                <X className="w-3.5 h-3.5 text-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Media */}
      <label className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border cursor-pointer active:bg-secondary transition-colors">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <Image className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Adicionar mídia</p>
          <p className="text-[11px] text-muted-foreground">Fotos ou vídeos do treino</p>
        </div>
        <input type="file" accept="image/*,video/*" multiple onChange={handleMediaSelect} className="hidden" />
      </label>

      {/* Submit */}
      <button
        onClick={createPost}
        disabled={posting || !canPost}
        className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold text-base hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
      >
        {posting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        Publicar
      </button>
    </div>
  );
}
