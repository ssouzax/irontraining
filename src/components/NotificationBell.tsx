import { useState } from 'react';
import { Bell, Check, CheckCheck, Dumbbell, Trophy, Flame, ArrowUpCircle } from 'lucide-react';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeIcons: Record<AppNotification['type'], typeof Dumbbell> = {
  workout_pending: Dumbbell,
  achievement_unlocked: Trophy,
  pr_achieved: Flame,
  level_up: ArrowUpCircle,
};

const typeColors: Record<AppNotification['type'], string> = {
  workout_pending: 'text-warning',
  achievement_unlocked: 'text-primary',
  pr_achieved: 'text-destructive',
  level_up: 'text-success',
};

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleClick = (n: AppNotification) => {
    markAsRead(n.id);
    if (n.link) {
      navigate(n.link);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 max-h-[400px] overflow-y-auto z-50 bg-card border border-border rounded-xl shadow-lg"
            >
              <div className="flex items-center justify-between p-3 border-b border-border">
                <span className="text-sm font-semibold text-foreground">Notificações</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" /> Marcar todas
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Nenhuma notificação
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map(n => {
                    const Icon = typeIcons[n.type];
                    return (
                      <button
                        key={n.id}
                        onClick={() => handleClick(n)}
                        className={cn(
                          "w-full text-left p-3 hover:bg-muted/50 transition-colors flex items-start gap-3",
                          !n.read && "bg-primary/5"
                        )}
                      >
                        <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", typeColors[n.type])} />
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm", n.read ? "text-muted-foreground" : "text-foreground font-medium")}>
                            {n.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {formatDistanceToNow(n.timestamp, { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
