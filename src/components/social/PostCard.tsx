import { useState, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface PostCardProps {
  post: {
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
  };
  isLiked: boolean;
  isSaved?: boolean;
  onToggleLike: (postId: string) => void;
  onOpenComments: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
  onToggleSave?: (postId: string) => void;
  isOwn?: boolean;
}

export function PostCard({ post, isLiked, isSaved = false, onToggleLike, onOpenComments, onDeletePost, onToggleSave, isOwn }: PostCardProps) {
  const navigate = useNavigate();
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const lastTapRef = useRef(0);
  const mediaCount = post.media_urls?.length || 0;

  const profileName = post.profiles?.display_name || post.profiles?.username || post.profiles?.email?.split('@')[0] || 'Atleta';
  const username = post.profiles?.username || profileName;

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!isLiked) onToggleLike(post.id);
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 900);
    }
    lastTapRef.current = now;
  }, [isLiked, onToggleLike, post.id]);

  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    video.paused ? video.play() : video.pause();
  };

  const caption = post.caption || '';
  const isCaptionLong = caption.length > 120;

  return (
    <div className="bg-card border-y border-border sm:rounded-xl sm:border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <button onClick={() => navigate(`/athlete/${post.user_id}`)} className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs overflow-hidden shrink-0">
            {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
              : profileName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{username}</p>
            {post.location && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 truncate">
                <MapPin className="w-2.5 h-2.5 shrink-0" /> {post.location}
              </p>
            )}
          </div>
        </button>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-1 text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 z-10 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
              <button onClick={() => { navigator.clipboard.writeText(window.location.origin + `/social`); setShowMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-secondary">Copiar link</button>
              {isOwn && onDeletePost && (
                <button onClick={() => { onDeletePost(post.id); setShowMenu(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-destructive hover:bg-secondary">Excluir post</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PR/Workout badge */}
      {post.is_pr && post.exercise_name && (
        <div className="mx-3 mb-2 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-warning/10 border border-primary/20">
          <p className="text-[10px] font-bold uppercase tracking-wider text-warning mb-0.5">🏆 NOVO PR!</p>
          <p className="text-sm font-bold text-foreground">{post.exercise_name}</p>
          <div className="flex gap-3 mt-0.5">
            {post.weight && <span className="text-sm font-mono text-foreground">{post.weight}kg</span>}
            {post.reps && <span className="text-sm text-muted-foreground">×{post.reps}</span>}
            {post.estimated_1rm && <span className="text-xs text-primary ml-1">E1RM: {post.estimated_1rm}kg</span>}
          </div>
        </div>
      )}
      {!post.is_pr && post.exercise_name && (
        <div className="mx-3 mb-2 p-2.5 rounded-lg bg-secondary/40 flex items-center gap-2">
          <span className="text-sm">💪</span>
          <span className="text-sm font-medium text-foreground">{post.exercise_name}</span>
          {post.weight && <span className="text-xs font-mono text-muted-foreground ml-auto">{post.weight}kg ×{post.reps}</span>}
        </div>
      )}

      {/* Media carousel */}
      {post.media_urls && mediaCount > 0 && (
        <div className="relative" onClick={handleDoubleTap}>
          <div className="aspect-square bg-secondary overflow-hidden">
            {post.media_urls[carouselIdx]?.match(/\.(mp4|mov|webm)$/i) ? (
              <video src={post.media_urls[carouselIdx]} className="w-full h-full object-cover" playsInline
                onClick={handleVideoClick} />
            ) : (
              <img src={post.media_urls[carouselIdx]} alt="" className="w-full h-full object-cover" loading="lazy" />
            )}
          </div>
          {mediaCount > 1 && (
            <>
              {carouselIdx > 0 && (
                <button onClick={(e) => { e.stopPropagation(); setCarouselIdx(i => i - 1); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white/80">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {carouselIdx < mediaCount - 1 && (
                <button onClick={(e) => { e.stopPropagation(); setCarouselIdx(i => i + 1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white/80">
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {post.media_urls.map((_, i) => (
                  <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all",
                    i === carouselIdx ? "bg-primary w-3" : "bg-white/50")} />
                ))}
              </div>
            </>
          )}
          <AnimatePresence>
            {showHeartAnim && (
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }} transition={{ duration: 0.4 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Heart className="w-20 h-20 text-white fill-white drop-shadow-lg" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-4">
          <button onClick={() => onToggleLike(post.id)} className="transition-transform active:scale-125">
            <Heart className={cn("w-6 h-6 transition-colors",
              isLiked ? "text-destructive fill-destructive" : "text-foreground")} />
          </button>
          <button onClick={() => onOpenComments(post.id)}>
            <MessageCircle className="w-6 h-6 text-foreground" />
          </button>
          <button><Share2 className="w-5 h-5 text-foreground" /></button>
        </div>
        <button onClick={() => onToggleSave?.(post.id)}>
          <Bookmark className={cn("w-6 h-6 transition-colors",
            isSaved ? "text-primary fill-primary" : "text-foreground")} />
        </button>
      </div>

      {/* Likes count */}
      {post.likes_count > 0 && (
        <p className="px-3 text-sm font-semibold text-foreground">{post.likes_count.toLocaleString()} curtida{post.likes_count !== 1 ? 's' : ''}</p>
      )}

      {/* Caption */}
      {caption && (
        <p className="px-3 text-sm text-foreground mt-0.5">
          <button onClick={() => navigate(`/athlete/${post.user_id}`)} className="font-semibold mr-1">{username}</button>
          {isCaptionLong && !captionExpanded ? (
            <>{caption.slice(0, 120)}... <button onClick={() => setCaptionExpanded(true)} className="text-muted-foreground">mais</button></>
          ) : caption}
        </p>
      )}

      {/* Comments preview */}
      {post.comments_count > 0 && (
        <button onClick={() => onOpenComments(post.id)} className="px-3 mt-1 text-sm text-muted-foreground">
          Ver {post.comments_count > 1 ? `todos os ${post.comments_count} comentários` : '1 comentário'}
        </button>
      )}

      {/* Timestamp */}
      <p className="px-3 pt-1 pb-3 text-[10px] text-muted-foreground uppercase">
        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
      </p>
    </div>
  );
}
