import { useState } from 'react';
import { X, Send, Image, MapPin, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayerLevel } from '@/hooks/usePlayerLevel';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreatePostModal({ open, onClose, onCreated }: CreatePostModalProps) {
  const { user } = useAuth();
  const { addXP } = usePlayerLevel();
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [posting, setPosting] = useState(false);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const hasVideo = files.some(f => f.type.startsWith('video'));
    if (hasVideo && files.length > 1) {
      toast.error('Envie 1 vídeo ou até 10 fotos');
      return;
    }
    if (!hasVideo && files.length + mediaFiles.length > 10) {
      toast.error('Máximo 10 fotos');
      return;
    }
    if (hasVideo && mediaFiles.length > 0) {
      toast.error('Remova as fotos antes de enviar um vídeo');
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
    if (previewIdx >= mediaPreviews.length - 1) setPreviewIdx(Math.max(0, mediaPreviews.length - 2));
  };

  const reset = () => {
    setCaption(''); setLocation(''); setMediaFiles([]); setMediaPreviews([]); setPreviewIdx(0);
  };

  const createPost = async () => {
    if (!user) return;
    setPosting(true);
    try {
      const mediaUrls: string[] = [];
      for (const file of mediaFiles) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('posts-media').upload(path, file);
        if (!error) {
          const { data: urlData } = supabase.storage.from('posts-media').getPublicUrl(path);
          mediaUrls.push(urlData.publicUrl);
        }
      }

      const hasVideo = mediaFiles.some(f => f.type.startsWith('video'));
      const mediaType = hasVideo ? 'video' : mediaUrls.length > 1 ? 'carousel' : mediaUrls.length === 1 ? 'photo' : null;

      await supabase.from('posts').insert({
        user_id: user.id,
        post_type: mediaType || 'update',
        caption: caption || null,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        media_type: mediaType,
        location: location || null,
      } as any);

      const xp = mediaUrls.length > 0 ? 60 : 40;
      await addXP(xp, 'social_post');
      toast.success(`Publicado! +${xp} XP`);
      reset();
      onClose();
      onCreated();
    } catch {
      toast.error('Erro ao publicar');
    } finally {
      setPosting(false);
    }
  };

  const canPost = caption.trim() || mediaFiles.length > 0;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}>
        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-card w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl border-t sm:border border-border max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <button onClick={() => { reset(); onClose(); }} className="text-sm text-muted-foreground">Cancelar</button>
            <h3 className="text-sm font-semibold text-foreground">Novo post</h3>
            <button onClick={createPost} disabled={!canPost || posting}
              className="text-sm font-semibold text-primary disabled:opacity-40">
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Compartilhar'}
            </button>
          </div>

          {/* Media preview */}
          {mediaPreviews.length > 0 && (
            <div className="relative aspect-square bg-secondary">
              {mediaFiles[previewIdx]?.type.startsWith('video') ? (
                <video src={mediaPreviews[previewIdx]} controls className="w-full h-full object-contain" />
              ) : (
                <img src={mediaPreviews[previewIdx]} alt="" className="w-full h-full object-contain" />
              )}
              <button onClick={() => removeMedia(previewIdx)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white">
                <X className="w-4 h-4" />
              </button>
              {mediaPreviews.length > 1 && (
                <>
                  {previewIdx > 0 && (
                    <button onClick={() => setPreviewIdx(i => i - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  {previewIdx < mediaPreviews.length - 1 && (
                    <button onClick={() => setPreviewIdx(i => i + 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {mediaPreviews.map((_, i) => (
                      <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i === previewIdx ? "bg-primary" : "bg-white/40")} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Thumbnails strip */}
          {mediaPreviews.length > 1 && (
            <div className="flex gap-1.5 px-4 py-2 overflow-x-auto">
              {mediaPreviews.map((src, i) => (
                <button key={i} onClick={() => setPreviewIdx(i)}
                  className={cn("w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2",
                    i === previewIdx ? "border-primary" : "border-transparent")}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="p-4 space-y-3">
            {/* Caption */}
            <textarea value={caption} onChange={e => setCaption(e.target.value)}
              placeholder="Escreva uma legenda... Use #hashtags e @menções"
              rows={4}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none" />

            {/* Location */}
            <div className="flex items-center gap-2 py-3 border-t border-border">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <input value={location} onChange={e => setLocation(e.target.value)}
                placeholder="Adicionar localização"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
            </div>

            {/* Add media */}
            {mediaPreviews.length === 0 && (
              <label className="flex flex-col items-center justify-center gap-3 py-12 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Image className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Toque para adicionar fotos ou vídeo</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Até 10 fotos ou 1 vídeo</p>
                </div>
                <input type="file" accept="image/*,video/*" multiple onChange={handleMediaSelect} className="hidden" />
              </label>
            )}

            {mediaPreviews.length > 0 && mediaPreviews.length < 10 && !mediaFiles.some(f => f.type.startsWith('video')) && (
              <label className="flex items-center gap-2 text-sm text-primary font-medium cursor-pointer">
                <Image className="w-4 h-4" /> Adicionar mais fotos
                <input type="file" accept="image/*" multiple onChange={handleMediaSelect} className="hidden" />
              </label>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
