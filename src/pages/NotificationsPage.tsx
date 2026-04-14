import { useEffect } from 'react';
import { useSocialNotifications, SocialNotification } from '@/hooks/useSocialNotifications';
import { Heart, MessageCircle, UserPlus, AtSign, Trophy, Zap, Bell, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const typeConfig: Record<string, { icon: typeof Heart; color: string }> = {
  like: { icon: Heart, color: 'text-destructive' },
  comment: { icon: MessageCircle, color: 'text-primary' },
  follow: { icon: UserPlus, color: 'text-green-500' },
  mention: { icon: AtSign, color: 'text-blue-400' },
  pr: { icon: Trophy, color: 'text-warning' },
  challenge: { icon: Zap, color: 'text-purple-400' },
};

function getNotificationLink(n: SocialNotification): string | null {
  if (n.reference_type === 'post' && n.reference_id) return `/feed`;
  if (n.reference_type === 'profile' && n.actor_id) return `/athlete/${n.actor_id}`;
  if (n.type === 'follow' && n.actor_id) return `/athlete/${n.actor_id}`;
  return null;
}

export default function NotificationsPage() {
  const { notifications, loading, markAllAsRead, markAsRead } = useSocialNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handleClick = (n: SocialNotification) => {
    markAsRead(n.id);
    const link = getNotificationLink(n);
    if (link) navigate(link);
  };

  return (
    <div className="max-w-xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Nenhuma notificação ainda</p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
          {notifications.map((n, i) => {
            const config = typeConfig[n.type] || typeConfig.like;
            const Icon = config.icon;
            const actorName = n.actor_profile?.display_name || n.actor_profile?.username || 'Alguém';

            return (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => handleClick(n)}
                className={cn(
                  "w-full text-left p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors",
                  !n.is_read && "bg-primary/5"
                )}
              >
                {/* Actor avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {n.actor_profile?.avatar_url ? (
                    <img src={n.actor_profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Icon className={cn("w-5 h-5", config.color)} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm", n.is_read ? "text-muted-foreground" : "text-foreground")}>
                    <span className="font-semibold">{actorName}</span>{' '}
                    {n.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
